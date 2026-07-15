import type { DesktopChannel } from "@ics/contracts";

export const desktopChannels = {
  getRuntime: "desktop:get-runtime",
  getLibraryBootstrap: "desktop:get-library-bootstrap",
  selectStorageDirectory: "desktop:select-storage-directory",
  inspectStorageDirectory: "desktop:inspect-storage-directory",
  configureStorageDirectory: "desktop:configure-storage-directory",
  openExternal: "desktop:open-external",
} as const satisfies Record<string, DesktopChannel>;
