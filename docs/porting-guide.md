# Porting Guide for Other Languages

## Minimal Implementation Order

1. Read all bytes from a JPG file.
2. Locate the true JPEG EOI marker using marker parsing, not naive byte search.
3. Set `payload_offset = eoi_offset + 2`.
4. Parse IR payload header:
   - `u16le version`
   - `u16le width`
   - `u16le height`
   - `ascii[14] timestamp`
5. Read `width * height` little-endian `float32` temperatures.
6. Read remaining bytes as metadata.
7. Parse known metadata fields from the remaining tail bytes using `docs/metadata-structure.md`; preserve the full raw tail because its length appears camera-dependent.
8. Implement region stats over selected pixel coordinates.

## Types

Suggested common model:

```text
IrImage {
  version: u16/u32
  width: u16/u32
  height: u16/u32
  timestamp: string
  temperatures: Vec<f32> / []float32
  metadata: Metadata
  raw_metadata: bytes
  jpeg_end_offset: usize
  payload_offset: usize
}
```

Metadata model:

```text
Metadata {
  emissivity: f32
  environment_temperature: f32
  distance_raw: u32
  relative_humidity_percent: u8
  mdf_or_correction_temperature: f32
  productor: string
  camera_type: string
  camera_serial: string
  longitude: f64
  latitude: f64
  unknown_int_100: u32
  description: string
  jpeg_payload_offset: u32
  file_guid_or_checksum: [u8; 16]
}
```

## Rust Notes

The current desktop implementation lives under `src-tauri/` and uses `std::fs::read`, little-endian standard-library conversions, and `Vec<u8>` for unknown metadata bytes. Use it as the Rust reference when porting the format further.

## Go Notes

- Use `os.ReadFile`.
- Use `encoding/binary.LittleEndian`.
- Convert float bits with `math.Float32frombits` / `math.Float64frombits`.
- Keep parser package separate from whichever UI or automation layer you add.

## Required Test Values

Use these fixed assertions for a first port:

```text
1.jpg: version=256, width=640, height=480, timestamp=20151008141617
1.jpg: min=-0.82, max=49.65, center(320,240)=20.63
metadata: emissivity=0.9, envTemp=32.0, relHum=50, productor=MISSION, cameraType=C600, cameraSerial=1001
```

Then validate all seven sample images using `docs/ir-image-format-generic.md` expected values.
