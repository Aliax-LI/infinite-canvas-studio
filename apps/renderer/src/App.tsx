import { useEffect, useState } from "react";
import { Layers3Icon } from "lucide-react";
import type {
  BackendRuntime,
  CanvasSummary,
  LibraryBootstrap,
  LibraryLocation,
  ProjectSummary,
} from "@ics/contracts";

import { CanvasBoard } from "@/components/workspace/CanvasBoard";
import { NavigationRail } from "@/components/workspace/NavigationRail";
import { ProjectPanel } from "@/components/workspace/ProjectPanel";
import { Button } from "@/components/ui/button";

type LoadState = "loading" | "ready" | "error";
type CanvasKind = "standard" | "smart";

function App() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [runtime, setRuntime] = useState<BackendRuntime>({
    status: "starting",
  });
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [canvases, setCanvases] = useState<CanvasSummary[]>([]);
  const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(null);
  const [canvasLoadState, setCanvasLoadState] = useState<LoadState>("loading");
  const [canvasError, setCanvasError] = useState("");
  const [isCreatingCanvas, setIsCreatingCanvas] = useState(false);
  const [canvasName, setCanvasName] = useState("");
  const [canvasKind, setCanvasKind] = useState<CanvasKind>("standard");
  const [navigationExpanded, setNavigationExpanded] = useState(true);
  const [libraryBootstrap, setLibraryBootstrap] =
    useState<LibraryBootstrap | null>(null);
  const [selectedStorage, setSelectedStorage] =
    useState<LibraryLocation | null>(null);
  const [isConfiguringLibrary, setIsConfiguringLibrary] = useState(false);
  const [bootstrapError, setBootstrapError] = useState("");

  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId,
  );

  useEffect(() => {
    void initializeDesktop();
  }, []);

  useEffect(() => {
    if (runtime.status !== "ready" || !selectedProjectId) {
      setCanvases([]);
      setSelectedCanvasId(null);
      return;
    }
    void loadCanvases(selectedProjectId, runtime);
  }, [runtime, selectedProjectId]);

  async function initializeDesktop() {
    if (!window.icsDesktop) {
      setRuntime({
        status: "unavailable",
        message: "请从桌面应用启动以连接本地资料库。",
        retryable: false,
      });
      setLoadState("error");
      return;
    }
    try {
      const bootstrap = await window.icsDesktop.getLibraryBootstrap();
      setLibraryBootstrap(bootstrap);
      if (bootstrap.status === "ready") await connectToLibrary();
    } catch (error) {
      setBootstrapError(
        error instanceof Error ? error.message : "无法读取资料库引导配置。",
      );
    }
  }

  async function connectToLibrary() {
    if (!window.icsDesktop) return;
    setLoadState("loading");
    try {
      const nextRuntime = await window.icsDesktop.getRuntime();
      setRuntime(nextRuntime.backend);
      if (nextRuntime.backend.status !== "ready") {
        setErrorMessage(describeUnavailableRuntime(nextRuntime.backend));
        setLoadState("error");
        return;
      }
      const response = await fetch(
        `${nextRuntime.backend.baseUrl}/v1/projects`,
        {
          headers: { "x-ics-session-token": nextRuntime.backend.sessionToken },
        },
      );
      if (!response.ok) throw new Error("无法读取本地项目。");
      const loadedProjects = (await response.json()) as ProjectSummary[];
      setProjects(loadedProjects);
      setSelectedProjectId(
        (current) => current ?? loadedProjects[0]?.id ?? null,
      );
      setLoadState("ready");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "本地资料库暂时不可用。",
      );
      setLoadState("error");
    }
  }

  async function chooseStorageDirectory() {
    if (!window.icsDesktop) return;
    setBootstrapError("");
    try {
      const directory = await window.icsDesktop.selectStorageDirectory();
      if (!directory) return;
      const location =
        await window.icsDesktop.inspectStorageDirectory(directory);
      if (!location) throw new Error("无法读取所选目录的磁盘空间。");
      setSelectedStorage(location);
    } catch (error) {
      setBootstrapError(
        error instanceof Error ? error.message : "无法选择资料库目录。",
      );
    }
  }

  async function configureStorageDirectory() {
    if (!window.icsDesktop || !selectedStorage) return;
    setIsConfiguringLibrary(true);
    setBootstrapError("");
    try {
      const bootstrap = await window.icsDesktop.configureStorageDirectory(
        selectedStorage.path,
      );
      setLibraryBootstrap(bootstrap);
      setSelectedStorage(null);
      if (bootstrap.status === "ready") await connectToLibrary();
    } catch (error) {
      setBootstrapError(
        error instanceof Error
          ? error.message
          : "资料库初始化失败，请重新选择目录。",
      );
    } finally {
      setIsConfiguringLibrary(false);
    }
  }

  async function createProject() {
    if (runtime.status !== "ready") return;
    const name = projectName.trim();
    if (!name) return;
    try {
      const response = await fetch(`${runtime.baseUrl}/v1/projects`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-ics-session-token": runtime.sessionToken,
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("项目创建失败，请稍后重试。");
      const project = (await response.json()) as ProjectSummary;
      setProjects((current) => [...current, project]);
      setSelectedProjectId(project.id);
      setProjectName("");
      setIsCreating(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "项目创建失败。",
      );
      setLoadState("error");
    }
  }

  async function loadCanvases(
    projectId: string,
    activeRuntime: Extract<BackendRuntime, { status: "ready" }>,
  ) {
    setCanvasLoadState("loading");
    try {
      const response = await fetch(
        `${activeRuntime.baseUrl}/v1/projects/${projectId}/canvases`,
        {
          headers: { "x-ics-session-token": activeRuntime.sessionToken },
        },
      );
      if (!response.ok) throw new Error("无法读取当前项目的画布。");
      const loadedCanvases = (await response.json()) as CanvasSummary[];
      setCanvases(loadedCanvases);
      setSelectedCanvasId(
        (current) => current ?? loadedCanvases[0]?.id ?? null,
      );
      setCanvasLoadState("ready");
      setCanvasError("");
    } catch (error) {
      setCanvases([]);
      setSelectedCanvasId(null);
      setCanvasError(
        error instanceof Error ? error.message : "本地画布暂时不可用。",
      );
      setCanvasLoadState("error");
    }
  }

  async function createCanvas() {
    if (runtime.status !== "ready" || !selectedProjectId) return;
    const name = canvasName.trim();
    if (!name) return;
    try {
      const response = await fetch(
        `${runtime.baseUrl}/v1/projects/${selectedProjectId}/canvases`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-ics-session-token": runtime.sessionToken,
          },
          body: JSON.stringify({ name, kind: canvasKind }),
        },
      );
      if (!response.ok) throw new Error("画布创建失败，请稍后重试。");
      const canvas = (await response.json()) as CanvasSummary;
      setCanvases((current) => [...current, canvas]);
      setSelectedCanvasId(canvas.id);
      setCanvasName("");
      setCanvasKind("standard");
      setIsCreatingCanvas(false);
      setCanvasError("");
      setCanvasLoadState("ready");
    } catch (error) {
      setCanvasError(
        error instanceof Error ? error.message : "画布创建失败，请稍后重试。",
      );
      setCanvasLoadState("error");
    }
  }

  if (libraryBootstrap && libraryBootstrap.status !== "ready") {
    return (
      <LibraryBootstrapScreen
        bootstrap={libraryBootstrap}
        error={bootstrapError}
        isConfiguring={isConfiguringLibrary}
        selectedStorage={selectedStorage}
        onChooseDirectory={() => void chooseStorageDirectory()}
        onUseRecommendation={() => {
          setSelectedStorage(libraryBootstrap.recommended);
          setBootstrapError("");
        }}
        onConfirm={() => void configureStorageDirectory()}
      />
    );
  }

  return (
    <main
      className="grid min-h-screen grid-rows-[44px_minmax(0,1fr)] bg-background text-foreground"
      style={{
        gridTemplateColumns: `${navigationExpanded ? 240 : 80}px 288px minmax(0, 1fr)`,
      }}
    >
      <header className="col-span-3 flex items-center border-b bg-background px-4 [-webkit-app-region:drag]">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="grid size-6 place-items-center border border-foreground bg-foreground text-background">
            <Layers3Icon size={15} aria-hidden="true" />
          </span>
          无限画布
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-smart" aria-hidden="true" />
          本地资料库
        </div>
      </header>
      <NavigationRail
        expanded={navigationExpanded}
        onToggle={() => setNavigationExpanded((expanded) => !expanded)}
      />
      <ProjectPanel
        projects={projects}
        selectedProjectId={selectedProjectId}
        isCreating={isCreating}
        projectName={projectName}
        loadState={loadState}
        errorMessage={errorMessage}
        onSelectProject={setSelectedProjectId}
        onStartCreate={() => setIsCreating(true)}
        onCancelCreate={() => setIsCreating(false)}
        onCreate={() => void createProject()}
        onProjectNameChange={setProjectName}
        onRetry={() => void connectToLibrary()}
      />
      <CanvasBoard
        project={selectedProject}
        canvases={canvases}
        selectedCanvasId={selectedCanvasId}
        loadState={canvasLoadState}
        errorMessage={canvasError}
        isCreating={isCreatingCanvas}
        canvasName={canvasName}
        canvasKind={canvasKind}
        onCanvasNameChange={setCanvasName}
        onCanvasKindChange={setCanvasKind}
        onSelectCanvas={setSelectedCanvasId}
        onStartCreate={() => setIsCreatingCanvas(true)}
        onCancelCreate={() => setIsCreatingCanvas(false)}
        onCreate={() => void createCanvas()}
        onRefresh={() => void connectToLibrary()}
        onRetry={() => {
          if (runtime.status === "ready" && selectedProjectId)
            void loadCanvases(selectedProjectId, runtime);
        }}
      />
    </main>
  );
}

