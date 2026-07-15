import { contextBridge, ipcRenderer } from "electron";
import type { DesktopApi } from "@ics/contracts";
import { validateHttpsUrl, validateStorageDirectory } from "@ics/contracts";

import { desktopChannels } from "./channels";

const desktopApi = {
  getRuntime: () => ipcRenderer.invoke(desktopChannels.getRuntime),
  getLibraryBootstrap: () =>
    ipcRenderer.invoke(desktopChannels.getLibraryBootstrap),
  selectStorageDirectory: () =>
    ipcRenderer.invoke(desktopChannels.selectStorageDirectory),
  inspectStorageDirectory: (directory: string) => {
    const result = validateStorageDirectory(directory);
    if (!result.ok) {
      return Promise.reject(new Error(`无效的资料库路径：${result.code}`));
    }
    return ipcRenderer.invoke(
      desktopChannels.inspectStorageDirectory,
      result.value,
    );
  },
  configureStorageDirectory: (directory: string) => {
    const result = validateStorageDirectory(directory);
    if (!result.ok) {
      return Promise.reject(new Error(`无效的资料库路径：${result.code}`));
    }
    return ipcRenderer.invoke(
      desktopChannels.configureStorageDirectory,
      result.value,
    );
  },
  openExternal: (url: string) => {
    const result = validateHttpsUrl(url);
    if (!result.ok) {
      return Promise.reject(new Error(`无效的外部链接：${result.code}`));
    }
    return ipcRenderer.invoke(desktopChannels.openExternal, result.value);
  },
} satisfies DesktopApi;

contextBridge.exposeInMainWorld("icsDesktop", desktopApi);
