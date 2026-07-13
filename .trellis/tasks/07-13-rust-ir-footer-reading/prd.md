# Rust 补全红外读取和预览坐标映射

## Goal

在 `rust-version` 中实现与已验证 Java 合同一致的 footer-indexed IR header discovery、动态 metadata footer 解析，并修复 JPEG 预览尺寸与温度矩阵尺寸不同时的展示和温点坐标映射。

## Requirements

- R1. `parse_bytes` 必须在 bounded scan 前尝试最后 20 字节中的 `data_start`，并复用唯一 header candidate validator。
- R2. footer 候选越界、损坏或校验失败时必须回退现有 scan。
- R3. metadata 必须按 `138 + descriptionLength` 解析动态 `data_start` 和 GUID/checksum，长度不一致时保持默认值。
- R4. 保持现有 Tauri commands 和前端字段兼容，不新增依赖。
- R5. 图片信息必须分别展示 JPEG 图像尺寸和热图/温点矩阵尺寸。
- R6. 图片以 JPEG 实际尺寸作为展示和交互坐标空间；查询温度前按端点对齐比例映射到温点矩阵，绘制分析标记时反向映射。
- R7. JPEG 与温点矩阵同尺寸时坐标保持 1:1；现有旋转、点/线/框分析和 CSV 的温点矩阵坐标语义不变。
- R8. 同步通用格式、验证文档和 Trellis 后端规范。

## Acceptance Criteria

- [x] 可信 footer 能消除合理假头误选；footer 无效时仍可通过 bounded scan 解析。
- [x] 158/195 字节 metadata 均按动态描述长度解析偏移和 GUID/checksum。
- [x] `123.jpg` 显示 JPEG `640x512` 和温点矩阵 `384x288` 两种尺寸。
- [x] JPEG 坐标 `(439,182)` 映射到温点 `(263,102)`，读数为 `67.28°C`，分析标记反向落回原 JPEG 位置。
- [x] 同尺寸样本保持 1:1，旋转后的点击映射正确。
- [x] 7 张内置样本、Rust 测试、前端构建和格式检查通过。

## Out Of Scope

- 不改变 Tauri command 协议、CSV 坐标语义或温度矩阵存储。
- 不引入插值温度；图片像素使用最近的温点矩阵坐标。
- 不提交 `/Users/robot/Downloads/123.jpg` 或其他下载样本。
