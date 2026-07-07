# IR Payload 可变长尾部元数据结构

## 结论

在当前已验证文件中，温度矩阵之后直到文件末尾的剩余 bytes 都表现为设备 metadata/未知尾部。metadata 总长度不应视为格式固定常量；它可能取决于相机或固件追加了多少尾部字段。

已观察到两种长度：

- 原始 7 张样例图尾部均为 `195` 字节，前 195 字节内的字段可按下表解析。
- HM-TD 图片样例尾部为 `158` 字节，复用开头的发射率、环境温度、距离原始值、相对湿度/MDF、型号和序列号字段，但没有旧样例中的经纬度、说明、payload 偏移和 16 字节 GUID/校验字段完整区域。

解析器必须保留原始 tail bytes，并对缺失字段返回空值或 `0`。不能因为 tail 不是 `195` 字节就把已知温度矩阵判为不可用。

## 结构表

| offset | size | type | 样例值 | 字段名/含义 | 可信度 |
|---:|---:|---|---|---|---|
| 0 | 4 | float32_le | `0.9` | `emissivity` / 发射率，对应 `emiss`、`yf_ir_get_emiss` | 高 |
| 4 | 4 | float32_le | `32.0` | `environmentTemperature` / 环境温度，对应 `envtemp`、`yf_ir_get_env_temp` | 高 |
| 8 | 4 | uint32_le | `2584` | `distanceRaw` / 距离原始值，对应 `dist`、`yf_ir_get_dist`；单位仍待确认 | 中高 |
| 12 | 1 | uint8 | `0` | `reservedByte12` / 保留字节 | 中 |
| 13 | 1 | uint8 | `50` | `relativeHumidityPercent` / 相对湿度百分比，对应 `relhum`、`yf_ir_get_rel_hum` | 高 |
| 14 | 4 | float32_le | `25.3` | `mdfOrCorrectionTemperature` / MDF 或修正温度，对应 `yf_ir_get_mdf` / `yf_ir_get_correct_temp`，二者需继续区分 | 中 |
| 18 | 32 | c-string | `MISSION` | `productor` / 厂商或生产者，对应 `yf_ir_get_productor` | 高 |
| 50 | 32 | c-string | `C600` | `cameraType` / 设备型号，对应 `yf_ir_get_mac_type` | 高 |
| 82 | 32 | c-string | `1001` | `cameraSerial` / 设备序列号，对应 `yf_ir_get_mac_serial` | 高 |
| 114 | 8 | float64_le | `120.11896012` | `longitude` / 经度，字段名由数值形态推断 | 中 |
| 122 | 8 | float64_le | `30.1581147021` | `latitude` / 纬度，字段名由数值形态推断 | 中 |
| 130 | 4 | uint32_le | `100` | `unknownInt100` / 未命名整数，可能是高度、等级或扩展参数 | 低 |
| 134 | 4 | uint32_le | `37` | `descriptionLength` / 说明字符串长度 | 高 |
| 138 | 37 | ASCII | `This is the first file of standard IR` | `description` / 文件说明 | 高 |
| 175 | 4 | uint32_le | varies | `jpegPayloadOffset` / IR payload 在原文件中的偏移，等于真实 EOI 后 2 字节 | 高 |
| 179 | 16 | bytes | `3766071a123a4c9fa95d21d2da7d26bc` | `fileGuidOrChecksum` / GUID 或校验种子，7 张样例一致 | 中 |

## 偏移验证

以 `例图/1.jpg` 为例：

```text
000: 66 66 66 3f   -> float32 0.9
004: 00 00 00 42   -> float32 32.0
008: 18 0a 00 00   -> uint32 2584
012: 00 32         -> reserved=0, relHum=50
014: 66 66 ca 41   -> float32 25.3
018: 4d 49 53 53 49 4f 4e 00 ... -> "MISSION"
050: 43 36 30 30 00 ...          -> "C600"
082: 31 30 30 31 00 ...          -> "1001"
114: 68 3b e8 0a 9d 07 5e 40    -> double 120.11896012
122: 4a 89 82 34 7a 28 3e 40    -> double 30.1581147021
130: 64 00 00 00                 -> uint32 100
134: 25 00 00 00                 -> uint32 37
138: 54 68 ... 49 52             -> "This is the first file of standard IR"
175: e0 cf 02 00                 -> uint32 184288, equals payloadOffset
179: 37 66 07 1a 12 3a 4c 9f a9 5d 21 d2 da 7d 26 bc
```

## 与 DLL 的对应关系

相关导出/字符串：

- `YFIR.dll`: `yf_ir_get_emiss`, `yf_ir_get_env_temp`, `yf_ir_get_dist`, `yf_ir_get_rel_hum`, `yf_ir_get_mdf`, `yf_ir_get_productor`, `yf_ir_get_mac_type`, `yf_ir_get_mac_serial`, `yf_ir_get_other_para`, `yf_ir_get_para_info`。
- `YFParaInfo.dll`: `yf_para_info_get_emiss`, `yf_para_info_get_env_temp`, `yf_para_info_get_dist`, `yf_para_info_get_rel_hum`, `yf_para_info_get_mdf`, `yf_para_info_format_data`, `yf_para_info_parse_data`。
- 字符串：`emiss`, `envtemp`, `dist`, `relhum`, `MISSION`, `C600`, `1001`, `This is the first file of standard IR`。

## 通用解析伪代码

```text
function parse_metadata(meta):
    require length(meta) >= 18

    emissivity = read_float32_le(meta, 0)
    environment_temperature = read_float32_le(meta, 4)
    distance_raw = read_uint32_le(meta, 8)
    reserved_byte_12 = read_uint8(meta, 12)
    relative_humidity_percent = read_uint8(meta, 13)
    mdf_or_correction_temperature = read_float32_le(meta, 14)

    productor = read_c_string(meta, 18, 32)
    camera_type = read_c_string(meta, 50, 32)
    camera_serial = read_c_string(meta, 82, 32)

    longitude = read_float64_le(meta, 114) if length(meta) >= 122 else 0
    latitude = read_float64_le(meta, 122) if length(meta) >= 130 else 0

    unknown_int_100 = read_uint32_le(meta, 130) if length(meta) >= 134 else 0
    description_length = read_uint32_le(meta, 134) if length(meta) >= 138 else 0
    description = read_ascii(meta, 138, description_length) if length(meta) > 138 else ""

    jpeg_payload_offset = read_uint32_le(meta, 175) if length(meta) >= 179 else 0
    file_guid_or_checksum = meta[179:195] if length(meta) >= 195 else empty bytes

    return Metadata(...)
```

## Rust/Tauri 状态

Rust/Tauri 桌面版已实现 metadata 解析，右侧“设备元数据”面板展示关键字段。长尾部会尽量解析已知字段；短尾部会部分解析并保留原始 bytes。

示例：

```text
metadata=emiss=0.9, envTemp=32.0, distRaw=2584, relHum=50, mdfOrCorrectionTemp=25.3, productor=MISSION, cameraType=C600, cameraSerial=1001, lon=120.11896012, lat=30.1581147021, unknownInt100=100, desc=This is the first file of standard IR, jpegPayloadOffset=184288, guidOrChecksum=3766071a123a4c9fa95d21d2da7d26bc
```
