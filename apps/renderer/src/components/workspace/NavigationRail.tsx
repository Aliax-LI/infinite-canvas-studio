import {
  BotIcon,
  CircleHelpIcon,
  ImageIcon,
  Layers3Icon,
  MessageSquareIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SettingsIcon,
  WrenchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { label: "画布列表", icon: Layers3Icon, active: true },
  { label: "在线生图", icon: BotIcon },
  { label: "对话", icon: MessageSquareIcon },
  { label: "工具箱", icon: WrenchIcon },
  { label: "素材", icon: ImageIcon },
  { label: "设置", icon: SettingsIcon },
];

export function NavigationRail({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <nav
      className="flex min-h-0 flex-col border-r bg-sidebar px-3 py-4"
      aria-label="主导航"
    >
      <div className="flex flex-col gap-2">
        {navigationItems.map(({ label, icon: Icon, active }) => (
          <Button
            aria-current={active ? "page" : undefined}
            className={`h-12 w-full justify-start rounded-sm px-4 text-[15px] ${expanded ? "" : "justify-center px-0"}`}
            key={label}
            size="lg"
            title={expanded ? undefined : label}
            variant={active ? "default" : "ghost"}
          >
            <Icon data-icon="inline-start" strokeWidth={1.8} />
            {expanded && <span>{label}</span>}
          </Button>
        ))}
      </div>
      <div className="mt-auto flex flex-col gap-2">
        {expanded && (
          <span className="px-3 py-2 text-xs text-muted-foreground">中文</span>
        )}
        <Button
          aria-label={expanded ? "收起导航" : "展开导航"}
          className={`h-10 justify-start rounded-sm px-4 ${expanded ? "" : "justify-center px-0"}`}
          size="sm"
          title={expanded ? "收起导航" : "展开导航"}
          variant="ghost"
          onClick={onToggle}
        >
          {expanded ? (
            <PanelLeftCloseIcon data-icon="inline-start" />
          ) : (
            <PanelLeftOpenIcon data-icon="inline-start" />
          )}
          {expanded && <span>收起导航</span>}
        </Button>
        <Button
          aria-label="帮助"
          className={`h-10 justify-start rounded-sm px-4 ${expanded ? "" : "justify-center px-0"}`}
          size="sm"
          title="帮助"
          variant="ghost"
        >
          <CircleHelpIcon data-icon="inline-start" />
          {expanded && <span>帮助</span>}
        </Button>
      </div>
    </nav>
  );
}
