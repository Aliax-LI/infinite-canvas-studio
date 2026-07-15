# Infinite Canvas Studio 项目上下文

本文为后续 Codex 任务提供精简但具约束力的背景。它综合会话 `019f648f-b9ee-7cf0-9896-4aa6904b94fc`、冻结上游代码、当前仓库文档和用户提供的界面参考图。

## 1. 当前状态

- 仓库：`Aliax-LI/infinite-canvas-studio`，默认分支 `main`。
- 阶段：`0.0.0` 工程骨架；不是可用产品，也没有完成上游功能复刻。
- 已有：Electron 安全外壳、React/shadcn 占位页、FastAPI sidecar 骨架、共享契约、Chrome/Photoshop 骨架、双平台 CI/Release 打包、桌面图标。
- 未有：真实资料库、SQLite schema、sidecar supervisor、项目/画布业务、画布引擎、任务系统、供应商适配器和插件端到端流程。
- 当前 renderer 的 Hero/里程碑卡片只验证构建链路，后续不能沿用为产品信息架构。

## 2. 产品一句话

Infinite Canvas Studio 是 Windows/macOS 上的本地优先中文 AI 无限画布，把项目、画布、素材、模型供应商、ComfyUI、任务历史和外部采集工具统一在一个桌面工作区中。

## 3. 已锁定决策

### 产品与发布

- `1.0.0` 完整复刻冻结上游的核心用户行为；界面和内部架构允许重做。
- Alpha 可以逐步交付，但每个 Alpha 必须可安装、可启动、可保存；核心缺失阻止 `1.0.0`。
- 平台：Windows 10 22H2/11 x64；macOS 13+ Apple Silicon。
- 第一版只提供中文，不支持 Linux、Intel Mac、多人协作或自有云账号。
- Chrome 扩展和 Photoshop 24.0+ UXP 插件都属于 `1.0.0` 范围。
- 更新只检查 GitHub Release 并打开系统浏览器，不在应用内自动覆盖升级。
- 保留上游署名和非商业、衍生源码公开限制。

### 数据与文件

- SQLite、项目、画布、节点、历史、任务和设置始终保存在本机，并且只由 Python 读写。
- API Key 与配对令牌是设备本地敏感配置，不进入导出、备份、诊断包或 NAS。
- 大型素材和生成文件按 SHA-256 内容寻址，可位于本机、外置盘或 NAS/SMB。
- 多台设备可以共享同一 NAS 文件池，但不共享数据库；NAS 实体文件不自动删除，清理前汇总设备引用清单。
- OneDrive、iCloud Drive、Dropbox 等同步目录不作为正式资料库场景。
- 普通导入会形成受管理副本；源文件变化只作为新版本导入，不静默覆盖。
- 删除进入 7 天回收站。素材修复只扫描受控路径，不扫描整块硬盘。

### 桌面与安全

- 单主窗口、多画布标签；同一资料库只允许一个应用实例写入。
- Windows 无任务时关闭即退出；macOS 遵循关闭窗口但应用仍运行的惯例。
- 活动任务可在后台继续；开机启动支持但默认关闭。
- Electron 渲染进程启用 sandbox/context isolation、禁用 Node integration；外链只允许 HTTPS 并交给系统浏览器。
- sidecar 与插件网关只监听回环地址，使用临时会话令牌和独立可撤销配对令牌。
- Chrome 拥有全站权限，但只在用户主动采集时读取页面，不后台扫描或记录历史。

### 任务、恢复与兼容

- 任务失败直接报错，不自动重试，避免重复计费；用户可以明确重新执行。
- 操作日志与快照支持最近 100 次跨重启撤销/重做。
- 崩溃恢复不覆盖正式画布；用户先预览，再选择恢复、另存或丢弃。
- `.icproject`、`.icanvas` 是公开版本化 ZIP 格式，双击先预览再导入。
- 数据库只做单向升级；升级前保护备份，旧应用遇到新 schema 时拒绝写入。
- 生成历史保存复现参数和结果引用，不保存密钥、请求头、Base64 或完整原始响应。

