# Project History

## Origin

This project was created from a reverse-engineering task for `国网红外数据文件校验软件.exe` and its `YF*.dll` dependencies. The goal shifted from generic decompilation to a practical parser for the sample infrared JPG files and their temperature data.

## Key Findings

- The program is native Windows PE32, built with VC100 / MSVC 2010 style dependencies.
- Sample JPG files are valid JPEG images with a private IR payload appended after the true JPEG EOI marker.
- The IR payload stores a direct `float32_le` temperature matrix, so sample temperature extraction does not need AD-to-temperature calibration.
- Region analysis in the original software is backed by DLL exports such as `yf_ana_get_max_temp`, `yf_ana_get_min_temp`, `yf_ana_get_avg_temp`, and drawing helpers for point/line/rect/ellipse/poly/polyline.
- The observed tail bytes after the temperature matrix have been mapped into structured metadata fields including emissivity, environment temperature, humidity, model, serial, coordinates, description, and unknown/check fields. Tail length appears camera-dependent; original samples use 195 bytes and the HM-TD sample uses 158 bytes.

## Implementation Timeline

1. Created Trellis task `07-07-decompile-current-project`.
2. Mapped PE files, DLL exports, PDB paths, strings, and sample JPG structure.
3. Proved that all sample JPGs contain a fixed-length IR payload after true JPEG EOI.
4. Implemented Java parser, CLI, CSV export, and point/line/rect statistics.
5. Added Swing GUI with a layout inspired by original resource strings: open image, add point/line/rect analysis, analysis string, image info.
6. Reversed the observed metadata tail fields and added structured metadata parsing while preserving raw bytes.
7. Renamed the project to IRScope.
8. Refactored Java code to support JDK 8-21.
9. Reorganized this standalone project with docs, original binaries, samples, logs, reverse-engineering references, and history.
10. Replaced the Java/Swing application with a Rust/Tauri desktop app on the `rust-version` branch. The MVP is desktop-only and keeps parser verification in Rust tests.

## Historical Source Material

Raw Trellis planning and progress files are preserved under `docs/history/`:

- `trellis-prd.md`
- `trellis-design.md`
- `trellis-implement.md`
- `trellis-journal.md`
