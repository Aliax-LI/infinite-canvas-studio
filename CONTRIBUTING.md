# 贡献指南

## 基本规则

1. 所有用户界面与用户文档在 `1.x` 阶段只使用中文。
2. 新功能必须关联功能复刻矩阵编号或经批准的新需求编号。
3. 不得绕过 `packages/contracts` 让渲染层直接依赖 Python 实现细节。
4. SQLite 只能由 Python 后端读写；Electron 与 React 通过契约接口访问。
5. shadcn/ui 组件通过官方 CLI 添加，样式使用语义化令牌，不写原始颜色覆盖。
6. 提交前运行 `pnpm lint`、`pnpm typecheck`、`pnpm test` 和 `pnpm parity:check`。

## 分支与提交

- 功能分支：`feat/<scope>-<description>`
- 修复分支：`fix/<scope>-<description>`
- 提交信息使用简短的中文或 Conventional Commits。

## 完成定义

- 有可验证的验收标准。
- 正常流程、错误流程与恢复流程均有测试。
- 数据迁移包含升级前备份及失败回滚测试。
- 用户可见行为更新了对应文档与复刻矩阵。
