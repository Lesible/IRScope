# 整理前端温度统计与极值点绘制流程

## Goal

产出一份可供 Java + Vue Web 项目直接参考的 Markdown 文档，整理 IRScope 中最高温、最低温、平均温的统计数据来源，以及最高/最低温点从热图坐标映射到实际图片并通过前端 Canvas 绘制的完整流程。

## Background

- 目标文档路径为 `/Users/robot/Downloads/IRScope-frontend-temperature-analysis-drawing.md`，方便直接提供给其他项目引用。
- 当前源码使用 React/Tauri，但目标项目使用 Java 后端和 Vue Web；文档只提取可移植算法和数据契约，不复制 React Hooks 或 Tauri 调用。
- 推荐目标技术栈为 Java 后端、HTTP JSON、Vue 3 + TypeScript 和浏览器原生 Canvas 2D API，不新增绘图库。
- Java 后端返回全图统计，并根据 Vue 提交的热图区域坐标返回点、线、框统计。
- 统计结果包含像素数、最低温及坐标、最高温及坐标、平均温。目标实现由 Java 后端扫描温度矩阵，Vue 不重复计算。
- 前端使用实际 JPG 的 `naturalWidth` / `naturalHeight` 展示图片，分析坐标使用热图矩阵尺寸；两者不一致时必须双向缩放。
- 最高/最低点坐标属于热图坐标系，绘制前需要依次映射到图片坐标并应用旋转变换。

## Requirements

- 说明 Java、HTTP JSON、Vue 3、TypeScript 和 Canvas 2D 在该功能中的职责；不要求目标项目使用 React 或 Tauri。
- 给出 `Stats`、`ImageInfo`、`Mark` 等 TypeScript 数据结构，以及框架无关的 HTTP 请求/响应契约。
- 使用 Java 风格伪代码说明最高温、最低温、平均温的计算来源和公式：极值遍历、极值坐标记录、`sum / count` 平均值。
- 提供纯 TypeScript/Canvas 核心代码，并给出 Vue 组件接入示例，覆盖以下流程：
  - 指针位置从 CSS 显示尺寸转换到 Canvas 显示坐标。
  - 撤销图片旋转，得到原始 JPG 坐标。
  - JPG 坐标按端点对齐公式缩放为热图坐标。
  - 调用 Java HTTP 分析接口并将返回的统计结果保存到绘制标记。
  - 热图极值坐标反向映射到 JPG 坐标，再应用旋转得到 Canvas 坐标。
  - 绘制区域、最高/最低点、最高/最低/平均温标签和右侧统计信息。
- 明确端点对齐缩放公式：`round(source * (targetSize - 1) / (sourceSize - 1))`，并说明尺寸为 1、越界和旋转场景的处理。
- 用一条端到端流程描述数据流：用户指针操作 → 坐标转换 → HTTP 请求 → Java 区域统计 → Vue 响应式状态 → Canvas 重绘。
- 区分点分析和线/框分析：点分析只绘制单点温度；线/框分析额外绘制区域最高点、最低点和三项统计标签。
- 提供 Java + Vue 项目需要的最小接口、代码模块和注意事项；Canvas 绘制与坐标映射代码保持框架无关。
- 坐标和绘制算法必须可追溯到当前实现；Java HTTP 契约与 Vue 接入代码明确标注为移植模板或伪代码，不冒充现有 API。

## Acceptance Criteria

- [x] Markdown 文档包含 Java + Vue 技术栈、HTTP 数据契约、计算来源、坐标系、交互流程、绘制流程和移植说明。
- [x] 文档明确统计计算在 Java 后端完成，Vue 主要负责请求、状态管理、格式化和绘制。
- [x] 文档中的纯 TypeScript/Canvas 代码可追溯到 `src/App.tsx`、`src/lib/geometry.ts`、`src/types.ts`、`src/lib/format.ts` 和 `src/components/Inspector.tsx` 的现有逻辑，但不依赖 React/Tauri。
- [x] 文档解释图片尺寸与热图尺寸不一致时的双向映射，并覆盖旋转后的坐标顺序。
- [x] 文档能让一个 Java + Vue Web 项目根据 `Stats` 契约复用极值点和温度标签绘制逻辑。
- [x] 文档中的代码片段与当前源码核对一致，Markdown 格式检查通过。

## Out of Scope

- 修改现有前端、Rust 统计算法或界面样式。
- 在仓库 `docs/` 下新增同内容副本。
- 在目标代码中引入 React、Tauri 或第三方 Canvas 绘图库。
- 复制整个 `App.tsx` 或整理与温度统计绘制无关的文件打开、CSV 导出、窗口尺寸控制代码。
- 重复完整的红外 JPG 二进制解析说明；该内容继续引用现有格式与移植文档。
- 将绘制逻辑发布为独立 npm 包或新增依赖。
