export interface RuntimeDescriptor {
  appVersion: string;
  platform: "win32" | "darwin";
  backendBaseUrl: string;
  sessionToken: string;
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
