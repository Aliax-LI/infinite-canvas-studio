# IC-PROJECT-001：项目初始化切片

- 矩阵编号：`IC-PROJECT-001`
- 上游锚点：冻结清单记录的项目入口为
  `reference/upstream-infinite-canvas/static/js/canvas-list.js`；本次仅实现
  目标架构中的默认项目、读取和创建切片，尚未覆盖上游的重命名、删除与搜索。
- 目标模块：`services/backend`、`packages/contracts`、`apps/renderer`。

## 已实现

- Python sidecar 独占本地 SQLite：资料库目录包含 `database/studio.sqlite3`，
  SQLAlchemy 连接启用外键、WAL 和 5 秒 busy timeout。
- Alembic 首个迁移建立 `projects` 和 `canvases`，画布的项目外键使用
  `RESTRICT`，避免未设计的级联删除。
- sidecar 启动时创建“未命名项目”默认项目；`GET` / `POST /v1/projects`
  经会话令牌鉴权后提供读取和创建。
- Electron 渲染器只经受限 preload 获取临时令牌和 loopback 地址；CORS 只
  接受桌面渲染器来源（开发模式为 Vite 来源，安装包为 `null`）且不替代令牌鉴权。
- 三层工作台展示项目、选择状态和空画布状态，可从项目面板创建项目。

## 当前证据

- 后端测试覆盖默认项目持久化、创建、空名称拒绝、Alembic 当前版本、SQLite
  外键/WAL/busy timeout 和允许的渲染器来源。
- Windows 开发运行时人工验证：桌面应用启动后显示默认项目；创建
  “运行时验收项目”后项目立即选中并显示在工作台。

## 未完成验收

`IC-PROJECT-001` 仍处于“实现中”。重命名、复制、删除、恢复、搜索及其 E2E
覆盖尚未实现；`IC-PROJECT-002` 的画布 CRUD 与排序也未开始。安装包中的
PyInstaller sidecar 仍需在 `IC-SHELL-001` 的双平台打包冒烟中验证。
