# 架构目录

此目录存放影响进程边界、数据所有权、持久化格式或插件协议的 ADR。

当前目标目录结构以 [技术架构](../TECHNICAL_ARCHITECTURE.md) 为准：

```text
apps/desktop             Electron 主进程、preload、sidecar supervisor 和打包
apps/renderer            React 桌面工作区、画布与领域界面
services/backend         Python sidecar、领域模块与基础设施适配器
packages/contracts       跨进程、HTTP、事件与插件的版本化契约
packages/canvas-model    画布文档和操作模型
extensions/              Chrome 与 Photoshop 配套组件
tests/parity             冻结上游行为追踪
tests/e2e                桌面端到端与安装包冒烟
reference/               固定提交的只读上游 submodule
```

后端新增的领域包只声明边界；路由、SQLite 模型和第三方 SDK 必须仍留在各自的 API、数据库或适配器层，不能作为跨模块共享实现。
