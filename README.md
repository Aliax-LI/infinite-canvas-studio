# Infinite Canvas Studio

Infinite Canvas Studio 是面向 Windows 与 macOS 的本地优先 AI 无限画布桌面应用。它基于 [hero8152/Infinite-Canvas](https://github.com/hero8152/Infinite-Canvas) 重新设计，目标是在全新桌面架构中完整复刻冻结基线的用户可见功能。

> 当前状态：项目骨架与规格阶段，尚未发布可用版本。

## 产品边界

- 首个正式版本支持 Windows 10 22H2 / Windows 11 x64，以及 macOS 13+ Apple Silicon。
- Electron 承载桌面能力，React、shadcn/ui Nova 和 Tailwind CSS v4 构建中文界面。
- Python FastAPI sidecar 承载业务逻辑，并通过 SQLAlchemy、Alembic 和 SQLite 持久化。
- SQLite、项目、画布和敏感配置保存在本机；大型素材可保存到本机、外置磁盘或 NAS/SMB。
- Chrome 扩展和 Photoshop UXP 插件属于 `1.0.0` 范围。
- 应用不提供账号、默认遥测或云端托管服务。

## 仓库结构

```text
apps/desktop             Electron 主进程与安全 IPC
apps/renderer            React + shadcn/ui 渲染层
services/backend         模块化 Python 后端
extensions/chrome        Chrome Manifest V3 采集扩展
extensions/photoshop     Photoshop UXP 插件
packages/contracts       跨进程业务契约
packages/canvas-model    画布领域模型
tests/parity             冻结基线功能验收
tests/e2e                桌面端到端测试
reference/               固定提交的只读上游参考
docs/                    PRD、架构、复刻矩阵与阶段任务
```

## 开始开发

要求 Node.js 22+、pnpm 10+ 和 Python 3.12。

```bash
pnpm install
pnpm dev
```

后端开发环境：

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -e "services/backend[dev]"
python -m infinite_canvas_studio.main
```

## 规格文档

- [产品需求文档](docs/PRD.md)
- [技术架构](docs/TECHNICAL_ARCHITECTURE.md)
- [功能复刻矩阵](docs/FEATURE_PARITY_MATRIX.md)
- [分阶段开发任务](docs/PHASED_TASKS.md)

## 授权与署名

本项目是非官方衍生项目，与原作者不存在官方隶属关系。项目继承上游“禁止商业封装、衍生软件保持源码公开并注明来源作者”的限制；详见 [LICENSE](LICENSE) 与 [NOTICE.md](NOTICE.md)。这是一份 source-available 非商业授权，不属于 OSI 定义的开源许可证。
