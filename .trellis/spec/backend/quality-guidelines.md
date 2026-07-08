# Quality Guidelines

IRScope correctness is defined by the documented binary format and the seven reference sample JPGs.

## Required Patterns

- Keep Java source compatible with JDK 8-21. `pom.xml` sets `maven.compiler.release` to `8`.
- Locate JPEG EOI by marker parsing, not by the first `FF D9` byte pair. See `IrImageParser.findTrueJpegEoi` and `docs/ir-image-format-generic.md`.
- Parse payload fields little-endian: `u16` header fields, `float32` temperatures, and metadata numbers.
- Treat temperature indexing as row-major: `temperatures[y * width + x]`.
- Preserve raw metadata bytes on `IrImage` when adding or changing structured metadata parsing.
- Keep unknown or partially confirmed metadata fields named as unknown or low-confidence until the evidence improves.
- Keep original Windows DLLs and EXE out of runtime code; they are reference evidence only.

## Forbidden Patterns

- Do not depend on `reference/original-program/bin/*.dll` or the original EXE at runtime.
- Do not replace true JPEG marker parsing with a naive byte search.
- Do not hard-code sample-only values like `640x480`, metadata length `195`, or `version=256` as universal truth unless the task explicitly narrows scope.
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
- Are CLI and Swing behavior both still valid if parser behavior changed?
- Are docs updated when expected values, metadata fields, or verification commands change?
