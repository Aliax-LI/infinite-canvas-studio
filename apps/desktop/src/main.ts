import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import type { IpcMainInvokeEvent } from "electron";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { LibraryBootstrap, RuntimeDescriptor } from "@ics/contracts";

import { desktopChannels } from "./channels";
import {
  inspectStorageDirectory,
  loadLibraryBootstrap,
  saveLibraryRoot,
} from "./library-config";
import {
  isTrustedRendererUrl,
  parseHttpsExternalUrl,
  requiresExternalConfirmation,
} from "./security";
import { SidecarSupervisor } from "./sidecar";

let mainWindow: BrowserWindow | null = null;
let rendererEntryUrl: string | null = null;
let libraryBootstrap: LibraryBootstrap;
const sidecar = new SidecarSupervisor({
  packaged: app.isPackaged,
  resourcesPath: process.resourcesPath,
  desktopDistPath: __dirname,
});

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
}

function getApplicationIconPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, "icon.png")
    : path.join(__dirname, "../resources/icon.png");
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    icon: getApplicationIconPath(),
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#ffffff",
      symbolColor: "#151922",
      height: 44,
    },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAutoHideMenuBar(true);

  mainWindow.once("ready-to-show", () => mainWindow?.show());

  rendererEntryUrl =
    process.env.ICS_RENDERER_URL ??
    pathToFileURL(
      path.join(process.resourcesPath, "renderer/index.html"),
    ).toString();

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    if (
      !rendererEntryUrl ||
      !isTrustedRendererUrl(targetUrl, rendererEntryUrl)
    ) {
      event.preventDefault();
    }
  });

  void mainWindow.loadURL(rendererEntryUrl);
}

function assertTrustedSender(event: IpcMainInvokeEvent): void {
  if (
    !event.senderFrame ||
    !rendererEntryUrl ||
    !isTrustedRendererUrl(event.senderFrame.url, rendererEntryUrl)
  ) {
    throw new Error("拒绝来自非受信任页面的桌面能力请求。");
  }
}

function getSupportedPlatform(): RuntimeDescriptor["platform"] {
  if (process.platform === "darwin" || process.platform === "win32") {
    return process.platform;
  }
  throw new Error(`不支持的平台：${process.platform}`);
}

function getBootstrapConfigurationPath(): string {
  return path.join(app.getPath("userData"), "library-bootstrap.json");
}

function getRecommendedLibraryPath(): string {
  return path.join(app.getPath("documents"), "Infinite Canvas Studio");
}

async function refreshLibraryBootstrap(): Promise<LibraryBootstrap> {
  libraryBootstrap = await loadLibraryBootstrap(
    getBootstrapConfigurationPath(),
    getRecommendedLibraryPath(),
  );
  return libraryBootstrap;
}

async function startConfiguredSidecar(): Promise<void> {
  if (libraryBootstrap.status !== "ready") return;
  await sidecar.start(libraryBootstrap.location.path);
}

function parseStorageDirectory(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 4_096) {
    return null;
  }
  return value;
}

function registerDesktopHandlers() {
  ipcMain.handle(desktopChannels.getRuntime, (event) => {
    assertTrustedSender(event);
    return {
      protocolVersion: 1,
      appVersion: app.getVersion(),
      platform: getSupportedPlatform(),
      backend: sidecar.getRuntime(),
    } satisfies RuntimeDescriptor;
  });

  ipcMain.handle(desktopChannels.getLibraryBootstrap, (event) => {
    assertTrustedSender(event);
    return libraryBootstrap;
  });

  ipcMain.handle(desktopChannels.selectStorageDirectory, async (event) => {
    assertTrustedSender(event);
    const result = await dialog.showOpenDialog({
      defaultPath:
        libraryBootstrap.status === "ready"
          ? libraryBootstrap.location.path
          : libraryBootstrap.recommended.path,
      properties: ["openDirectory", "createDirectory"],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle(
    desktopChannels.inspectStorageDirectory,
    async (event, value: unknown) => {
      assertTrustedSender(event);
      const directory = parseStorageDirectory(value);
      if (!directory) return null;
      try {
        return await inspectStorageDirectory(directory);
      } catch {
        return null;
      }
    },
  );

  ipcMain.handle(
    desktopChannels.configureStorageDirectory,
    async (event, value: unknown) => {
      assertTrustedSender(event);
      const directory = parseStorageDirectory(value);
      if (!directory) throw new Error("无效的资料库路径。");

      const location = await saveLibraryRoot(
        getBootstrapConfigurationPath(),
        directory,
      );
      await sidecar.stop();
      libraryBootstrap = { status: "ready", location };
      await startConfiguredSidecar();
      return libraryBootstrap;
    },
  );

  ipcMain.handle(
    desktopChannels.openExternal,
    async (event, value: unknown) => {
      assertTrustedSender(event);
      const url = parseHttpsExternalUrl(value);
      if (!url) return false;

      if (requiresExternalConfirmation(url)) {
        const { response } = await dialog.showMessageBox({
          type: "warning",
          message: `即将在系统浏览器中打开 ${url.hostname}`,
          detail: url.toString(),
          buttons: ["取消", "继续打开"],
          defaultId: 0,
          cancelId: 0,
        });
        if (response !== 1) return false;
      }

      await shell.openExternal(url.toString());
      return true;
    },
  );
}

app.on("second-instance", () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
});

app.whenReady().then(async () => {
  if (process.platform === "darwin" && !app.isPackaged) {
    app.dock?.setIcon(getApplicationIconPath());
  }

  registerDesktopHandlers();
  await refreshLibraryBootstrap();
  await startConfiguredSidecar();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  void sidecar.stop();
});
