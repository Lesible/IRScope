# Design: Rust footer parsing and preview coordinate mapping

## Data Flow

1. `ir::parse_bytes` 保持输出温度矩阵 `width/height`；header discovery 先验证文件末尾 `data_start`，失败后执行现有 `0..32` scan。
2. metadata 由 `descriptionLength` 计算动态 footer，只在 `138 + length + 20 == metadata.len()` 时读取偏移和 GUID/checksum。
3. `parse_ir_image` 和 TypeScript `ImageInfo` 合同不新增字段；React 在隐藏 JPEG `onLoad` 时读取 `naturalWidth/naturalHeight` 作为预览尺寸。
4. canvas 内部尺寸和窗口目标尺寸使用 JPEG 预览尺寸，CSS 只在可用窗口不足时等比缩小。
5. 点击链路为 `canvas CSS -> 旋转后 JPEG -> 未旋转 JPEG -> 温点矩阵`；分析请求和 `Mark` 始终保存温点矩阵坐标。
6. 绘制链路为 `温点矩阵 -> JPEG -> 旋转后 canvas`，区域最值坐标使用同一路径。

## Coordinate Contract

每个轴使用端点对齐的最近点映射：

```text
target = round(source * (targetSize - 1) / (sourceSize - 1))
```

输入先裁剪到源范围；任一尺寸为 1 时结果为 0。同尺寸映射为 1:1。

## Compatibility

- Tauri commands、Serde 字段、`ImageInfo.width/height` 和 CSV 坐标继续表示温点矩阵。
- Inspector 通过单独的前端 `previewSize` 展示 JPEG 图像尺寸，不改变后端协议。
- 不新增 crate/npm 依赖，不引入温度插值。

## Validation

- Rust 合成测试验证 footer 优先级、fallback 和动态 158/195 metadata。
- TypeScript 直接执行 `scalePoint` 验证同尺寸、双向 `640x512 <-> 384x288` 和旋转顺序。
- `123.jpg` 手工/运行时验证 `(439,182) -> (263,102) -> 67.28°C`。

## Rollback

解析改动限定在 `src-tauri/src/ir.rs`；UI 改动限定在现有 App、Inspector、geometry 和类型文件，无数据迁移或依赖变化。
