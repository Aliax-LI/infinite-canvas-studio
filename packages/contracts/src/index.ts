export const desktopProtocolVersion = 1 as const;

export type DesktopChannel =
  | "desktop:get-runtime"
  | "desktop:get-library-bootstrap"
  | "desktop:select-storage-directory"
  | "desktop:inspect-storage-directory"
  | "desktop:configure-storage-directory"
  | "desktop:open-external";

export type BackendRuntime =
  | { status: "not-started" }
  | { status: "starting" }
  | {
      status: "ready";
      baseUrl: string;
      sessionToken: string;
    }
  | {
      status: "unavailable";
      message: string;
      retryable: boolean;
    };

export interface BackendHealth {
  status: "ok";
  protocolVersion: typeof desktopProtocolVersion;
  processId: number;
  libraryStatus: "ready" | "unconfigured";
}

export interface RuntimeDescriptor {
  protocolVersion: typeof desktopProtocolVersion;
  appVersion: string;
  platform: "win32" | "darwin";
  backend: BackendRuntime;
}

export interface LibraryLocation {
  path: string;
  availableBytes: number;
}

export type LibraryBootstrap =
  | { status: "unconfigured"; recommended: LibraryLocation }
  | { status: "ready"; location: LibraryLocation }
  | {
      status: "missing";
      path: string;
      message: string;
      recommended: LibraryLocation;
    };

export interface DesktopApi {
  getRuntime(): Promise<RuntimeDescriptor>;
  getLibraryBootstrap(): Promise<LibraryBootstrap>;
  selectStorageDirectory(): Promise<string | null>;
  inspectStorageDirectory(path: string): Promise<LibraryLocation | null>;
  configureStorageDirectory(path: string): Promise<LibraryBootstrap>;
  openExternal(url: string): Promise<boolean>;
}

export interface ProblemDetail {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export interface ProjectSummary {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CanvasSummary {
  id: string;
  projectId: string;
  name: string;
  kind: "standard" | "smart";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
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

export {
  validateStorageDirectory,
  validateHttpsUrl,
  MAXIMUM_PATH_LENGTH,
  MAXIMUM_URL_LENGTH,
} from "./ipc-parameters";

export type { ValidationResult } from "./ipc-parameters";
