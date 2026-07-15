import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { LibraryBootstrap, RuntimeDescriptor } from "@ics/contracts";

import { loadLibraryBootstrap } from "./library-config";
import { isTrustedRendererUrl } from "./security";
import { SidecarSupervisor } from "./sidecar";
import { registerDesktopHandlers } from "./desktop-handlers";

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

  registerDesktopHandlers({
    ipcMain,
    dialog,
    shell,
    sidecar,
    refreshBootstrap: refreshLibraryBootstrap,
    getBootstrapConfigurationPath,
    getRecommendedLibraryPath,
    getLibraryBootstrap: () => libraryBootstrap,
    setLibraryBootstrap: (value) => {
      libraryBootstrap = value;
    },
    getRendererEntryUrl: () => rendererEntryUrl,
    getAppVersion: () => app.getVersion(),
    getSupportedPlatform,
  });
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
