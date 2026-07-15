# 第三方软件说明

本文件记录工程骨架直接使用的主要第三方软件。发布安装包前必须从锁文件和冻结的 Python 环境生成完整传递依赖清单，并把各许可证正文随制品分发；本表不能替代依赖自身的许可证。

| 组件              | 当前版本 | 许可证                                     | 用途                |
| ----------------- | -------- | ------------------------------------------ | ------------------- |
| Electron          | 41.10.2  | MIT                                        | 桌面运行时          |
| React / React DOM | 19.2.7   | MIT                                        | 渲染层              |
| Vite              | 8.1.4    | MIT                                        | 前端构建            |
| Tailwind CSS      | 4.3.2    | MIT                                        | 样式系统            |
| shadcn/ui CLI     | 4.13.0   | MIT                                        | 组件生成工具        |
| Base UI           | 1.6.0    | MIT                                        | 无样式组件原语      |
| Lucide React      | 1.24.0   | ISC                                        | 图标                |
| FastAPI           | 0.139.0  | MIT                                        | 本地 HTTP 服务      |
| SQLAlchemy        | 2.0.51   | MIT                                        | 数据访问            |
| Alembic           | 1.18.5   | MIT                                        | 数据库迁移          |
| Uvicorn           | 0.51.0   | BSD-3-Clause                               | ASGI 服务器         |
| HTTPX             | 0.28.1   | BSD-3-Clause                               | HTTP 客户端         |
| Pillow            | 12.3.0   | MIT-CMU                                    | 图像处理            |
| PyInstaller       | 6.21.0   | GPL-2.0-or-later with bootloader exception | Python sidecar 打包 |

版本以 `pnpm-lock.yaml` 和构建环境实际解析结果为准。可使用以下命令审计当前环境：

```bash
pnpm licenses list --prod --json
pnpm licenses list --dev --json
python -m pip inspect
```

计划内的 LGPL FFmpeg/ffprobe 尚未进入当前工程或安装包。引入时必须锁定构建配置、保存对应源码与构建说明，并在本文件中补充准确版本和许可证选项。
