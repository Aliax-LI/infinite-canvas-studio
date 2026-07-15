import { contextBridge, ipcRenderer } from "electron";
import type { DesktopApi } from "@ics/contracts";

import { desktopChannels } from "./channels";

const desktopApi = {
  getRuntime: () => ipcRenderer.invoke(desktopChannels.getRuntime),
  getLibraryBootstrap: () =>
    ipcRenderer.invoke(desktopChannels.getLibraryBootstrap),
  selectStorageDirectory: () =>
    ipcRenderer.invoke(desktopChannels.selectStorageDirectory),
  inspectStorageDirectory: (directory: string) =>
    ipcRenderer.invoke(desktopChannels.inspectStorageDirectory, directory),
  configureStorageDirectory: (directory: string) =>
    ipcRenderer.invoke(desktopChannels.configureStorageDirectory, directory),
  openExternal: (url: string) =>
    ipcRenderer.invoke(desktopChannels.openExternal, url),
} satisfies DesktopApi;

contextBridge.exposeInMainWorld("icsDesktop", desktopApi);
