import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { LibraryBootstrap, LibraryLocation } from "@ics/contracts";

import {
  inspectStorageDirectory,
  loadLibraryBootstrap,
} from "./library-config";

export const DEFAULT_MINIMUM_BYTES = 256 * 1024 * 1024;

const REQUIRED_SUBDIRECTORIES = [
  "database",
  "managed",
  "imports",
  "cache",
  "recovery",
];

export interface ValidationResult {
  ok: boolean;
  code?: "insufficient_space" | "invalid_path";
  message?: string;
}

export async function prepareLibraryDirectory(
  root: string,
): Promise<LibraryLocation> {
  if (!path.isAbsolute(root)) {
    throw new Error("资料库必须是绝对路径");
  }
  const resolved = path.resolve(root);
  await mkdir(resolved, { recursive: true });
  for (const subdirectory of REQUIRED_SUBDIRECTORIES) {
    await mkdir(path.join(resolved, subdirectory), { recursive: true });
  }
  return inspectStorageDirectory(resolved);
}

export function validateDiskSpace(
  location: LibraryLocation,
  minBytes: number = DEFAULT_MINIMUM_BYTES,
): ValidationResult {
  if (!path.isAbsolute(location.path)) {
    return { ok: false, code: "invalid_path", message: "资料库必须是绝对路径" };
  }
  if (location.availableBytes < minBytes) {
    return {
      ok: false,
      code: "insufficient_space",
      message: "目录可用空间不足，请选择其他位置",
    };
  }
  return { ok: true };
}

export async function refreshBootstrap(
  configurationPath: string,
  recommendedPath: string,
): Promise<LibraryBootstrap> {
  return loadLibraryBootstrap(configurationPath, recommendedPath);
}
