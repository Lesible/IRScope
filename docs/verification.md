# Verification

Commands run on 2026-07-07 for the Rust/Tauri replacement:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
npm run build
npm run tauri build -- --debug
```

Tauri bundle target is app-only; debug output is:

```text
src-tauri/target/debug/bundle/macos/IRScope.app
```

The Rust tests validate:

```text
1.jpg through 7.jpg parse successfully
version=256
size=640x480
metadataBytes=195
metadata productor=MISSION
metadata cameraType=C600
metadata cameraSerial=1001
metadata emissivity=0.9
metadata envTemp=32.0
metadata relHum=50
```

Expected key values for `reference/original-program/samples/1.jpg`:

```text
timestamp=20151008141617
jpegEndOffset=184286
payloadOffset=184288
full: count=307200 min=-0.82@(308,25) max=49.65@(308,359) avg=10.22
point 320,240: count=1 min=20.63@(320,240) max=20.63@(320,240) avg=20.63
line 0,0,639,479: count=640 min=6.61@(129,97) max=22.85@(494,370) avg=10.66
rect 100,100,200,200: count=10201 min=-0.76@(174,116) max=8.29@(100,182) avg=7.46
```

CSV export uses:

```text
x,y,temp
0,0,22.022987
1,0,6.9349813
```

## Metadata structure verification

Expected metadata summary for `1.jpg`:

```text
emiss=0.9, envTemp=32.0, distRaw=2584, relHum=50, mdfOrCorrectionTemp=25.3, productor=MISSION, cameraType=C600, cameraSerial=1001, lon=120.11896012, lat=30.1581147021, unknownInt100=100, desc=This is the first file of standard IR, jpegPayloadOffset=184288, guidOrChecksum=3766071a123a4c9fa95d21d2da7d26bc
```

## Prefixed header HM-TD samples

The parser first validates the footer `data_start`, then falls back to bounded header-prefix scanning documented in `docs/ir-image-format-generic.md`.

Expected key output for the 2-byte-prefix HM-TD sample:

```text
version=256
size=384x288
timestamp=20260707095718
metadataBytes=158
metadata=emiss=0.95, envTemp=26.68, distRaw=3840, relHum=0, mdfOrCorrectionTemp=26.68, productor=, cameraType=HM-TD5737T-4/W, cameraSerial=20260513AACHEA8074000, lon=0.0, lat=0.0, unknownInt100=0, desc=, jpegPayloadOffset=header absolute offset, guidOrChecksum=3766071a123a4c9fa95d21d2da7d26bc
full: count=110592 min=17.50@(84,21) max=58.54@(138,21) avg=27.02
```

Expected key output for `/Users/robot/Downloads/2020001989228007424_infrared.jpg`:

```text
version=256
size=384x288
timestamp=20260710032122
metadataBytes=158
metadata dataStart=21872
metadata guidOrChecksum=3766071a123a4c9fa95d21d2da7d26bc
```

## JPEG/temperature coordinate scaling

`/Users/robot/Downloads/123.jpg` has a `640x512` JPEG preview and a `384x288` temperature matrix. Its full-temperature maximum is `67.28@(263,102)`, which maps back to JPEG coordinate `(439,182)` with endpoint-aligned proportional scaling. The UI displays both dimensions, uses the JPEG size for the canvas/window, and keeps analysis requests in thermal-matrix coordinates.
