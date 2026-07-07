# 反编译当前项目

## Goal

将当前目录中的 Windows 可执行文件和动态库反编译/提取为可读分析资料，核心目标是弄清软件如何解析 `例图/*.jpg`：标准 JPEG 图像、EOI 后私有 IR 数据、温度矩阵、尾部元数据，以及原程序划点/线/框获取最高、最低、平均温度的实现证据链；同时提供可运行脚本复现解析和区域统计。

## Background / Confirmed Facts

- 当前目录不是 Git 仓库；Trellis 处于 single-repo mode。
- 目标文件是 32-bit Windows PE：`国网红外数据文件校验软件.exe` 和 21 个 `YF*.dll`，另有 `boost_*`、`lua51.dll` 运行库，以及 `例图/*.jpg`、`Log/*.log`。
- 主程序 `国网红外数据文件校验软件.exe`：PE32 GUI，MFC 依赖 `mfc100u.dll`，LinkerVersion 10.0，时间戳 `Thu Apr 14 16:56:01 2016`。
- DLL 基本为 MSVC 2010 / VC100 产物，导入 `MSVCR100.dll` / `MSVCP100.dll`，部分导入 Boost 1.52、Lua 5.1。
- 多个二进制内含 PDB 路径，如 `E:\job\yfcam-core\dll\bin\Release\YFCalibrate.pdb`，说明原始工程名大概率为 `yfcam-core`。
- `file`/`objdump` 未发现 CLR header；当前证据指向 native C/C++，不是 .NET 程序。
- 本机当前可用基础工具包括 `objdump`、`strings`、`python3`；未发现 `rabin2/r2/ghidra/retdec-decompiler/ilspycmd/dotnet`。
- 用户确认交付目标按“可读分析资料”执行，不优先追求可编译工程；用户确认需要可运行提取脚本；最终要使用 Java 代码，允许 Maven + JDK 8-21；用户追加需要内部简单前端验证，优先用 Swing/AWT。
- 已验证 `例图/1.jpg` 到 `例图/7.jpg` 在真实 JPEG EOI (`FF D9`) 后均追加 `1,229,015` 字节私有数据。
- 追加数据结构初步证据：前 6 字节按 little-endian `uint16` 解析为 `256, 640, 480`；随后 14 字节 ASCII 时间戳，如 `20151008141617`；随后 `640*480` 个 little-endian `float32` 温度值；末尾 `195` 字节元数据，含 `MISSION`、`C600`、`1001`、`This is the first file of standard IR`。
- 温度矩阵直接可读：例如 `1.jpg` 温度范围约 `-0.82..49.65`，中心点约 `20.63`；`7.jpg` 温度范围约 `-0.08..76.02`。
- 文件解析证据链集中在 `YFIR.dll`/`IR.cpp`：字符串包括 `emiss`、`envtemp`、`dist`、`relhum`、`.IRP`、`.IRV`、`IR::save_ir_image`、`IR::save_ir_image_no_temp`、`This is the first file of standard IR`。
- 区域统计证据链：`YFIR.dll` 导出 `yf_ana_get_max_temp`、`yf_ana_get_min_temp`、`yf_ana_get_avg_temp`、`yf_ir_update_ana_temp`、`yf_ir_get_ana_temp`、`yf_ir_get_temp_block(_ex)`；字符串含显示模板 `Max:%.1f`、`Min:%.1f`、`Avg:%.1f`。
- 图形/划线画框证据链：`YFDrawAna.dll` 导出 `yf_draw_ana_point/line/rect/ellipse/poly/polyline`；`YFDrawShape.dll` 导出 `yf_calc_pts_in_line`、`yf_calc_lines_in_ellipse`、`yf_pt_in_line`、`yf_normalize_rect`、`yf_draw_max_point`、`yf_draw_min_point`；`YFFormatAnaStr.dll` 导出分析对象字符串解析/格式化函数。
- 温度换算相关 DLL 包括 `YFCalcTemp.dll`、`YFCalibrate.dll`、`YFIRImaging.dll`；但样例 JPG 已含 float32 温度矩阵，脚本可直接读取温度，不必先复原 AD→温度公式。

