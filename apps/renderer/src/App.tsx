import { ArrowRightIcon, FolderOpenIcon, Layers3Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const milestones = [
  { title: "本地优先", description: "SQLite 与素材目录均由用户掌控" },
  { title: "完整复刻", description: "以冻结基线逐项验收核心能力" },
  { title: "双端桌面", description: "Windows x64 与 macOS Apple Silicon" },
];

function App() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">项目骨架</Badge>
          <span className="text-sm text-muted-foreground">版本 0.0.0</span>
        </div>
        <div className="flex max-w-3xl flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight">
            Infinite Canvas Studio
          </h1>
          <p className="text-lg text-muted-foreground">
            面向创作工作流的本地 AI 无限画布桌面应用。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button>
            <Layers3Icon data-icon="inline-start" />
            新建画布
          </Button>
          <Button variant="outline">
            <FolderOpenIcon data-icon="inline-start" />
            选择资料库存储目录
          </Button>
        </div>
      </section>

      <Separator />

      <section className="grid gap-4 md:grid-cols-3">
        {milestones.map((milestone) => (
          <Card key={milestone.title} size="sm">
            <CardHeader>
              <CardTitle>{milestone.title}</CardTitle>
              <CardDescription>{milestone.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                当前仅提供工程连通性页面，功能将在复刻阶段逐步开放。
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" disabled>
                查看计划
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>
    </main>
  );
}

export default App;
