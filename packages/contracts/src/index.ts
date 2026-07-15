export const desktopProtocolVersion = 1 as const;

export type DesktopChannel =
  | "desktop:get-runtime"
  | "desktop:select-storage-directory"
  | "desktop:open-external";

export type BackendRuntime =
  | { status: "not-started" }
  | {
      status: "ready";
      baseUrl: string;
      sessionToken: string;
    };

export interface RuntimeDescriptor {
  protocolVersion: typeof desktopProtocolVersion;
  appVersion: string;
  platform: "win32" | "darwin";
  backend: BackendRuntime;
}

export interface DesktopApi {
  getRuntime(): Promise<RuntimeDescriptor>;
  selectStorageDirectory(): Promise<string | null>;
  openExternal(url: string): Promise<boolean>;
}

export interface ProblemDetail {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export type TaskState =
  "queued" | "running" | "succeeded" | "failed" | "canceled";

export interface TaskSummary {
  id: string;
  kind: string;
  state: TaskState;
  progress: number | null;
  createdAt: string;
  completedAt: string | null;
}
