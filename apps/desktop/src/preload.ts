import { contextBridge, ipcRenderer } from "electron";
import type { DesktopApi } from "@ics/contracts";

import { desktopChannels } from "./channels";

const desktopApi = {
  getRuntime: () => ipcRenderer.invoke(desktopChannels.getRuntime),
  selectStorageDirectory: () =>
    ipcRenderer.invoke(desktopChannels.selectStorageDirectory),
  openExternal: (url: string) =>
    ipcRenderer.invoke(desktopChannels.openExternal, url),
} satisfies DesktopApi;

contextBridge.exposeInMainWorld("icsDesktop", desktopApi);
