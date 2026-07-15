import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";

import type { BackendHealth, BackendRuntime } from "@ics/contracts";

const startupAttempts = 3;
const maximumUnexpectedRestarts = 2;
const healthRequestTimeoutMs = 1_500;

export class SidecarSupervisor {
  private child: ChildProcess | null = null;
  private expectedExit = false;
  private restartCount = 0;
  private runtime: BackendRuntime = { status: "not-started" };
  private readonly sessionToken = randomBytes(32).toString("base64url");

  constructor(
    private readonly options: {
      packaged: boolean;
      resourcesPath: string;
      desktopDistPath: string;
    },
  ) {}

  private libraryRoot: string | null = null;

  getRuntime(): BackendRuntime {
    return this.runtime;
  }

  async start(libraryRoot: string): Promise<void> {
    this.libraryRoot = libraryRoot;
    this.restartCount = 0;
    await this.startWithRetries();
  }

  async stop(): Promise<void> {
    this.expectedExit = true;
    await this.stopChild();
    this.runtime = { status: "not-started" };
  }

  private async startWithRetries(): Promise<void> {
    this.expectedExit = false;
    this.runtime = { status: "starting" };

    for (let attempt = 1; attempt <= startupAttempts; attempt += 1) {
      try {
        await this.startOnce();
        return;
      } catch (error) {
        this.expectedExit = true;
        await this.stopChild();
        this.expectedExit = false;
        if (attempt === startupAttempts) {
          this.runtime = {
            status: "unavailable",
            message: toMessage(error),
            retryable: true,
          };
        }
      }
    }
  }

  private async startOnce(): Promise<void> {
    if (!this.libraryRoot) throw new Error("资料库尚未配置。");
    const port = await getAvailableLoopbackPort();
    const baseUrl = `http://127.0.0.1:${port}`;
    const command = this.getCommand();

    this.child = spawn(command.command, command.args, {
      cwd: command.cwd,
      windowsHide: true,
      stdio: "ignore",
      env: {
        ...process.env,
        ...command.env,
        ICS_BACKEND_PORT: String(port),
        ICS_SESSION_TOKEN: this.sessionToken,
        ICS_LIBRARY_ROOT: this.libraryRoot,
      },
    });
    this.child.once("exit", () => this.handleUnexpectedExit());

    const childStartupError = once(this.child, "error").then(([error]) => {
      throw error;
    });
    const childStartupExit = once(this.child, "exit").then(() => {
      throw new Error("本地服务在完成健康检查前退出。");
    });
    await Promise.race([
      waitForHealthyBackend(baseUrl, this.sessionToken),
      childStartupError,
      childStartupExit,
    ]);
    this.runtime = {
      status: "ready",
      baseUrl,
      sessionToken: this.sessionToken,
    };
  }

  private getCommand(): {
    command: string;
    args: string[];
    cwd?: string;
    env?: NodeJS.ProcessEnv;
  } {
    if (this.options.packaged) {
      const executableName =
        process.platform === "win32" ? "ics-backend.exe" : "ics-backend";
      return {
        command: path.join(
          this.options.resourcesPath,
          "backend",
          executableName,
        ),
        args: [],
      };
    }

    const backendRoot = path.resolve(
      this.options.desktopDistPath,
      "../../../services/backend",
    );
    const workspaceRoot = path.resolve(backendRoot, "../..");
    const virtualEnvironmentPython = path.join(
      workspaceRoot,
      ".venv",
      process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
    );
    return {
      command:
        process.env.ICS_BACKEND_EXECUTABLE ??
        (existsSync(virtualEnvironmentPython)
          ? virtualEnvironmentPython
          : "python"),
      args: [path.join(backendRoot, "entrypoint.py")],
      cwd: backendRoot,
      env: {
        PYTHONPATH: path.join(backendRoot, "src"),
        ICS_ALLOWED_ORIGINS: getAllowedRendererOrigins(),
      },
    };
  }

  private async handleUnexpectedExit(): Promise<void> {
    this.child = null;
    if (this.expectedExit || this.runtime.status === "starting") return;

    if (this.restartCount >= maximumUnexpectedRestarts) {
      this.runtime = {
        status: "unavailable",
        message: "本地服务已连续退出，请在诊断信息中检查服务日志。",
        retryable: true,
      };
      return;
    }

    this.restartCount += 1;
    await this.startWithRetries();
  }

  private async stopChild(): Promise<void> {
    const child = this.child;
    this.child = null;
    if (!child || child.exitCode !== null || child.killed) return;

    child.kill();
    await Promise.race([
      once(child, "exit"),
      new Promise<void>((resolve) => setTimeout(resolve, 3_000)),
    ]);
  }
}

function getAllowedRendererOrigins(): string {
  const rendererUrl = process.env.ICS_RENDERER_URL;
  if (!rendererUrl) return "null";

  try {
    return `${new URL(rendererUrl).origin},null`;
  } catch {
    return "null";
  }
}

async function getAvailableLoopbackPort(): Promise<number> {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("无法为本地服务分配端口。");
  }
  const { port } = address;
  server.close();
  await once(server, "close");
  return port;
}

async function waitForHealthyBackend(
  baseUrl: string,
  sessionToken: string,
): Promise<void> {
  const deadline = Date.now() + 10_000;
  let latestError: unknown = new Error("本地服务未返回健康状态。");

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/v1/health`, {
        headers: { "x-ics-session-token": sessionToken },
        signal: AbortSignal.timeout(healthRequestTimeoutMs),
      });
      const body = (await response.json()) as Partial<BackendHealth>;
      if (
        response.ok &&
        body.status === "ok" &&
        body.protocolVersion === 1 &&
        body.libraryStatus === "ready"
      )
        return;
      latestError = new Error("本地服务返回了不兼容的健康状态。");
    } catch (error) {
      latestError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  throw latestError;
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "本地服务无法启动。";
}
