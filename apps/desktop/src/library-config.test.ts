import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { loadLibraryBootstrap, saveLibraryRoot } from "./library-config";

test("persists a configured library and reports available disk space", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "ics-library-"));
  try {
    const configurationPath = path.join(workspace, "bootstrap.json");
    const libraryPath = path.join(workspace, "library");
    const saved = await saveLibraryRoot(configurationPath, libraryPath);
    const bootstrap = await loadLibraryBootstrap(
      configurationPath,
      path.join(workspace, "recommended"),
    );

    assert.equal(saved.path, libraryPath);
    assert.ok(saved.availableBytes > 0);
    assert.equal(bootstrap.status, "ready");
    assert.equal(bootstrap.location.path, saved.path);
    assert.ok(bootstrap.location.availableBytes > 0);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("marks an unavailable saved library as missing without recreating it", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "ics-library-"));
  try {
    const configurationPath = path.join(workspace, "bootstrap.json");
    const libraryPath = path.join(workspace, "library");
    await saveLibraryRoot(configurationPath, libraryPath);
    await rm(libraryPath, { recursive: true });

    const bootstrap = await loadLibraryBootstrap(
      configurationPath,
      path.join(workspace, "recommended"),
    );

    assert.equal(bootstrap.status, "missing");
    assert.equal(bootstrap.path, libraryPath);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
