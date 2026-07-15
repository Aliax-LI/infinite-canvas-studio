# IC-PROJECT-002：画布初始化切片

- 矩阵编号：`IC-PROJECT-002`
- 上游锚点：`static/canvas-list.html`、`static/css/canvas-list.css`、
  `static/js/canvas-list.js` 和 `main.py` 的 `/api/canvases` 路由家族。
- 目标模块：`services/backend/modules/canvases`、`services/backend/api`、
  `packages/contracts`、`apps/renderer`。

## 已实现

- 每个项目可通过 `GET` / `POST /v1/projects/{project_id}/canvases`
  读取和创建画布；所有调用仍受临时会话令牌保护。
- 画布保存在 SQLite `canvases` 表，包含项目外键、名称、传统/智能类型、排序值、
  初始视口和时间戳。项目不存在、空名称和错误类型均不会写入数据。
- 工作台的“新建画布”弹出紧凑表单，可选择“传统画布”或“智能画布”；已保存画布作为
  工作面卡片显示，带有类型、名称、节点数占位和可键盘选择状态。

## 当前证据

- 后端测试覆盖项目隔离、两种类型、稳定排序、缺失项目拒绝和重启后的持久化。
- Windows Electron 运行时人工验证：创建“运行时智能画布”后，工作面显示智能类型卡片；
  完整关闭并重启应用后，卡片和画布计数仍被读取并显示。

## 未完成验收

`IC-PROJECT-002` 保持“实现中”。重命名、复制、移动项目、删除/恢复、手动排序与
实际画布编辑器尚未实现；卡片的世界坐标平移、缩放和拖拽将在 `IC-CANVAS-001` 实现。