function LibraryBootstrapScreen({
  bootstrap,
  selectedStorage,
  error,
  isConfiguring,
  onChooseDirectory,
  onUseRecommendation,
  onConfirm,
}: {
  bootstrap: Exclude<LibraryBootstrap, { status: "ready" }>;
  selectedStorage: LibraryLocation | null;
  error: string;
  isConfiguring: boolean;
  onChooseDirectory: () => void;
  onUseRecommendation: () => void;
  onConfirm: () => void;
}) {
  const candidate = selectedStorage ?? bootstrap.recommended;
  return (
    <main className="grid min-h-screen grid-cols-[80px_minmax(0,1fr)] grid-rows-[44px_minmax(0,1fr)] bg-background text-foreground">
      <header className="col-span-2 flex items-center border-b px-4 [-webkit-app-region:drag]">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="grid size-6 place-items-center border border-foreground bg-foreground text-background">
            <Layers3Icon size={15} />
          </span>
          无限画布
        </div>
      </header>
      <nav className="border-r bg-sidebar" aria-label="引导导航" />
      <section
        className="grid-background flex min-h-0 items-center justify-center p-8"
        aria-label="资料库引导"
      >
        <div className="w-full max-w-2xl rounded-sm border bg-surface p-7">
          <p className="text-xs text-muted-foreground">本地优先工作区</p>
          <h1 className="mt-2 text-xl font-semibold">
            {bootstrap.status === "missing"
              ? "恢复资料库连接"
              : "选择资料库位置"}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            {bootstrap.status === "missing"
              ? bootstrap.message
              : "资料库会保存项目、画布和本地工作状态。请确认位置后再创建，模型与配套组件可以稍后配置。"}
          </p>
          {bootstrap.status === "missing" && (
            <div
              className="mt-5 rounded-sm border border-destructive p-3 text-sm"
              role="alert"
            >
              原路径：{bootstrap.path}
            </div>
          )}
          <div className="mt-6 rounded-sm border p-4">
            <p className="text-xs text-muted-foreground">
              {selectedStorage ? "待确认的位置" : "推荐位置"}
            </p>
            <p className="mt-1 break-all font-mono text-sm">{candidate.path}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              可用空间：{formatByteSize(candidate.availableBytes)}
            </p>
          </div>
          {error && (
            <p
              className="mt-4 rounded-sm border border-destructive p-3 text-sm"
              role="alert"
            >
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            {!selectedStorage && (
              <Button
                className="rounded-sm"
                variant="outline"
                onClick={onUseRecommendation}
              >
                使用推荐位置
              </Button>
            )}
            <Button
              className="rounded-sm"
              variant="outline"
              onClick={onChooseDirectory}
            >
              选择其他目录
            </Button>
            <Button
              className="rounded-sm"
              disabled={!selectedStorage || isConfiguring}
              onClick={onConfirm}
            >
              {isConfiguring ? "正在初始化…" : "确认并继续"}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function formatByteSize(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "未知";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let amount = value;
  let unitIndex = 0;
  while (amount >= 1024 && unitIndex < units.length - 1) {
    amount /= 1024;
    unitIndex += 1;
  }
  return `${amount.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function describeUnavailableRuntime(runtime: BackendRuntime): string {
  if (runtime.status === "unavailable") return runtime.message;
  if (runtime.status === "starting") return "本地服务仍在启动，请稍后重试。";
  return "本地服务尚未启动。";
}

export default App;
