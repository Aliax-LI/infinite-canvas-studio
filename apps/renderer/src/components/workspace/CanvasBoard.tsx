import {
  CrosshairIcon,
  Layers3Icon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-react";
import type { CanvasSummary, ProjectSummary } from "@ics/contracts";
import { Button } from "@/components/ui/button";

export function CanvasBoard({
  project,
  canvases,
  selectedCanvasId,
  loadState,
  errorMessage,
  isCreating,
  canvasName,
  canvasKind,
  onCanvasNameChange,
  onCanvasKindChange,
  onSelectCanvas,
  onStartCreate,
  onCancelCreate,
  onCreate,
  onRefresh,
  onRetry,
}: {
  project: ProjectSummary | undefined;
  canvases: CanvasSummary[];
  selectedCanvasId: string | null;
  loadState: "loading" | "ready" | "error";
  errorMessage: string;
  isCreating: boolean;
  canvasName: string;
  canvasKind: "standard" | "smart";
  onCanvasNameChange: (name: string) => void;
  onCanvasKindChange: (kind: "standard" | "smart") => void;
  onSelectCanvas: (canvasId: string) => void;
  onStartCreate: () => void;
  onCancelCreate: () => void;
  onCreate: () => void;
  onRefresh: () => void;
  onRetry: () => void;
}) {
  return (
    <section
      className="relative min-h-0 overflow-hidden bg-workspace"
      aria-label="项目工作面"
    >
      <div className="flex h-16 items-center border-b bg-background px-8">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {project?.name ?? "项目工作台"}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {project ? `${canvases.length} 个画布` : "选择一个项目以查看画布"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            aria-label="定位画布"
            className="rounded-sm"
            size="icon-lg"
            title="定位画布"
            variant="outline"
          >
            <CrosshairIcon />
          </Button>
          <Button
            aria-label="刷新项目"
            className="rounded-sm"
            size="icon-lg"
            title="刷新项目"
            variant="outline"
            onClick={onRefresh}
          >
            <RefreshCwIcon />
          </Button>
          <Button
            className="rounded-sm"
            disabled={!project}
            size="lg"
            onClick={onStartCreate}
          >
            <PlusIcon data-icon="inline-start" />
            新建画布
          </Button>
        </div>
      </div>
      {isCreating && project && (
        <form
          className="absolute right-6 top-20 z-10 w-72 rounded-sm border bg-popover p-3 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            onCreate();
          }}
        >
          <p className="text-sm font-medium">新建画布</p>
          <label className="sr-only" htmlFor="canvas-name">
            画布名称
          </label>
          <input
            autoFocus
            className="mt-3 h-9 w-full rounded-sm border bg-background px-2 text-sm outline-none focus:border-foreground"
            id="canvas-name"
            maxLength={160}
            placeholder="输入画布名称"
            value={canvasName}
            onChange={(event) => onCanvasNameChange(event.target.value)}
          />
          <div
            className="mt-3 grid grid-cols-2 gap-2"
            role="radiogroup"
            aria-label="画布类型"
          >
            {(
              [
                ["standard", "传统画布"],
                ["smart", "智能画布"],
              ] as const
            ).map(([kind, label]) => (
              <Button
                aria-checked={canvasKind === kind}
                className="rounded-sm"
                key={kind}
                role="radio"
                size="sm"
                type="button"
                variant={canvasKind === kind ? "default" : "outline"}
                onClick={() => onCanvasKindChange(kind)}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
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
      <div className="grid-background absolute inset-x-0 bottom-0 top-16 overflow-auto">
        {loadState === "error" && (
          <div
            className="m-8 max-w-sm rounded-sm border border-destructive bg-surface p-4 text-sm"
            role="alert"
          >
            <p>{errorMessage}</p>
            <Button
              className="mt-3 rounded-sm"
              size="sm"
              variant="outline"
              onClick={onRetry}
            >
              重新加载
            </Button>
          </div>
        )}
        {loadState === "loading" && (
          <p className="absolute left-[36%] top-[26%] text-sm text-muted-foreground">
            正在加载画布…
          </p>
        )}
        {loadState === "ready" && project && canvases.length === 0 && (
          <div className="absolute left-[36%] top-[26%] w-64 rounded-sm border bg-surface p-4">
            <Layers3Icon
              className="text-muted-foreground"
              size={22}
              aria-hidden="true"
            />
            <p className="mt-8 text-sm font-medium">从新建画布开始创作</p>
            <p className="mt-2 text-xs text-muted-foreground">
              画布将保存在当前本地资料库。
            </p>
          </div>
        )}
        {loadState === "ready" &&
          canvases.map((canvas, index) => (
            <CanvasBoardCard
              canvas={canvas}
              index={index}
              key={canvas.id}
              selected={canvas.id === selectedCanvasId}
              onSelect={onSelectCanvas}
            />
          ))}
      </div>
    </section>
  );
}

function CanvasBoardCard({
  canvas,
  index,
  selected,
  onSelect,
}: {
  canvas: CanvasSummary;
  index: number;
  selected: boolean;
  onSelect: (canvasId: string) => void;
}) {
  const column = index % 3;
  const row = Math.floor(index / 3);
  return (
    <button
      aria-pressed={selected}
      className={`absolute h-36 w-64 rounded-sm border bg-surface p-5 text-left transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 ${selected ? "border-foreground" : "border-border"}`}
      style={{
        left: `${16 + column * 31}%`,
        top: `${14 + row * 28 + (column % 2) * 5}%`,
      }}
      type="button"
      onClick={() => onSelect(canvas.id)}
    >
      <span
        className={`inline-flex rounded-sm px-2 py-1 text-xs font-medium ${canvas.kind === "smart" ? "bg-smart text-white" : "bg-muted text-muted-foreground"}`}
      >
        {canvas.kind === "smart" ? "智能" : "传统画布"}
      </span>
      <p className="mt-7 truncate text-base font-semibold">{canvas.name}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        0 个节点 · 已保存到本地
      </p>
    </button>
  );
}
