import { contextBridge, ipcRenderer } from "electron";

import { desktopChannels } from "./channels";

contextBridge.exposeInMainWorld("icsDesktop", {
  getRuntime: () => ipcRenderer.invoke(desktopChannels.getRuntime),
  selectStorageDirectory: () =>
    ipcRenderer.invoke(desktopChannels.selectStorageDirectory),
  openExternal: (url: string) =>
    ipcRenderer.invoke(desktopChannels.openExternal, url),
});
