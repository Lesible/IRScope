# 消除打包工作流 Node.js 20 告警

## Goal

消除现有 GitHub 打包工作流中官方 Action 使用 Node.js 20 运行时的弃用告警，并将项目构建环境统一到 Node.js 24。

## Background

- `rust-version` 是当前唯一包含 GitHub Actions 打包工作流的分支，工作流位于 `.github/workflows/cross-platform-build.yml`。
- `java-version` 和 `master` 当前不包含 GitHub Actions 工作流，也没有 `uses: actions/*` 引用。
- 官方 `action.yml` 已确认：`actions/checkout@v5`、`actions/setup-node@v5` 和 `actions/upload-artifact@v6` 均使用 `node24`。
- 本机验证环境为 Node.js 24，可覆盖前端生产构建和 Tauri debug 打包。

## Requirements

- 将现有打包工作流中的 `actions/checkout@v4` 升级为 `actions/checkout@v5`。
- 将现有打包工作流中的 `actions/setup-node@v4` 升级为 `actions/setup-node@v5`。
- 将现有打包工作流中的 `actions/upload-artifact@v4` 升级为 `actions/upload-artifact@v6`。
- 将 `actions/setup-node` 安装的项目构建版本从 Node.js 22 升级为 Node.js 24。
- 不改变工作流触发条件、构建矩阵、构建命令和产物配置。
- 将 `rust-version` 的结果同步到 GitHub 和 GitLab 对应分支。

## Acceptance Criteria

- [x] 所有现有打包工作流不再引用上述基于 Node.js 20 的 Action 版本。
- [x] 三项 Action 的目标版本均由官方 `action.yml` 声明使用 `node24`。
- [x] 工作流使用 Node.js 24 执行项目构建，并可被本机 Node.js 24 环境验证。
- [x] 工作流 YAML 可被解析，且除 Action 主版本和项目 Node.js 版本外没有行为改动。
- [x] GitHub 与 GitLab 的 `rust-version` 指向同一修复提交。

## Out of Scope

- 为没有 GitHub Actions 配置的分支新增打包工作流。
- 升级 Node.js 以外的其他构建依赖。
