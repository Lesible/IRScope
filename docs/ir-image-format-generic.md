# 红外 JPG 图片通用解析方法

本文档描述一种与语言无关的解析方法，用于解析本项目样例中的红外 JPG 图片。它不是 Java API 文档，也不依赖任何具体实现。

## 1. 文件总体结构

样例文件表面是标准 JPEG，但在 JPEG 正常结束标记之后追加了私有红外数据块。

```text
+---------------------------+
| Standard JPEG bytes       |
| - SOI FF D8               |
| - APP/Exif/XMP/Photoshop  |
| - DQT/SOF/DHT/SOS         |
| - compressed image data   |
| - EOI FF D9               |
+---------------------------+
| Private IR payload        |
| - header                  |
| - temperature matrix      |
| - metadata tail           |
+---------------------------+
```

关键点：不要简单搜索文件中第一个 `FF D9`。必须按 JPEG marker 规则解析，找到真正的图像压缩数据结束位置。

## 2. JPEG 真实 EOI 定位

JPEG 结构中可能出现多个类似 `FF D9` 的字节序列，特别是在 APP 段、Exif/XMP、Photoshop 信息或压缩数据附近。正确做法是从 SOI 开始按 marker 走。

### 2.1 JPEG marker 基本规则

- 文件应以 `FF D8` 开始，即 SOI。
- 大多数 marker 后面有 2 字节 big-endian 长度字段，该长度包含长度字段本身。
- SOS (`FF DA`) 后进入压缩图像数据。
- 压缩图像数据中：
  - `FF 00` 是字节填充，不是 marker。
  - `FF D0` 到 `FF D7` 是 restart marker。
  - `FF D9` 才是真实 EOI。

### 2.2 EOI 定位伪代码

```text
function find_true_jpeg_eoi(bytes):
    require bytes[0:2] == FF D8

    i = 2
    while i < length(bytes):
        if bytes[i] != FF:
            i = i + 1
            continue

        while bytes[i] == FF:
            i = i + 1

        marker = bytes[i]
        i = i + 1

        if marker == D9:
            return i - 2

        if marker == DA:                 # Start Of Scan
            segment_length = read_u16_be(bytes, i)
            i = i + segment_length

            while i + 1 < length(bytes):
                if bytes[i] == FF:
                    next = bytes[i + 1]

                    if next == 00:
                        i = i + 2        # stuffed FF byte
                        continue

                    if D0 <= next <= D7:
                        i = i + 2        # restart marker
                        continue

                    if next == D9:
                        return i         # true EOI offset

                i = i + 1

            fail "EOI not found after SOS"

        if marker has no length field:
            continue

        segment_length = read_u16_be(bytes, i)
        i = i + segment_length

    fail "EOI not found"
```

## 3. IR payload 起始位置

找到真实 EOI 后：

```text
payload_offset = eoi_offset + 2
```

其中 `+2` 是跳过 `FF D9` 两个字节。

原始 7 张样例中，`payload_offset` 后有 `1,229,015` 字节红外私有数据。其他相机/固件可能追加不同长度的尾部字段，因此 payload 总长不应作为固定常量。

## 4. IR payload 格式

根据 7 张原始样例图交叉验证，旧 payload 结构如下。

```text
offset from payload  size        type                 meaning
0                    2           uint16 little-endian  version_or_magic = 256
2                    2           uint16 little-endian  image width = 640
4                    2           uint16 little-endian  image height = 480
6                    14          ASCII                timestamp, YYYYMMDDhhmmss
20                   w*h*4       float32 little-endian temperature matrix
20 + w*h*4           remaining   bytes                metadata/unknown tail, observed 195 bytes in original samples
```

### 4.1 头部字段

样例头部前 20 字节可以按以下方式解释：

```text
uint16_le version_or_magic
uint16_le width
uint16_le height
char[14] timestamp
```

例如：

```text
00 01 80 02 E0 01 32 30 31 35 31 30 30 38 31 34 31 36 31 37
```

解释为：

```text
version_or_magic = 0x0100 = 256
width            = 0x0280 = 640
height           = 0x01E0 = 480
timestamp        = "20151008141617"
```

## 5. 温度矩阵解析

温度矩阵从 payload offset `20` 开始。

```text
temp_count = width * height
temp_bytes = temp_count * 4
temps = read temp_count float32 little-endian values
```

矩阵布局为行主序：

```text
index = y * width + x
temperature_at(x, y) = temps[index]
```

坐标约定：

- `x` 从左到右，范围 `0 .. width-1`
- `y` 从上到下，范围 `0 .. height-1`
- 样例范围是 `x=0..639`、`y=0..479`

