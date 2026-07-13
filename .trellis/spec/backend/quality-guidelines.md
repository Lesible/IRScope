# Quality Guidelines

IRScope correctness is defined by the documented binary format and the seven reference sample JPGs.

## Required Patterns

- Keep Java source compatible with JDK 8-21. `pom.xml` sets `maven.compiler.release` to `8`.
- Locate JPEG EOI by marker parsing, not by the first `FF D9` byte pair. See `IrImageParser.findTrueJpegEoi` and `docs/ir-image-format-generic.md`.
- Detect the IR payload header by first validating the absolute `data_start` in the last 20 file bytes, then falling back to a small bounded prefix range after EOI. Both paths must share version, dimensions, timestamp, matrix-length, and sampled-temperature validation.
- Parse payload fields little-endian: `u16` header fields, `float32` temperatures, and metadata numbers.
- Parse the metadata footer at `138 + descriptionLength`: `u32le data_start` followed by the 16-byte GUID/checksum. Expose it only when that dynamic footer ends exactly at `metadata.length`.
- Treat temperature indexing as row-major: `temperatures[y * width + x]`.
- In Tauri, backend `ImageInfo.width/height` remain thermal-matrix dimensions. Read JPEG preview dimensions from the loaded image, map preview coordinates to thermal coordinates before analysis, and map thermal coordinates back before drawing marks.
- Preserve raw metadata bytes on `IrImage` when adding or changing structured metadata parsing.
- Keep unknown or partially confirmed metadata fields named as unknown or low-confidence until the evidence improves.
- Keep original Windows DLLs and EXE out of runtime code; they are reference evidence only.

## Forbidden Patterns

- Do not depend on `reference/original-program/bin/*.dll` or the original EXE at runtime.
- Do not replace true JPEG marker parsing with a naive byte search.
- Do not hard-code sample-only values like `640x480`, metadata length `195`, or `version=256` as universal truth unless the task explicitly narrows scope.
- Do not require thermal matrix dimensions to match the JPEG preview dimensions; valid HM-TD files can have a `640x512` JPEG preview and a `384x288` thermal matrix.
- Do not pass JPEG preview coordinates directly to a thermal `temp_at`/region command when the dimensions differ.
- Do not introduce dependencies for functionality already covered by the JDK or existing Maven plugins.
- Do not discard unknown metadata bytes after parsing known fields.

## Testing Requirements

The smallest required full check for parser changes is:

```bash
rtk mvn clean test package
rtk java -jar target/irscope.jar --cli reference/original-program/samples/1.jpg --stats
```

`src/test/java/com/yfcam/irparser/IrParserSelfTest.java` is an executable self-test, not a JUnit suite. It must continue to validate:

- all seven samples from `reference/original-program/samples/`;
- version, dimensions, metadata length, and key metadata fields;
- full-image min/max values and center point values from `docs/verification.md`;
- point, line, and rectangle region counts.

When adding support for a new image shape or parser variant, add one narrow self-test assertion that fails on the bug being fixed.

For Rust/Tauri parser and coordinate changes, run `rtk cargo fmt --manifest-path src-tauri/Cargo.toml --check`, `rtk cargo test --manifest-path src-tauri/Cargo.toml`, `rtk npm run build`, and verify same-size identity plus `640x512 <-> 384x288` endpoint-aligned mapping.

## Rust/Tauri Preview-To-Thermal Contract

### 1. Scope / Trigger
- Trigger: a JPEG preview and its thermal matrix use different dimensions.

### 2. Signatures
- `parse_ir_image` returns thermal `width` and `height`.
- `analyze_region` accepts thermal-matrix coordinates.
- Frontend mapping is `round(source * (targetSize - 1) / (sourceSize - 1))` per axis.

### 3. Contracts
- `HTMLImageElement.naturalWidth/naturalHeight` define the preview canvas and window size.
- Marks and CSV coordinates remain thermal-matrix coordinates; no Tauri command field changes are required.

### 4. Validation & Error Matrix
- Invalid footer `data_start` -> bounded prefix scan.
- Invalid/zero mapping dimension -> reject in the shared mapping helper.
- Preview coordinate outside its bounds -> clamp before mapping.

### 5. Good / Base / Bad Cases
- Good: `(439,182)` in a `640x512` preview maps to `(263,102)` in `384x288`.
- Base: equal preview and thermal dimensions stay 1:1.
- Bad: treating preview `(439,182)` as a direct thermal point causes an out-of-range query.

### 6. Tests Required
- Rust synthetic footer priority, invalid-footer fallback, and dynamic 158/195 metadata tests.
- Frontend coordinate check for same-size, forward/reverse scaling, and rotation order.

### 7. Wrong vs Correct
- Wrong: canvas, window, and mark drawing use `ImageInfo.width/height` as JPEG dimensions.
- Correct: canvas/window use JPEG natural dimensions; analysis uses scaled thermal coordinates.

## Rust/Tauri Packaging Contract

### 1. Scope / Trigger
- Trigger: desktop packaging or CI changes for the Rust/Tauri replacement.

### 2. Signatures
- Local debug check: `rtk npm run tauri build -- --debug`
- CI release build: `npm run tauri build -- --target <target> --bundles <bundles>`

### 3. Contracts
- Windows x64 target: `x86_64-pc-windows-msvc`; artifacts include `release/irscope.exe` as portable output plus NSIS bundle.
- Linux x64 target: `x86_64-unknown-linux-gnu`; artifacts include AppImage and deb bundles.
- macOS arm64 target: `aarch64-apple-darwin`; artifact includes `.app` bundle.
- Tauri desktop icon resources must be committed under `src-tauri/icons/`, including `icons/icon.ico` for Windows resource generation and `icons/icon.icns` for macOS bundling.

### 4. Validation & Error Matrix
- Missing artifact path -> GitHub Actions `upload-artifact` must fail with `if-no-files-found: error`.
- Missing `src-tauri/icons/icon.ico` -> Windows `tauri-build` fails while generating the Windows Resource file.
- Linux dependency missing -> install WebKit/GTK/AppIndicator/rsvg/patchelf/fuse packages before Tauri build.

### 5. Good/Base/Bad Cases
- Good: CI uploads all requested platform artifacts from native runners.
- Base: local macOS debug bundle still builds after CI changes.
- Bad: claiming cross-platform support from a local-only `target/debug/bundle/macos` build.

### 6. Tests Required
- Parse workflow YAML locally.
- Run `rtk npm run build`, `rtk cargo test --manifest-path src-tauri/Cargo.toml`, and local Tauri debug build after packaging changes.

### 7. Wrong vs Correct
- Wrong: cross-compile every desktop OS from one local machine by default.
- Correct: use GitHub Actions native runners for Windows, Linux, and macOS packaging.

## Review Checklist

- Does the change still follow the language-neutral contract in `docs/ir-image-format-generic.md`?
- Are binary reads bounds-checked before indexing?
- Can width/height/count/byte calculations overflow or allocate unreasonable memory?
- Does header detection validate candidate timestamp, dimensions, matrix length, and sampled temperatures instead of accepting the first matching byte pair?
- Does an untrusted footer reuse that validator and preserve scan fallback?
- Are JPEG preview coordinates scaled to thermal coordinates, with marks scaled back before drawing?
- Are CLI and Swing behavior both still valid if parser behavior changed?
- Are docs updated when expected values, metadata fields, or verification commands change?
