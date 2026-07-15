# 冻结基线清点

本清点以只读 submodule `reference/upstream-infinite-canvas` 的提交 `bc7efbde9ddab02f11abf738d7309b5689dbfa22` 为唯一来源，用于给功能矩阵提供可复查锚点。它记录入口和数量，不代表当前 88 项矩阵已经完成逐按钮验收。

## 规模快照

| 对象                       | 数量 | 来源                                                                   |
| -------------------------- | ---: | ---------------------------------------------------------------------- |
| FastAPI 路由/Socket 装饰器 |  152 | `main.py` 中的 `@app.*`                                                |
| 顶层 HTML 页面             |   13 | `static/*.html`                                                        |
| 顶层前端脚本               |   13 | `static/js/*.js`                                                       |
| 内置工作流 JSON            |    7 | `workflows/*.json`                                                     |
| 外部配套组件               |    2 | `tools/chrome-local-asset-importer`、`tools/photoshop-asset-connector` |

## 页面入口

| 入口                           | 主要领域                       | 对应矩阵                     |
| ------------------------------ | ------------------------------ | ---------------------------- |
| `static/index.html`            | 启动页与导航                   | `IC-SHELL-*`                 |
| `static/canvas-list.html`      | 项目和画布列表                 | `IC-PROJECT-*`               |
| `static/canvas.html`           | 标准节点画布                   | `IC-CANVAS-*`、`IC-NODE-*`   |
| `static/smart-canvas.html`     | 智能画布、素材提及与批量运行   | `IC-CANVAS-*`、`IC-TASK-*`   |
| `static/asset-manager.html`    | 素材、工作流、提示词和共享目录 | `IC-ASSET-*`                 |
| `static/api-settings.html`     | 供应商、模型和 RunningHub      | `IC-PROVIDER-*`              |
| `static/comfyui-settings.html` | ComfyUI 实例和工作流           | `IC-COMFY-*`                 |
| `static/gpt-chat.html`         | 文本对话                       | `IC-NODE-004`、`IC-TASK-*`   |
| `static/angle.html`            | Angle 生成功能                 | `IC-PROVIDER-*`、`IC-NODE-*` |
| `static/enhance.html`          | 图片增强                       | `IC-EDIT-*`                  |
| `static/klein.html`            | Klein 工作流                   | `IC-COMFY-*`、`IC-NODE-*`    |
| `static/zimage.html`           | Z-Image 工作流                 | `IC-COMFY-*`、`IC-NODE-*`    |
| `static/online.html`           | 原 Web 在线人数                | `IC-LEGACY-001`（批准删除）  |

## 画布节点基线

标准画布的节点工厂位于 `static/js/canvas.js:2450-3125`，菜单分派位于 `static/js/canvas.js:3514-3541`：

- `image`、`prompt`、`loop`、`group`
- `llm`、`generator`、`msgen`、`video`
- `rh`、`comfy`、`ltxDirector`、`output`

智能画布的节点工厂位于 `static/js/smart-canvas.js:5864-5913`，至少包含 `smart-image`、`smart-prompt`、`smart-loop` 和 `smart-group`。实现阶段必须继续审计节点的参数面板、输入输出端口、运行路径和异常状态，不能只按类型名称验收。

## 画布交互锚点

- 标准画布快捷键：`static/js/canvas.js:14657-14722`。
- 智能画布快捷键：`static/js/smart-canvas.js:16048-16118`。
- 标准画布渲染/拖拽/连线：`static/js/canvas.js`。
- 智能画布渲染/拖拽/连线：`static/js/smart-canvas.js`。
- 图片预览：`static/js/image-preview.js`。
- LTX 时间线：`static/js/ltx-director-timeline.js`。
- 触摸/鼠标兼容层：`static/js/touch-mouse.js`；首版只把鼠标和触控板列为一级验收。

## 后端 API 家族

152 个装饰器均位于 `main.py`。矩阵按以下入口家族追踪，而不是复用原 URL 设计：

| 原入口家族                                                        | 领域                                            |
| ----------------------------------------------------------------- | ----------------------------------------------- |
| `/api/projects`、`/api/canvases`                                  | 项目、画布、回收站                              |
| `/api/local-assets`、`/api/asset-library`、`/api/shared-folders`  | 素材、分类、共享目录                            |
| `/api/providers`、`/api/models`、`/api/config`                    | 供应商、模型、配置                              |
| `/api/canvas-image-tasks`、`/api/canvas-video`、`/api/canvas-llm` | 图片、视频、文本任务                            |
| `/api/runninghub`                                                 | RunningHub 应用和工作流                         |
| `/api/comfyui`、`/api/workflows`                                  | ComfyUI 实例和工作流                            |
| `/api/codex`、`/api/gemini-cli`、`/api/jimeng`                    | CLI 类集成                                      |
| `/api/chat`、`/api/conversations`、`/api/history`                 | 会话和生成历史                                  |
| `/api/check-update`、`/api/update-*`                              | 原 Web 更新流程；桌面版改为只检查并打开 Release |
| `/ws/stats`                                                       | 原在线人数 Socket；仅保留新的任务/素材事件语义  |

新架构不会逐 URL 复制这 152 个接口，而是通过功能矩阵保留用户行为，并用版本化领域 API 替代。

## 配套组件与工作流

- Chrome：`tools/chrome-local-asset-importer/manifest.json`、`background.js`、`popup.js`、`sidepanel.html`。
- Photoshop：`tools/photoshop-asset-connector/manifest.json`、`index.html`、`style.css`。
- 内置工作流：`workflows/2511.json`、`Flux2-Klein.json`、`LTXDirectorv2-API.json` 及其配置、`Z-Image*.json`、`upscale.json`。

## 后续审计门槛

在某个 `IC-*` 条目进入“实现中”之前，负责人必须把该条目的上游函数/DOM 入口、正常路径、异常路径和验收证据写入测试或 issue。基线清点脚本和矩阵校验只能防止范围漂移，不能证明功能等价。
