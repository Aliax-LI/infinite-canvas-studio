import type { DesktopApi } from "@ics/contracts";

declare global {
  interface Window {
    icsDesktop?: DesktopApi;
  }
}

export {};