## 4. 已批准差异与明确非目标

- 删除上游“在线人数”，仅保留任务/素材实时事件通道。
- 不迁移或兼容上游 JSON 数据目录；目标数据模型从 SQLite 重新建立。
- 不逐 URL 复制上游 API，不保留巨型 `main.py` 架构。
- 不嵌入远程网页；教程、官网、注册与下载页在系统浏览器打开。
- `1.0.0` 不承诺完整屏幕阅读器画布编辑、触控屏或数位笔一级支持。
- macOS 未签名构建不承诺系统通知和无警告安装体验。

## 5. 被后续决策推翻的讨论

会话中曾在“NAS 资料库”含义不清时讨论网络 SQLite、租约锁、断线继续写入和跨设备接管。用户随后明确：NAS/SMB 只保存大型文件，供应商配置、密钥和结构化数据保存在本地。

因此下列方案均已失效，不得重新实现：

- 把 SQLite 放在 NAS/SMB。
- 为网络 SQLite 改用 rollback journal 或实现跨设备数据库租约。
- 跨设备自动接管未完成任务或合并离线数据库写入。

有效方案是“本机 SQLite + 可共享不可变文件池 + 设备引用清单”。

## 6. 冻结上游的角色

`reference/upstream-infinite-canvas` 固定到 `bc7efbde9ddab02f11abf738d7309b5689dbfa22`（版本 `2026.07.13`）。它是功能发现与行为验收的证据，不是要继续维护的代码基础。

上游关键事实：

- 13 个顶层 HTML 页面、13 个顶层脚本、152 个 FastAPI/Socket 装饰器。
- 标准与智能画布拥有不同节点工厂和快捷键入口。
- 项目工作台已经具备项目 CRUD、画布创建/移动/重命名/回收站、世界坐标卡片和平移缩放。
- Chrome、Photoshop 与 7 个内置工作流属于基线范围。

任何迁移任务必须先审计对应入口的正常、失败和恢复行为，再在新架构中实现等价用户结果。

## 7. 设计参考的角色

`docs/reference/ui/project-board-expanded.png` 与 `project-board-compact.png` 是当前获准的桌面视觉方向。它们要求：

- macOS/Windows 桌面壳层，而不是网页首页。
- 导航轨可展开/收起，上下文项目面板稳定存在。
- 黑白灰、细边框、极少圆角和阴影。
- 主工作面为带微弱网格的可平移空间，画布卡位于世界坐标。
- 高频动作集中在工作面顶栏，回收站固定在上下文面板底部。

细节以 [DESIGN.md](DESIGN.md) 为准。

## 8. 下一阶段建议

当前最合理的 P1 纵向切片是：

1. sidecar supervisor、随机端口、临时令牌和健康状态。
2. 本机资料库引导、SQLite/Alembic 首个 schema、资料库缺失恢复页。
3. 按 `DESIGN.md` 实现应用壳层与项目工作台。
4. 打通 Electron → sidecar → SQLite → React 的项目/画布创建、保存和重启恢复。
5. 在 Windows/macOS 安装包中完成该路径的真实冒烟。

在完成此切片前，不宜批量创建供应商、节点或素材管理空壳。

## 9. 相关文档

- [产品需求](docs/PRD.md)
- [技术架构](docs/TECHNICAL_ARCHITECTURE.md)
- [实现对齐表](docs/IMPLEMENTATION_ALIGNMENT.md)
- [冻结基线清点](docs/BASELINE_INVENTORY.md)
- [功能复刻矩阵](docs/FEATURE_PARITY_MATRIX.md)
- [分阶段任务](docs/PHASED_TASKS.md)
- [贡献指南](CONTRIBUTING.md)
