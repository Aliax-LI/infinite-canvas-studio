import { ArchiveIcon, FolderIcon, PlusIcon } from "lucide-react";
import type { ProjectSummary } from "@ics/contracts";
import { Button } from "@/components/ui/button";

export function ProjectPanel({
  projects,
  selectedProjectId,
  isCreating,
  projectName,
  loadState,
  errorMessage,
  onSelectProject,
  onStartCreate,
  onCancelCreate,
  onCreate,
  onProjectNameChange,
  onRetry,
}: {
  projects: ProjectSummary[];
  selectedProjectId: string | null;
  isCreating: boolean;
  projectName: string;
  loadState: "loading" | "ready" | "error";
  errorMessage: string;
  onSelectProject: (projectId: string) => void;
  onStartCreate: () => void;
  onCancelCreate: () => void;
  onCreate: () => void;
  onProjectNameChange: (name: string) => void;
  onRetry: () => void;
}) {
  return (
    <aside
      className="flex min-h-0 flex-col border-r bg-background"
      aria-label="项目面板"
    >
      <div className="flex h-16 items-center justify-between border-b px-6">
        <h1 className="text-base font-semibold">项目</h1>
        <Button
          aria-label="新建项目"
          className="rounded-sm"
          size="icon-lg"
          title="新建项目"
          variant="outline"
          onClick={onStartCreate}
        >
          <PlusIcon />
        </Button>
      </div>
      {isCreating && (
        <form
          className="border-b p-3"
          onSubmit={(event) => {
            event.preventDefault();
            onCreate();
          }}
        >
          <label className="sr-only" htmlFor="project-name">
            项目名称
          </label>
          <input
            autoFocus
            className="h-9 w-full rounded-sm border bg-background px-2 text-sm outline-none focus:border-foreground"
            id="project-name"
            maxLength={160}
            placeholder="输入项目名称"
            value={projectName}
            onChange={(event) => onProjectNameChange(event.target.value)}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              size="sm"
              type="button"
              variant="ghost"
              onClick={onCancelCreate}
            >
              取消
            </Button>
            <Button className="rounded-sm" size="sm" type="submit">
              创建
            </Button>
          </div>
        </form>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto p-4" aria-live="polite">
        {loadState === "loading" && (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            正在连接资料库…
          </p>
        )}
        {loadState === "ready" &&
          projects.map((project) => {
            const active = project.id === selectedProjectId;
            return (
              <button
                aria-current={active ? "true" : undefined}
                className={`flex min-h-12 w-full items-center gap-3 rounded-sm border px-4 text-left text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${active ? "border-foreground bg-foreground text-background" : "border-transparent hover:border-border hover:bg-muted"}`}
                key={project.id}
                type="button"
                onClick={() => onSelectProject(project.id)}
              >
                <FolderIcon size={18} strokeWidth={1.8} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{project.name}</span>
                {project.isDefault && <span className="text-xs">默认</span>}
              </button>
            );
          })}
        {loadState === "error" && (
          <div
            className="rounded-sm border border-destructive p-3 text-sm"
            role="alert"
          >
            <p>{errorMessage}</p>
            <Button
              className="mt-3 rounded-sm"
              size="sm"
              variant="outline"
              onClick={onRetry}
            >
              重新连接
            </Button>
          </div>
        )}
      </div>
      <div className="border-t p-4">
        <Button
          className="h-10 w-full justify-start rounded-sm"
          variant="ghost"
        >
          <ArchiveIcon data-icon="inline-start" />
          回收站
        </Button>
      </div>
    </aside>
  );
}
