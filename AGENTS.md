# Infinite Canvas Studio 开发代理指南

本文件适用于整个仓库。任何 Codex 或其他自动化开发代理开始工作前，都必须先读取本文件；进入子目录后，如存在更深层的 `AGENTS.md`，再叠加执行其规则。

## 1. 开始任务前

按任务范围读取以下资料，不要只看当前代码猜测产品方向：

1. [CONTEXT.md](CONTEXT.md)：产品边界、已确认决策、冲突裁决和当前成熟度。
2. [DESIGN.md](DESIGN.md)：涉及 UI、交互、布局或视觉时的强制设计规范。
3. [docs/FEATURE_PARITY_MATRIX.md](docs/FEATURE_PARITY_MATRIX.md)：功能编号、优先级与验收状态。
4. [docs/BASELINE_INVENTORY.md](docs/BASELINE_INVENTORY.md)：冻结上游的页面、节点、API、快捷键与插件入口。
5. [docs/TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md)：进程边界、数据所有权和目标模块。
6. [docs/IMPLEMENTATION_ALIGNMENT.md](docs/IMPLEMENTATION_ALIGNMENT.md)：上游、设计参考与目标实现之间的映射。

涉及某项功能时，必须先找到对应 `IC-*` 编号，再检查冻结上游中的真实入口。找不到编号时先补矩阵，不把新行为塞进含糊的大条目。

## 2. 事实来源与冲突顺序

不同问题使用不同的权威来源：

- 产品行为：用户当前明确指令 → `CONTEXT.md` 已确认决策 → 功能矩阵/PRD → 冻结上游行为。
- 视觉与布局：用户当前明确指令 → `docs/reference/ui/` 参考图 → `DESIGN.md` → 上游视觉实现。
- 技术架构：已批准 ADR → `TECHNICAL_ARCHITECTURE.md` → `CONTEXT.md` 不变量 → 当前骨架。
- 功能范围：冻结上游提交是 `1.0.0` 复刻基线；用户可见变化必须由精确矩阵目标要求或“批准差异”承接。删除上游能力必须标为“批准差异”。

冻结参考位于 `reference/upstream-infinite-canvas`，提交必须保持为 `bc7efbde9ddab02f11abf738d7309b5689dbfa22`。该 submodule 只读：不得提交修改、升级提交或把它作为运行时依赖。

## 3. 不可破坏的架构边界

- Electron 主进程只负责应用生命周期、窗口、sidecar supervisor 和少量系统能力。
- preload 只暴露白名单、版本化、类型化 API；禁止通用 `send`、Node、文件系统或 shell 能力。
- React 渲染层不读写 SQLite，不导入 Python 实现，不获得任意文件系统权限。
- Python sidecar 是 SQLite 的唯一所有者；数据库始终位于本机。
- NAS/SMB 只用于不可变的大型媒体文件池，不保存 SQLite、密钥、项目状态、任务状态或操作历史。
- HTTP、SSE、WebSocket、IPC、插件协议、画布 schema 和导出格式必须版本化，跨边界类型优先放在 `packages/contracts`。
- 领域模块不能共享 ORM 模型或供应商 SDK；通过应用服务、端口和契约协作。
- 不复制上游 `main.py` 的巨型单文件结构，也不逐 URL 照搬 152 个接口；复刻的是可观察行为。

## 4. UI 实现规则

- `apps/renderer` 是 Electron 内的桌面工作区，不是营销网站或通用 Dashboard。
- 第一版用户界面只使用中文；技术日志和代码标识符可以使用英文。
- 使用 React、Tailwind CSS v4、shadcn/ui Nova 和 Lucide；新增 shadcn 组件通过官方 CLI。
- 必须使用 `DESIGN.md` 的语义令牌。禁止在页面内散落原始颜色、任意圆角、任意阴影和局部字体体系。
- 保持“应用栏/导航轨 → 上下文面板 → 无限工作面”的非对称桌面结构；不要退化为居中 Hero、三列卖点卡或大面积圆角卡片。
- 黑白灰是结构色；蓝色只表达智能/选择/链接，红色只表达危险、错误或需要注意的计数。
- 图标只用 Lucide 或批准的产品资产，不使用 emoji 充当界面图标。
- 常规界面满足键盘导航、可见焦点、语义标签、对比度和减少动态效果；画布必须同时提供节点列表辅助视图。
- 任何可见改动都要在实际 Electron/浏览器运行时检查目标路径、相邻状态和控制台错误；截图或人工证据写入对应测试/任务。

## 5. 工作方式

1. 先审计：记录上游文件、函数/DOM 入口、正常路径、异常路径和已有矩阵条目。
2. 再设计：确定领域边界、契约、数据迁移和 UI 状态；重大架构变化先写 ADR。
3. 纵向实现：优先交付“可打开、可操作、可保存、可恢复”的完整切片，不批量搭空壳。
4. 测试：正常、空、加载、失败、权限、断线和恢复状态都要有自动测试或明确人工证据。
5. 更新追踪：同步功能矩阵状态；只有具备规定证据才能标为“已验收”。
6. 提交：保持提交聚焦，提交信息关联 `IC-*`；不得顺手格式化或重构无关文件。

工作区可能包含用户的未提交修改。先运行 `git status`，保留所有无关改动；禁止使用 `git reset --hard`、`git clean` 或未经授权覆盖文件。

## 6. 常用命令

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm parity:check
.venv/bin/python -m ruff check services/backend
.venv/bin/python -m pytest services/backend/tests
```

桌面打包按当前平台运行：

```bash
pnpm --filter @ics/desktop package:mac
pnpm --filter @ics/desktop package:win
```

不要以“编译通过”代替行为验证。改动涉及安装包、sidecar、文件系统、数据库或 Electron 安全边界时，必须增加相应集成或打包冒烟。

## 7. 完成定义

一项任务只有同时满足以下条件才算完成：

- 需求与 `IC-*`、上游锚点和目标模块可双向追踪。
- 没有违反本文件、`CONTEXT.md`、`DESIGN.md` 或架构边界。
- 格式、lint、类型、单元测试、构建和矩阵检查通过；Python 改动同时通过 Ruff/Pytest。
- 用户可见路径已做运行时验证；跨平台行为按风险在 Windows/macOS 验证。
- 失败与恢复路径不会导致数据丢失、重复计费、凭证泄露或静默降级。
- 文档、矩阵、许可证/来源说明与代码同步。

若证据不足，使用“实现中”或“待验收”，不要提前宣称完成。
