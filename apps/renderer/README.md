# 渲染层

该工作区承载 Infinite Canvas Studio 的本地 React 界面。

## 技术约束

- 使用 React、Vite、TypeScript、Tailwind CSS v4 和 shadcn/ui Nova。
- 颜色、圆角和主题必须使用 `src/index.css` 中的语义变量，不在业务组件中散落原始颜色。
- 生产页面只加载本地资源，并通过 CSP 限制脚本、对象和网络连接。
- 不启用 Node Integration；业务通过带会话令牌的本机 API 调用，桌面能力通过受限 preload API 调用。
- 首版用户界面与用户文档使用简体中文。

## 命令

```bash
pnpm --filter @ics/renderer dev
pnpm --filter @ics/renderer lint
pnpm --filter @ics/renderer typecheck
pnpm --filter @ics/renderer build
```

新增 shadcn/ui 组件前先检查 `components.json`，并保留组件生成器的可访问性语义。
