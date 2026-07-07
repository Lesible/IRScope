# Implementation Plan: 反编译当前项目

## Checklist

1. 创建 `decompiled/` 目录结构：`inventory/`、`interfaces/`、`analysis/`、`tools/`、`disasm/`。
2. 生成 PE 清单：文件大小、时间戳、导入、导出、PDB/关键字符串。
3. 为 `YF*.dll` 导出表生成接口草稿；MSVC mangled 名保留原名并备注可读含义。
4. 生成每个项目 PE 的反汇编文本；无反编译器时用 `objdump -d -Mintel` 作为最小可读产物。
5. 写 `java-ir-parser/`：
   - 扫描真实 JPEG EOI；
   - 解析 IR payload 头、温度矩阵、尾部元数据；
   - Maven + JDK 21，零第三方依赖；
   - CLI `--stats` 输出全图统计；
   - Swing `--gui [jpg]` 显示 JPEG 图像，支持点/线/矩形拖拽统计；
   - `--csv` 导出温度；
   - `--point x,y`、`--line x1,y1,x2,y2`、`--rect x1,y1,x2,y2` 输出区域统计。
6. 写 `analysis/temperature-parsing.md`：
   - JPEG 段扫描方法；
   - EOI 后私有数据结构；
   - 7 张样例的宽高、时间、温度范围、中心点；
   - 区域统计算法与 DLL 证据；
   - 未确认字段和后续逆向点。
7. 写 `decompiled/README.md` 索引。
8. 运行验证命令并记录结果。

## Validation Commands

- `find decompiled -type f | sort`
- `mvn -q -f decompiled/java-ir-parser/pom.xml test`
- `java -jar decompiled/java-ir-parser/target/irscope.jar --cli 例图/1.jpg --stats`
- `java -jar decompiled/java-ir-parser/target/irscope.jar 例图/1.jpg`
- `java -jar decompiled/java-ir-parser/target/irscope.jar --cli 例图/1.jpg --point 320,240 --line 0,0,639,479 --rect 100,100,200,200`
- `java -jar decompiled/java-ir-parser/target/irscope.jar --cli 例图/1.jpg --csv /tmp/temps.csv && head /tmp/temps.csv`
- 校验 7 张样例尾随数据长度均为 `1229015`，宽高均为 `640x480`。

## Rollback Points

- 只新增 `decompiled/` 和 Trellis 任务文件；删除 `decompiled/` 即可回滚产物。
- 不修改原始 `.exe/.dll/.jpg/.log`。
