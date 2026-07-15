# IC-SHELL-001：sidecar supervisor

- 矩阵编号：`IC-SHELL-001`
- 用户目标：安装包启动本地 Python sidecar 时不要求用户单独安装 Python。
- 上游锚点：无直接上游实现；这是目标架构替换项。冻结基线仅作为功能范围证据，进程边界遵循 `docs/TECHNICAL_ARCHITECTURE.md` 4.1。
- 目标模块：`apps/desktop`、`services/backend`、`packages/contracts`。

## 本次实现

- Electron 在每个会话选择回环随机端口，生成 256-bit 临时令牌，启动打包的 `ics-backend`；开发态显式传入后端源码路径。
- 主进程轮询携带令牌的 `/v1/health`，验证协议主版本后才把可用运行时描述暴露给受限 preload。
- sidecar 仅使用 `127.0.0.1`，所有 HTTP 请求（包括健康探测）必须使用 `x-ics-session-token`。
- 异常退出最多自动重启两次；连续失败将以可重试的诊断状态返回给渲染层。关闭应用时终止子进程。

## 路径与证据

- 正常路径：随机端口 → 启动 sidecar → 令牌健康检查 → `backend.status = ready`。
- 失败路径：启动或健康检查三次失败后 → `backend.status = unavailable`，不暴露错误令牌。
- 恢复路径：sidecar 意外退出时限次重启，超过上限进入诊断状态。
- 自动证据：`services/backend/tests/test_health.py` 覆盖授权健康响应及未授权拒绝。
- 人工运行时证据（2026-07-15，Windows）：以临时令牌启动 FastAPI，授权 `/v1/health` 返回协议版本 `1`；未携带令牌返回 `401`。

## 待验收

仍需在 Windows x64 与 macOS arm64 安装包中运行 PyInstaller sidecar 并完成启动冒烟，才能将矩阵项标记为“已验收”。
