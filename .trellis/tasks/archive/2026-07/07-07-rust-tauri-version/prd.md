# Rust Tauri version

## Goal

Replace the current Java/Swing IRScope app with a Rust/Tauri desktop app while preserving the verified parser behavior.

The first useful version should open the same infrared JPG files, show the visible JPEG image, expose parsed metadata, support point/line/rectangle temperature analysis, rotate the view, and export the temperature matrix to CSV. The final branch state must not keep both Java and Rust app implementations.

## Confirmed Facts

- Current implementation is a Java 8-21 Maven project with parser, CLI, Swing UI, and executable self-test.
- IR JPG files are standard JPEG bytes followed by a private IR payload after the true JPEG EOI marker.
- Parser correctness is documented in `docs/ir-image-format-generic.md`, `docs/metadata-structure.md`, `docs/porting-guide.md`, and `docs/verification.md`.
- The Rust replacement must not depend on the original Windows EXE or DLLs under `reference/original-program/bin/`.
- The Java Swing UI currently supports open image, point/line/rectangle analysis, analysis text, image info, rotation, clear image, delete marks, and CSV export.
- Tauri v2 current docs recommend `npm create tauri-app@latest` or `cargo create-tauri-app`; development runs with `tauri dev`, builds with `tauri build`, and Rust commands are exposed via `#[tauri::command]` plus frontend `invoke`.
- Tauri v2 file dialogs are provided by `@tauri-apps/plugin-dialog`.
- User confirmed on 2026-07-07 that the MVP should first get the basic Swing-equivalent functions running; richer visual analysis can be iterated later.
- User clarified on 2026-07-07 that this is a replacement, not an additive port: Java source, Maven build, and Java run scripts should be removed from the final branch.
- User confirmed on 2026-07-07 that the replacement is desktop-only. Do not preserve the old Java CLI with a Rust CLI in the MVP.
- User requested on 2026-07-07 that non-point analysis visibly highlights the hottest point and draws Max/Min/Avg temperature labels on the analyzed shape. Polygon interaction remains later work, but should reuse this region-labeling rule when added.
- User requested on 2026-07-07 that point analysis also displays the current point temperature next to the point marker.
- User requested on 2026-07-07 that after loading an image, the desktop application window should resize with the opened image size instead of letting the main container scroll.
- User requested on 2026-07-07 that the default app window should be large enough for image, full-image stats, and device metadata without internal scrolling; smaller images should stay centered inside that baseline size, and only larger images should expand the window.
- User requested on 2026-07-07 that cross-platform packaging support include Windows x64, Linux AppImage/deb, and macOS arm64. Windows x64 should include a portable executable artifact.

## Requirements

- R1: Create the Rust/Tauri version on git branch `rust-version`, targeting base branch `java-version`.
- R2: Replace the Java app instead of keeping parallel implementations. Remove Java source/test trees, Maven configuration, Java build artifacts, and Java demo scripts after Rust/Tauri covers MVP behavior.
- R3: Implement a Rust parser from the language-neutral docs, not by calling Java or the original Windows binaries.
- R4: Preserve parser invariants: true JPEG marker parsing for EOI, little-endian payload fields, row-major temperature indexing, raw metadata retention, and shifted-header support.
- R5: Support the same first-pass analysis modes as Swing: point, line using Bresenham pixels, and inclusive rectangle with image-bound clipping.
- R6: Provide a Tauri UI for opening an IR JPG, inspecting metadata/full stats, drawing and listing marks, rotating the view, clearing marks/image, and exporting CSV.
- R6a: Draw on-image analysis labels: point marks show the current point temperature, and line/rectangle marks show Max/Min/Avg plus the max-temperature coordinate so users can see key temperatures without reading the side panel.
- R6b: Keep a usable baseline desktop window size, and when an image is opened, expand only beyond that baseline if the image plus toolbar/status/inspector chrome needs more room. Cap the size by the current monitor work area. If the image is larger than the available monitor area, scale the canvas down within the fixed work surface instead of introducing app-level scrollbars.
- R7: Apply a modern design system: dark zinc base, one restrained accent, Geist typography, icon-first controls where practical, tabular numbers, balanced headings, tactile button press, and no neon/purple AI styling.
- R8: Use real Tauri v2 Rust command boundaries for file parse/export operations and typed JSON DTOs for frontend state.
- R9: Add one small runnable Rust test/self-check path that validates the seven reference samples and the key `1.jpg` values from `docs/verification.md`.
- R10: Keep runtime dependencies minimal and justified by the desktop app need.
- R11: Update README and docs so user-facing build/run instructions describe Rust/Tauri only.
- R12: Preserve language-neutral docs, reference samples, reverse-engineering evidence, and project history unless they are Java-only instructions that must be rewritten.
- R13: Do not ship a command-line app in MVP. Parser validation is through Rust tests; user workflow is desktop-only.
- R14: Provide a CI packaging path for Windows x64 portable executable and installer, Linux x64 AppImage/deb, and macOS arm64 app artifacts.

## Acceptance Criteria

- [ ] `rust-version` branch exists and the Trellis task records it.
- [ ] A Tauri v2 app can run in development mode with the documented command.
- [ ] Opening `reference/original-program/samples/1.jpg` shows image dimensions `640x480`, timestamp `20151008141617`, metadata bytes `195`, and parsed metadata including `MISSION`, `C600`, and serial `1001`.
- [ ] Full stats for `1.jpg` match the documented tolerances: min about `-0.82`, max about `49.65`, center `(320,240)` about `20.63`.
- [ ] Point `(320,240)`, line `(0,0)-(639,479)`, and rectangle `(100,100)-(200,200)` produce the same counts and stats pattern as the Java implementation.
- [ ] Line and rectangle marks visibly show Max/Min/Avg labels on the image and highlight the max-temperature position.
- [ ] Point marks visibly show the point temperature next to the marker.
- [ ] Opening an image resizes the app window to follow the image size where the current monitor allows, without adding whole-app scrollbars.
- [ ] CSV export writes `x,y,temp` header and row-major temperature rows.
- [ ] Rotation changes only the view projection; analysis coordinates still refer to the original temperature matrix.
- [ ] Invalid or unsupported files fail with a concrete user-facing error instead of plausible-looking wrong temperatures.
- [ ] Rust tests validate all seven bundled samples.
- [ ] The final branch has no Java app implementation left: no `src/main/java`, no `src/test/java`, no `pom.xml`, and no Java demo scripts as the supported run path.
- [ ] README quick start and verification instructions use Rust/Tauri commands, not Java/Maven commands.
- [ ] The final branch does not advertise or implement a replacement CLI in MVP.
- [ ] GitHub Actions can build downloadable artifacts for Windows x64 portable executable/installer, Linux AppImage/deb, and macOS arm64.

## Out Of Scope For MVP

- Rust CLI replacement for the old Java `--cli` mode.
- Heatmap color calibration, palettes, histograms, ellipse/polygon/polyline analysis, persisted project files, batch processing, and auto-updates.
- Runtime integration with the original Windows EXE or DLLs.
- Mobile Tauri targets.

## Later Iterations

- Heatmap visualization and palette controls.
- Histogram/min-max distribution view.
- Ellipse, polygon, and polyline analysis.
- Persisted analysis/project files.
- Batch processing and report export.
- Auto-update or release packaging polish.
- Rust CLI if command-line use becomes necessary again.

## Open Questions

- None blocking planning.
