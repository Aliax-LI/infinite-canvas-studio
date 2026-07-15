import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  DEFAULT_MINIMUM_BYTES,
  prepareLibraryDirectory,
  validateDiskSpace,
  refreshBootstrap,
  type ValidationResult,
} from "./bootstrap-flow";

test("prepareLibraryDirectory creates all required subdirectories", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "ics-bootstrap-"));
  try {
    const root = path.join(workspace, "library");
    const location = await prepareLibraryDirectory(root);

    assert.equal(location.path, root);
    assert.ok(location.availableBytes > 0);

    for (const subdirectory of [
      "database",
      "managed",
      "imports",
      "cache",
      "recovery",
    ]) {
      const stat = await import("node:fs/promises").then((m) =>
        m.stat(path.join(root, subdirectory)),
      );
      assert.ok(stat.isDirectory(), `${subdirectory} should exist`);
    }
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("prepareLibraryDirectory rejects non-absolute paths", async () => {
  await assert.rejects(
    () => prepareLibraryDirectory("relative/path"),
    /绝对路径/,
  );
});

test("validateDiskSpace accepts locations with sufficient space", () => {
  const result: ValidationResult = validateDiskSpace(
    { path: "/tmp/test", availableBytes: DEFAULT_MINIMUM_BYTES * 2 },
    DEFAULT_MINIMUM_BYTES,
  );
  assert.equal(result.ok, true);
});

test("validateDiskSpace rejects locations with insufficient space", () => {
  const result = validateDiskSpace(
    { path: "/tmp/test", availableBytes: 1024 },
    DEFAULT_MINIMUM_BYTES,
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "insufficient_space");
  }
});

test("validateDiskSpace rejects non-absolute paths", () => {
  const result = validateDiskSpace(
    { path: "relative/path", availableBytes: DEFAULT_MINIMUM_BYTES * 10 },
    DEFAULT_MINIMUM_BYTES,
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "invalid_path");
  }
});

test("refreshBootstrap delegates to loadLibraryBootstrap", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "ics-refresh-"));
  try {
    const configurationPath = path.join(workspace, "bootstrap.json");
    const recommendedPath = path.join(workspace, "recommended");
    const bootstrap = await refreshBootstrap(
      configurationPath,
      recommendedPath,
    );
    assert.equal(bootstrap.status, "unconfigured");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