### 5.1 温度矩阵伪代码

```text
function parse_temperature_matrix(payload):
    version = read_u16_le(payload, 0)
    width   = read_u16_le(payload, 2)
    height  = read_u16_le(payload, 4)
    time    = read_ascii(payload, 6, 14)

    offset = 20
    count = width * height
    temps = new array[count]

    for i in 0 .. count-1:
        temps[i] = read_float32_le(payload, offset)
        offset = offset + 4

    metadata = payload[offset .. end]

    return {
        version,
        width,
        height,
        time,
        temps,
        metadata
    }
```

## 6. 元数据尾部

已知字段级结构见 [`metadata-structure.md`](./metadata-structure.md)。

当前解析模型把温度矩阵之后直到文件末尾的剩余 bytes 作为 metadata/未知尾部保存；长度可能取决于相机追加了多少尾部字段。原始样例为 `195` 字节，HM-TD 样例为 `158` 字节。

其中包含可读 ASCII 字段：

```text
MISSION
C600
1001
This is the first file of standard IR
```

当前可确认：这些字节属于 IR 私有数据结构尾部。字段完整语义仍需继续逆向 `YFIR.dll` 的结构体读写逻辑。

## 6.1 Header Prefix Variants

Some files use the same IR header shape, but place a short format prefix before the version field. Observed prefixes:

- `/Users/robot/Downloads/2020002208535580672_infrared.jpg`: 2 bytes, `e3 41`.
- `/Users/robot/Downloads/2020001989228007424_infrared.jpg`: 3 bytes, `0a de 41`.

The 2-byte sample layout is:

```text
offset from payload  size        type                 meaning
0                    2           uint16 little-endian  format prefix, observed 0x41e3
2                    2           uint16 little-endian  version_or_magic = 256
4                    2           uint16 little-endian  image width = 384
6                    2           uint16 little-endian  image height = 288
8                    14          ASCII                timestamp, YYYYMMDDhhmmss
22                   w*h*4       float32 little-endian temperature matrix
22 + w*h*4           remaining   bytes                metadata/unknown tail, observed 158 bytes in this sample
```

Do not hard-code only the currently observed prefix lengths. A compatible parser should scan a small bounded prefix range after the JPEG EOI and accept the first candidate where:

- `uint16_le(payload[prefix..prefix+2]) == 256`
- width and height are non-zero
- the 14-byte timestamp is numeric
- `width * height * 4` temperature bytes fit in the file
- sampled temperatures are finite and physically plausible

The parser must not require the thermal matrix dimensions to match the JPEG preview dimensions.

## 7. 完整解析伪代码

```text
function parse_ir_jpg(path):
    bytes = read_all_bytes(path)

    eoi = find_true_jpeg_eoi(bytes)
    payload_offset = eoi + 2

    if payload_offset >= length(bytes):
        fail "no IR payload"

    payload = bytes[payload_offset .. end]

    header = find_ir_header(payload)

    version = header.version
    width   = header.width
    height  = header.height
    time    = header.timestamp

    temp_offset = header.temp_offset
    temp_count = width * height
    temp_end = temp_offset + temp_count * 4

    require temp_end <= length(payload)

    temps = []
    for i in 0 .. temp_count-1:
        temps.append(read_float32_le(payload, temp_offset + i * 4))

    metadata = payload[temp_end .. end]

    return IrImage(
        jpeg_bytes = bytes[0 .. eoi+2],
        payload_offset = payload_offset,
        version = version,
        width = width,
        height = height,
        timestamp = time,
        temperatures = temps,
        metadata = metadata
    )
```

```text
function find_ir_header(payload):
    for prefix in 0 .. 32:
        if read_uint16_le(payload, prefix) != 256:
            continue

        width = read_uint16_le(payload, prefix + 2)
        height = read_uint16_le(payload, prefix + 4)
        timestamp = read_ascii(payload, prefix + 6, 14)
        temp_offset = prefix + 20

        if width == 0 or height == 0:
            continue
        if timestamp is not 14 ASCII digits:
            continue
        if temp_offset + width * height * 4 > length(payload):
            continue
        if sampled float32 temperatures are not finite/plausible:
            continue

        return { version: 256, width, height, timestamp, temp_offset }

    fail "unsupported IR payload header"
```

## 8. 全图温度统计

```text
function stats_for_pixels(image, pixels):
    count = 0
    sum = 0
    min_temp = +infinity
    max_temp = -infinity
    min_xy = null
    max_xy = null

    for each (x, y) in pixels:
        t = image.temperatures[y * image.width + x]

        count = count + 1
        sum = sum + t

        if t < min_temp:
            min_temp = t
            min_xy = (x, y)

        if t > max_temp:
            max_temp = t
            max_xy = (x, y)

    avg = sum / count

    return { count, min_temp, min_xy, max_temp, max_xy, avg }
```

