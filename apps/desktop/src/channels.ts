import type { DesktopChannel } from "@ics/contracts";

export const desktopChannels = {
  getRuntime: "desktop:get-runtime",
  selectStorageDirectory: "desktop:select-storage-directory",
  openExternal: "desktop:open-external",
} as const satisfies Record<string, DesktopChannel>;
