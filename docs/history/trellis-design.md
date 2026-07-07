# Design: 反编译当前项目

## Architecture and Boundaries

- 原始文件保持只读；所有产物写入 `decompiled/`。
- 产物分四层：
  1. `inventory/`：PE 清单、导入导出、字符串、PDB 路径、资源摘要。
  2. `interfaces/`：由导出表恢复的 `.h` 草稿和调用约定备注。
  3. `analysis/temperature-parsing.md`：样例 JPG/IR 完整解析与区域统计证据链。
  4. `java-ir-parser/`：Maven + JDK 21 Java 解析库、CLI 和 Swing 验证界面。
- 可读分析优先；不建立完整可编译 VC++ 工程。

## File Parsing Model

- 样例 JPG = 标准 JPEG 图像 + EOI 后私有 IR payload。
- 解析入口扫描 JPEG marker，定位真实 SOS 后的 EOI，避免误把 APP 段或压缩数据中的字节当作文件结束。
- 当前证据支持 IR payload 格式：
  - `uint16_le magic_or_version = 256`
  - `uint16_le width = 640`
  - `uint16_le height = 480`
  - `char[14] timestamp = YYYYMMDDhhmmss`
  - `float32_le temp[width*height]`，行主序，索引 `temp[y * width + x]`
  - `195` 字节尾部元数据，含 `MISSION`、`C600`、`1001`、`This is the first file of standard IR` 和未命名二进制字段
- Java 实现优先读取已保存的 float32 温度矩阵；AD→温度公式通过 DLL 文档记录，不作为样例图解析的必要路径。

## Region Statistics Model

- 点：单像素 `(x, y)`。
- 线：用整数 Bresenham 采样线段像素，和 `YFDrawShape.dll` 的 `yf_calc_pts_in_line` 证据对应。
- 矩形：归一化左上/右下边界，包含边界像素，和 `yf_normalize_rect` / `yf_draw_ana_rect` 证据对应。
- 输出：`count/min/max/avg/min_xy/max_xy`。
- 椭圆、多边形、多段线：DLL 有证据，但第一版不默认实现，避免扩范围；需要时可按同一温度矩阵加像素掩码扩展。

## Binary Evidence Chain

- `YFIR.dll`：IR 主对象、文件读写、全图温度、分析对象温度：`yf_ir_get_temp_from_loc(_ex)`、`yf_ir_get_temp_block(_ex)`、`yf_ir_get_max_temp`、`yf_ir_get_min_temp`、`yf_ana_get_max_temp/min_temp/avg_temp`、`yf_ir_update_ana_temp`。
- `YFDrawAna.dll`：交互绘制点/线/矩形/椭圆/多边形/多段线。
- `YFDrawShape.dll`：点在线上、线段点集、椭圆扫描线、矩形归一化、最高/最低点绘制。
- `YFFormatAnaStr.dll`：分析对象字符串格式化/解析。
- `YFFileIdentify.dll`：文件头尾、宽高、记录时间、修复判断。
- `YFCalcTemp.dll` / `YFCalibrate.dll`：AD/校准/环境参数到温度的后续深入入口。

## Trade-offs

- 使用本机已有 `objdump`/`strings`/Python 即可证明样例温度布局和区域统计；跳过安装大型反编译器，除非接口/调用链证据不足。
- 第一版区域统计只实现用户明确提到的线/框，加上点；椭圆/多边形先文档化证据，避免把 Swing 验证界面做成完整 GUI 克隆。
