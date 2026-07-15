import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import type { IpcMainInvokeEvent } from "electron";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { RuntimeDescriptor } from "@ics/contracts";

import { desktopChannels } from "./channels";
import {
  isTrustedRendererUrl,
  parseHttpsExternalUrl,
  requiresExternalConfirmation,
} from "./security";

let mainWindow: BrowserWindow | null = null;
let rendererEntryUrl: string | null = null;

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
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

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

function registerDesktopHandlers() {
  ipcMain.handle(desktopChannels.getRuntime, (event) => {
    assertTrustedSender(event);
    return {
      protocolVersion: 1,
      appVersion: app.getVersion(),
      platform: getSupportedPlatform(),
      backend: { status: "not-started" },
    } satisfies RuntimeDescriptor;
  });

  ipcMain.handle(desktopChannels.selectStorageDirectory, async (event) => {
    assertTrustedSender(event);
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
    });
    return result.canceled ? null : result.filePaths[0];
  });

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

app.whenReady().then(() => {
  if (process.platform === "darwin" && !app.isPackaged) {
    app.dock?.setIcon(getApplicationIconPath());
  }

  registerDesktopHandlers();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