## Requirements

- R1. 产出一个独立反编译工作区，不覆盖原二进制和样例数据。
- R2. 对主 EXE 和全部项目 DLL 建立清单：文件类型、大小、时间戳、依赖、导入、导出、可见字符串/PDB 路径。
- R3. 尽可能恢复 C/C++ 接口头文件：至少包含 DLL 导出函数、调用约定、可推断参数/返回类型；无法可靠推断的类型必须明确标注。
- R4. 尽可能产出每个模块的反汇编/伪源码级文本；不承诺恢复原始变量名、注释、目录布局或可直接编译的原源码。
- R5. 文档化 `例图/*.jpg` 完整解析链：JPEG 标准段、真实 EOI 定位、EOI 后 IR payload、温度矩阵、尾部元数据、相关 DLL 证据；另提供 `ir-image-format-generic.md` 作为与 Java 无关的通用解析方法和伪代码文档；提供 `metadata-structure.md` 命名 195 字节元数据结构。
- R6. 提供 Maven + JDK 8-21 Java 实现：能解析样例图、输出元信息和全图温度统计、导出 CSV，并支持点/线/矩形区域最高/最低/平均温度统计；提供 Swing 验证界面。
- R7. 产出 README/索引，说明如何浏览恢复资料、如何运行脚本、哪些结论可信、哪些字段仍是推断。

## Acceptance Criteria

- [ ] `decompiled/` 输出目录存在，且原始 `.exe/.dll/.jpg/.log` 未被修改。
- [ ] 输出目录含模块清单，覆盖 `国网红外数据文件校验软件.exe` 与全部 21 个 `YF*.dll`。
- [ ] 每个项目 DLL 至少有导出 API 记录；有导出的 DLL 生成对应 `.h` 草稿或等价接口文档。
- [ ] 每个项目 PE 至少有一份反汇编/伪源码级文本输出，失败项有原因记录。
- [ ] `analysis/temperature-parsing.md` 说明 `例图/*.jpg` 完整解析证据链，覆盖 JPEG 标准段、EOI 后追加数据结构、温度矩阵布局、尾部元数据和相关 DLL 证据。
- [ ] `analysis/ir-image-format-generic.md` 以语言无关方式详细说明红外 JPG 通用解析方法、伪代码和区域统计方法。
- [ ] `analysis/metadata-structure.md` 说明 195 字节尾部元数据偏移、类型、字段名、可信度和伪代码。
- [ ] `mvn -q -f decompiled/java-ir-parser/pom.xml test` 通过，覆盖样例图解析和点/线/矩形统计。
- [ ] `java -jar decompiled/java-ir-parser/target/irscope.jar --cli 例图/1.jpg --stats` 输出宽高、时间戳、全图最小/最大/平均温度。
- [ ] Java CLI 支持 `--csv out.csv` 导出 `x,y,temp` 或等价温度矩阵 CSV。
- [ ] Java CLI 支持点、线、矩形区域统计；区域统计输出像素数量、最小/最大/平均温度和最值坐标。
- [ ] `java -jar decompiled/java-ir-parser/target/irscope.jar 例图/1.jpg` 打开 Swing 界面，可点击/拖拽验证点、线、矩形温度统计。
- [ ] 输出目录含一份总 README，列出恢复方法、工具限制、可信度说明和下一步建议。

## Out of Scope

- 保证生成与原厂源码完全一致的 C++ 工程。
- 保证一次性生成可重新编译、行为完全等价的程序。
- 修改、破解或绕过程序运行逻辑；本任务只做恢复和分析产物。
- 第一版 Java 实现不默认实现椭圆、多边形、多段线统计；这些会在文档中记录原 DLL 证据，除非用户要求加入。

## Open Questions

- 无。
