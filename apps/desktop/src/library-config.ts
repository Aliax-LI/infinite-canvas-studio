import {
  mkdir,
  readFile,
  rename,
  stat,
  statfs,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import type { LibraryBootstrap, LibraryLocation } from "@ics/contracts";

const configurationVersion = 1;

interface StoredLibraryConfiguration {
  version: number;
  root: string;
}

export async function loadLibraryBootstrap(
  configurationPath: string,
  recommendedPath: string,
): Promise<LibraryBootstrap> {
  const recommended = await inspectStorageDirectory(recommendedPath);
  const stored = await readConfiguration(configurationPath);
  if (!stored) return { status: "unconfigured", recommended };

  try {
    const info = await stat(stored.root);
    if (!info.isDirectory()) throw new Error("资料库路径不是目录。");
    return {
      status: "ready",
      location: await inspectStorageDirectory(stored.root),
    };
  } catch {
    return {
      status: "missing",
      path: stored.root,
      message:
        "上次使用的资料库路径不可访问。请重新选择资料库，原有数据不会被覆盖。",
      recommended,
    };
  }
}

export async function saveLibraryRoot(
  configurationPath: string,
  libraryRoot: string,
): Promise<LibraryLocation> {
  if (!path.isAbsolute(libraryRoot)) {
    throw new Error("资料库路径必须是绝对路径。");
  }

  const resolvedRoot = path.resolve(libraryRoot);
  await mkdir(resolvedRoot, { recursive: true });
  const info = await stat(resolvedRoot);
  if (!info.isDirectory()) throw new Error("资料库路径不是目录。");

  const configuration: StoredLibraryConfiguration = {
    version: configurationVersion,
    root: resolvedRoot,
  };
  const temporaryPath = `${configurationPath}.tmp`;
  await mkdir(path.dirname(configurationPath), { recursive: true });
  await writeFile(temporaryPath, JSON.stringify(configuration), "utf8");
  await rename(temporaryPath, configurationPath);
  return inspectStorageDirectory(resolvedRoot);
}

export async function inspectStorageDirectory(
  directoryPath: string,
): Promise<LibraryLocation> {
  if (!path.isAbsolute(directoryPath)) {
    throw new Error("资料库路径必须是绝对路径。");
  }
  const resolvedPath = path.resolve(directoryPath);
  const existingPath = await findExistingAncestor(resolvedPath);
  const filesystem = await statfs(existingPath);
  return {
    path: resolvedPath,
    availableBytes: Number(filesystem.bavail) * Number(filesystem.bsize),
  };
}

async function readConfiguration(
  configurationPath: string,
): Promise<StoredLibraryConfiguration | null> {
  try {
    const parsed: unknown = JSON.parse(
      await readFile(configurationPath, "utf8"),
    );
    return isStoredLibraryConfiguration(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isStoredLibraryConfiguration(
  value: unknown,
): value is StoredLibraryConfiguration {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredLibraryConfiguration>;
  return (
    candidate.version === configurationVersion &&
    typeof candidate.root === "string" &&
    path.isAbsolute(candidate.root)
  );
}

async function findExistingAncestor(directoryPath: string): Promise<string> {
  let candidate = directoryPath;
  while (true) {
    try {
      const info = await stat(candidate);
      if (info.isDirectory()) return candidate;
    } catch {
      // Continue upward until a mounted directory is found.
    }
    const parent = path.dirname(candidate);
    if (parent === candidate) return candidate;
    candidate = parent;
  }
}
