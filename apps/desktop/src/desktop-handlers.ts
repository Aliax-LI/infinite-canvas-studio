import type { IpcMainInvokeEvent } from "electron";
import type { LibraryBootstrap, RuntimeDescriptor } from "@ics/contracts";
import { validateHttpsUrl, validateStorageDirectory } from "@ics/contracts";

import { desktopChannels } from "./channels";
import { inspectStorageDirectory, saveLibraryRoot } from "./library-config";
import { prepareLibraryDirectory } from "./bootstrap-flow";
import { isTrustedRendererUrl, requiresExternalConfirmation } from "./security";
import type { SidecarSupervisor } from "./sidecar";

export interface DesktopHandlerIpcMain {
  handle(
    channel: string,
    handler: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown,
  ): void;
}

export interface DesktopHandlerDialog {
  showOpenDialog(
    options: object,
  ): Promise<{ canceled: boolean; filePaths: string[] }>;
  showMessageBox(options: object): Promise<{ response: number }>;
}

export interface DesktopHandlerShell {
  openExternal(url: string): Promise<void>;
}

export interface DesktopHandlerDependencies {
  ipcMain: DesktopHandlerIpcMain;
  dialog: DesktopHandlerDialog;
  shell: DesktopHandlerShell;
  sidecar: Pick<SidecarSupervisor, "start" | "stop" | "getRuntime">;
  refreshBootstrap: () => Promise<LibraryBootstrap>;
  getBootstrapConfigurationPath: () => string;
  getRecommendedLibraryPath: () => string;
  getLibraryBootstrap: () => LibraryBootstrap;
  setLibraryBootstrap: (value: LibraryBootstrap) => void;
  getRendererEntryUrl: () => string | null;
  getAppVersion: () => string;
  getSupportedPlatform: () => RuntimeDescriptor["platform"];
}

/**
 * Schema-validated wrapper for storage directory parameters.
 * Rejects with a clear ProblemDetail-style error if validation fails.
 */
function parseStorageDirectory(value: unknown): string {
  const result = validateStorageDirectory(value);
  if (!result.ok) {
    throw new Error(`无效的资料库路径：${result.code}`);
  }
  return result.value;
}

function assertTrustedSender(
  event: IpcMainInvokeEvent,
  rendererEntryUrl: string | null,
): void {
  if (
    !event.senderFrame ||
    !rendererEntryUrl ||
    !isTrustedRendererUrl(event.senderFrame.url, rendererEntryUrl)
  ) {
    throw new Error("拒绝来自不受信任页面的行为请求。");
  }
}

export function registerDesktopHandlers(options: DesktopHandlerDependencies) {
  const {
    ipcMain: ipc,
    dialog: electronDialog,
    shell: electronShell,
    sidecar: sidecarSupervisor,
    refreshBootstrap: refreshFn,
    getBootstrapConfigurationPath: getConfigPath,
    getLibraryBootstrap: getBootstrap,
    setLibraryBootstrap: setBootstrap,
    getRendererEntryUrl,
    getAppVersion,
    getSupportedPlatform,
  } = options;

  ipc.handle(desktopChannels.getRuntime, (event) => {
    assertTrustedSender(event, getRendererEntryUrl());
    return {
      protocolVersion: 1,
      appVersion: getAppVersion(),
      platform: getSupportedPlatform(),
      backend: sidecarSupervisor.getRuntime(),
    } satisfies RuntimeDescriptor;
  });

  ipc.handle(desktopChannels.getLibraryBootstrap, (event) => {
    assertTrustedSender(event, getRendererEntryUrl());
    return getBootstrap();
  });

  ipc.handle(desktopChannels.selectStorageDirectory, async (event) => {
    assertTrustedSender(event, getRendererEntryUrl());
    const currentBootstrap = getBootstrap();
    const defaultPath =
      currentBootstrap.status === "ready"
        ? currentBootstrap.location.path
        : currentBootstrap.recommended.path;
    const result = await electronDialog.showOpenDialog({
      defaultPath,
      properties: ["openDirectory", "createDirectory"],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipc.handle(
    desktopChannels.inspectStorageDirectory,
    async (event, value: unknown) => {
      assertTrustedSender(event, getRendererEntryUrl());
      const directory = parseStorageDirectory(value);
      try {
        return await inspectStorageDirectory(directory);
      } catch {
        return null;
      }
    },
  );

  ipc.handle(
    desktopChannels.configureStorageDirectory,
    async (event, value: unknown) => {
      assertTrustedSender(event, getRendererEntryUrl());
      const directory = parseStorageDirectory(value);

      await prepareLibraryDirectory(directory);
      await saveLibraryRoot(getConfigPath(), directory);
      await sidecarSupervisor.stop();
      const bootstrap = await refreshFn();
      setBootstrap(bootstrap);
      await startConfiguredSidecar(sidecarSupervisor, bootstrap);
      return bootstrap;
    },
  );

  ipc.handle(desktopChannels.openExternal, async (event, value: unknown) => {
    assertTrustedSender(event, getRendererEntryUrl());
    const parsed = validateHttpsUrl(value);
    if (!parsed.ok) {
      throw new Error(`无效的外部链接：${parsed.code}`);
    }
    const url = new URL(parsed.value);

    if (requiresExternalConfirmation(url)) {
      const { response } = await electronDialog.showMessageBox({
        type: "warning",
        message: `即将在系统浏览器中打开 ${url.hostname}`,
        detail: url.toString(),
        buttons: ["取消", "继续打开"],
        defaultId: 0,
        cancelId: 0,
      });
      if (response !== 1) return false;
    }

    await electronShell.openExternal(url.toString());
    return true;
  });
}

async function startConfiguredSidecar(
  supervisor: Pick<SidecarSupervisor, "start" | "stop" | "getRuntime">,
  bootstrap: LibraryBootstrap,
): Promise<void> {
  if (bootstrap.status !== "ready") return;
  await supervisor.start(bootstrap.location.path);
}
