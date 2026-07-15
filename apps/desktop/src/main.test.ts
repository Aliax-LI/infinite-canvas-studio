import assert from "node:assert/strict";
import type { IpcMainInvokeEvent } from "electron";
import test from "node:test";

import {
  registerDesktopHandlers,
  type DesktopHandlerDependencies,
  type DesktopHandlerIpcMain,
} from "./desktop-handlers";
import { desktopChannels } from "./channels";
import type { LibraryBootstrap } from "@ics/contracts";

interface MockIpcMain extends DesktopHandlerIpcMain {
  invoke(
    channel: string,
    event: IpcMainInvokeEvent,
    ...args: unknown[]
  ): Promise<unknown>;
}

function createMockIpcMain(): MockIpcMain {
  const handlers = new Map<
    string,
    (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown
  >();

  return {
    handle: (
      channel: string,
      handler: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown,
    ) => {
      handlers.set(channel, handler);
    },
    async invoke(
      channel: string,
      event: IpcMainInvokeEvent,
      ...args: unknown[]
    ) {
      const handler = handlers.get(channel);
      if (!handler) throw new Error(`No handler for ${channel}`);
      return handler(event, ...args);
    },
  };
}

function createMockDialog() {
  return {
    showOpenDialog: async () => ({ canceled: true, filePaths: [] }),
    showMessageBox: async () => ({ response: 0 }),
  };
}

function createMockShell() {
  return {
    openExternal: async () => {},
  };
}

function createMockSidecar() {
  return {
    start: async () => {},
    stop: async () => {},
    getRuntime: () => ({ status: "not-started" }) as const,
  };
}

const trustedEvent = {
  senderFrame: { url: "app://renderer/index.html" },
} as unknown as IpcMainInvokeEvent;

const untrustedEvent = {
  senderFrame: { url: "https://evil.example.com/" },
} as unknown as IpcMainInvokeEvent;

interface TestDeps extends DesktopHandlerDependencies {
  ipcMain: MockIpcMain;
}

function createDeps(overrides: Partial<TestDeps> = {}): TestDeps {
  let bootstrap: LibraryBootstrap = {
    status: "unconfigured",
    recommended: { path: "/recommended", availableBytes: 1024 * 1024 * 1024 },
  };

  const ipcMain = createMockIpcMain();

  return {
    ipcMain,
    dialog: createMockDialog(),
    shell: createMockShell(),
    sidecar: createMockSidecar(),
    refreshBootstrap: async () => bootstrap,
    getBootstrapConfigurationPath: () => "/tmp/test-bootstrap.json",
    getRecommendedLibraryPath: () => "/tmp/test-recommended",
    getLibraryBootstrap: () => bootstrap,
    setLibraryBootstrap: (value: LibraryBootstrap) => {
      bootstrap = value;
    },
    getRendererEntryUrl: () => "app://renderer/index.html",
    getAppVersion: () => "0.0.0-test",
    getSupportedPlatform: () => "win32" as const,
    ...overrides,
  };
}

test("getRuntime rejects untrusted senders", async () => {
  const deps = createDeps();
  registerDesktopHandlers(deps);

  await assert.rejects(
    () => deps.ipcMain.invoke(desktopChannels.getRuntime, untrustedEvent),
    /不受信任/,
  );
});

test("configureStorageDirectory rejects non-absolute paths", async () => {
  const deps = createDeps();
  registerDesktopHandlers(deps);

  await assert.rejects(
    () =>
      deps.ipcMain.invoke(
        desktopChannels.configureStorageDirectory,
        trustedEvent,
        "relative/path",
      ),
    /无效的资料库路径|资料库必须是绝对路径/,
  );
});

test("openExternal rejects HTTP URLs", async () => {
  const deps = createDeps();
  registerDesktopHandlers(deps);

  await assert.rejects(
    () =>
      deps.ipcMain.invoke(
        desktopChannels.openExternal,
        trustedEvent,
        "http://example.com",
      ),
    /无效的外部链接/,
  );
});

test("getLibraryBootstrap returns the current bootstrap", async () => {
  const deps = createDeps();
  registerDesktopHandlers(deps);

  const result = await deps.ipcMain.invoke(
    desktopChannels.getLibraryBootstrap,
    trustedEvent,
  );

  assert.deepEqual(result, {
    status: "unconfigured",
    recommended: { path: "/recommended", availableBytes: 1024 * 1024 * 1024 },
  });
});