全图统计的像素集合：

```text
pixels = all (x, y) where 0 <= x < width and 0 <= y < height
```

## 9. 点分析

点分析就是读取单个像素温度。

```text
function point_pixels(x, y):
    return [(x, y)]
```

## 10. 线分析

原 DLL 中存在 `yf_calc_pts_in_line`，说明原工具会先把线段转成像素点集合，再做统计。

通用做法可使用 Bresenham 线段算法。

```text
function line_pixels(x1, y1, x2, y2):
    pixels = []

    dx = abs(x2 - x1)
    sx = 1 if x1 < x2 else -1
    dy = -abs(y2 - y1)
    sy = 1 if y1 < y2 else -1
    err = dx + dy

    x = x1
    y = y1

    while true:
        pixels.append((x, y))

        if x == x2 and y == y2:
            break

        e2 = 2 * err

        if e2 >= dy:
            err = err + dy
            x = x + sx

        if e2 <= dx:
            err = err + dx
            y = y + sy

    return pixels
```

然后：

```text
line_stats = stats_for_pixels(image, line_pixels(x1, y1, x2, y2))
```

## 11. 框/矩形分析

原 DLL 中存在 `yf_normalize_rect` 和 `yf_draw_ana_rect`，说明矩形会先归一化坐标，再遍历区域。

```text
function rect_pixels(x1, y1, x2, y2):
    left   = min(x1, x2)
    right  = max(x1, x2)
    top    = min(y1, y2)
    bottom = max(y1, y2)

    pixels = []

    for y in top .. bottom:
        for x in left .. right:
            pixels.append((x, y))

    return pixels
```

然后：

```text
rect_stats = stats_for_pixels(image, rect_pixels(x1, y1, x2, y2))
```

本项目实现按包含边界像素处理。例如 `(100,100)` 到 `(200,200)` 的矩形像素数是：

```text
(200 - 100 + 1) * (200 - 100 + 1) = 10201
```

## 12. 椭圆、多边形、多段线

原程序 DLL 中存在对应证据：

- `yf_draw_ana_ellipse`
- `yf_draw_ana_poly`
- `yf_draw_ana_polyline`
- `yf_calc_lines_in_ellipse`
- `yf_pt_in_line`

通用扩展思路：

- 椭圆：生成椭圆内部或边界的像素 mask，然后调用 `stats_for_pixels`。
- 多边形：用点在多边形内判断或扫描线填充生成 mask。
- 多段线：对每一段调用 `line_pixels`，去重后统计。

第一版没有默认实现这些形状，因为用户当前核心需求是点、线、框验证。

## 13. 样例校验值

解析正确时，样例应得到以下结果：

```text
1.jpg: timestamp=20151008141617, min=-0.82, max=49.65, center(320,240)=20.63
2.jpg: timestamp=20151008141623, min=-4.57, max=30.98, center(320,240)=25.21
3.jpg: timestamp=20151008141629, min=-12.66, max=46.83, center(320,240)=21.29
4.jpg: timestamp=20151008141635, min=-43.15, max=57.08, center(320,240)=42.07
5.jpg: timestamp=20151008141641, min=16.57, max=35.81, center(320,240)=34.50
6.jpg: timestamp=20151008141647, min=-5.23, max=25.20, center(320,240)=1.81
7.jpg: timestamp=20151008141653, min=-0.08, max=76.02, center(320,240)=34.62
```

## 14. 错误处理建议

解析器至少应检查：

- 文件是否以 JPEG SOI `FF D8` 开始。
- 是否能找到真实 EOI。
- EOI 后是否存在 payload。
- payload 是否至少有 20 字节头部。
- width/height 是否合理。
- `20 + width * height * 4` 是否不超过 payload 长度。
- float32 是否能正常解码。

对于未知 metadata 字段，应保留原始 bytes，不要丢弃。

## 15. 与原程序的对应关系

二进制证据显示原程序大致分层如下：

```text
文件识别/头尾解析       YFFileIdentify.dll
IR 图像主对象/温度接口  YFIR.dll
温度计算               YFCalcTemp.dll / YFCalibrate.dll
分析对象绘制           YFDrawAna.dll
图形像素集合计算       YFDrawShape.dll
分析字符串解析格式化    YFFormatAnaStr.dll
```

样例 JPG 已直接保存 float32 温度矩阵，因此读取样例温度不需要先复原 AD 值、校准表和环境参数公式。
