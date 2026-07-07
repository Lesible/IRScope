# 样例 JPG / IR 温度数据解析

通用解析方法、伪代码和语言无关说明见 [`ir-image-format-generic.md`](./ir-image-format-generic.md)。

## 结论

`例图/*.jpg` 是“标准 JPEG 图像 + 文件尾部追加的私有 IR payload”。标准 JPEG 到真实 `FF D9` 结束；其后不是垃圾数据，而是红外温度矩阵和元数据。

已验证 7 张样例图的 IR payload 长度都为 `1,229,015` 字节。

## 文件结构

```text
[JPEG 标准数据]
  SOI/APP/Exif/Photoshop/XMP/DQT/SOF0/DHT/SOS/压缩图像/EOI(FF D9)
[IR payload]
  uint16_le version_or_magic = 256
  uint16_le width = 640
  uint16_le height = 480
  char[14] timestamp = YYYYMMDDhhmmss
  float32_le temperatures[width * height]
  byte[] metadata/unknown tail，当前样例中为温度矩阵之后直到文件末尾的剩余 bytes
```

温度矩阵是行主序：

```text
temp(x, y) = temperatures[y * width + x]
```

## 样例统计

| 文件 | 时间戳 | 温度范围 | 中心点 (320,240) |
|---|---:|---:|---:|
| 1.jpg | 20151008141617 | -0.82 .. 49.65 | 20.63 |
| 2.jpg | 20151008141623 | -4.57 .. 30.98 | 25.21 |
| 3.jpg | 20151008141629 | -12.66 .. 46.83 | 21.29 |
| 4.jpg | 20151008141635 | -43.15 .. 57.08 | 42.07 |
| 5.jpg | 20151008141641 | 16.57 .. 35.81 | 34.50 |
| 6.jpg | 20151008141647 | -5.23 .. 25.20 | 1.81 |
| 7.jpg | 20151008141653 | -0.08 .. 76.02 | 34.62 |

## 元数据证据

尾部 metadata 的已知字段已经补成结构化解析，详见 [`metadata-structure.md`](./metadata-structure.md)。核心字段包括：

- 发射率 `emissivity = 0.9`
- 环境温度 `environmentTemperature = 32.0`
- 距离原始值 `distanceRaw = 2584`
- 相对湿度 `relativeHumidityPercent = 50`
- MDF/修正温度候选值 `mdfOrCorrectionTemperature = 25.3`
- 厂商/生产者 `MISSION`
- 型号 `C600`
- 序列号 `1001`
- 经纬度候选值 `120.11896012, 30.1581147021`
- 说明 `This is the first file of standard IR`
- payload 偏移和 16 字节 GUID/校验字段

## 原工具区域统计证据

原程序确实支持分析对象温度：

- `YFIR.dll`
  - `yf_ana_get_max_temp`
  - `yf_ana_get_min_temp`
  - `yf_ana_get_avg_temp`
  - `yf_ir_update_ana_temp`
  - `yf_ir_get_ana_temp`
  - `yf_ir_get_temp_block` / `yf_ir_get_temp_block_ex`
- `YFDrawAna.dll`
  - `yf_draw_ana_point`
  - `yf_draw_ana_line`
  - `yf_draw_ana_rect`
  - `yf_draw_ana_ellipse`
  - `yf_draw_ana_poly`
  - `yf_draw_ana_polyline`
- `YFDrawShape.dll`
  - `yf_calc_pts_in_line`
  - `yf_calc_lines_in_ellipse`
  - `yf_pt_in_line`
  - `yf_normalize_rect`
  - `yf_draw_max_point`
  - `yf_draw_min_point`
- 字符串模板：`Max:%.1f`、`Min:%.1f`、`Avg:%.1f`

当前 Rust/Tauri 桌面实现复现点、线、矩形：

- 点：单像素。
- 线：Bresenham 整数像素线段，对应原工具 `yf_calc_pts_in_line` 的角色。
- 框：归一化矩形，包含边界像素，对应 `yf_normalize_rect` / `yf_draw_ana_rect`。

椭圆、多边形、多段线在 DLL 中有证据，但第一版没有实现；后续可在同一温度矩阵上加像素掩码。

## Rust/Tauri 使用

```bash
npm install
npm run tauri dev
```

桌面界面提供打开图片、点/线/框分析、图上温度标注、删除分析、CSV 导出和图片信息面板。CLI 不在 MVP 范围内。

## 可信度

高可信：JPEG EOI 定位、IR payload 起始、宽高、时间戳、float32 温度矩阵、点/线/矩形统计。证据来自样例文件的稳定二进制结构和 7 张图交叉验证。

中等可信：尾部 metadata 字段语义。可读字符串明确，但未完整还原结构体字段名；tail 总长度应视为可变，且“全部剩余 bytes 都是 metadata”目前是基于样例的解析模型。

待逆向：AD→温度公式、校准表、环境参数如何参与非直存温度文件。相关入口在 `YFCalcTemp.dll`、`YFCalibrate.dll`、`YFParaInfo.dll`。
