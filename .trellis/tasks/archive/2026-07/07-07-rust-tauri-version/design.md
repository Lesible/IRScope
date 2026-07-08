# Technical And UI Design

## Architecture

Use a small Tauri v2 desktop app with a Rust parser backend and a modern web frontend. This replaces the Java/Swing app; the branch should not carry both implementations.

```text
src-tauri/
  src/
    ir.rs          Rust parser, metadata parser, stats
    commands.rs    Tauri command DTOs and file operations
    lib.rs         Tauri builder and command registration
src/
  main.tsx         Frontend entry
  App.tsx          Tool layout and state
  styles.css       Design system CSS
```

The existing Java code is only a temporary reference during implementation. Before the task is complete, remove the Java source/test trees, Maven build file, Java run scripts, Java CLI entrypoint, and Java-only README instructions. Do not add a Rust CLI for MVP; parser validation lives in tests and user workflow lives in the desktop app.

## Tauri v2 Boundaries

- Frontend opens file/save dialogs through Tauri v2 dialog plugin APIs.
- Frontend calls Rust with `invoke("parse_ir_image", { path })`, `invoke("analyze_region", ...)`, and `invoke("export_csv", ...)`.
- Rust command functions use `#[tauri::command]` and are registered with `tauri::generate_handler!`.
- File reading and CSV writing happen in Rust so parsing validation and filesystem errors stay in one place.

## Parser Contract

Rust parser mirrors verified Java behavior:

- Validate SOI and locate true JPEG EOI by marker parsing.
- Try old payload header first, then shifted header if version/timestamp validation fails.
- Read `u16`, `u32`, `f32`, and `f64` as little-endian using Rust stdlib conversions.
- Reject non-finite temperatures and temperatures outside the same sanity range used by Java.
- Store raw metadata tail as `Vec<u8>` and parse only fields whose offsets exist.
- Keep unknown fields named as unknown or low-confidence.

## UI Contract

The UI is a desktop work surface, not a marketing page:

- Left: image canvas with overlay marks and pointer/drag interaction.
- Top: compact glass toolbar with open, save CSV, point, line, rect, rotate, clear, delete controls.
- Right: metadata, full stats, and mark list.
- Bottom/status: current action, preview stats, and concrete errors.
- Numbers use tabular figures to avoid layout shift.
- Interaction hit areas are at least 40px.
- The Tauri main window starts from a 1280 x 900 baseline so the image area, full-image stats, and device metadata can be read without scrolling in normal sample files. On image open, the window expands only when the parsed image dimensions plus fixed UI chrome exceed that baseline. The size is capped to the current monitor work area; the canvas keeps the image's natural pixel size when possible and scales down only when the monitor cap makes that necessary.
- Point marks draw the point and a compact temperature label next to it. Non-point region marks draw the shape, a hot-point marker at max temperature, a smaller min marker, and a compact Max/Min/Avg label anchored near the analyzed shape. Future polygon marks must use the same overlay contract.

## Design Plan

```text
seed = len("新建一个 rust-version 分支 使用 tarui 去实现.界面风格偏现代风. 可以用 taste-skill 先设计一下") % 97 = 63
choices = hero:"Artistic Asymmetry", font:"Geist", components:["Inline Typography Images","Horizontal Accordions","Infinite Marquee"], gsap:["Image Scale & Fade Scroll","Scrubbing Text Reveals"]
```

AIDA check: Navigation is the compact tool rail, Attention is the first-run workspace, Interest is the stats/metadata bento, Desire is the animated sample/gallery/help surface if needed, Action is file open/export/verify.

Hero math verification: if a first-run hero is used, the headline uses `max-w-6xl` and `font-size: clamp(3rem, 5vw, 5.5rem)` so it stays within 2-3 lines. No stamp icons or spam tags.

Bento density verification: desktop info grid uses 4 columns x 2 rows = 8 cells. Main image spans 2x2 = 4 cells, metadata spans 1x2 = 2 cells, stats spans 1x1 = 1 cell, mark list spans 1x1 = 1 cell. Total 8/8 cells with dense flow; no empty corners.

Label and button check: no cheap meta labels such as QUESTION or SECTION. Buttons use high contrast: muted teal fill with zinc-950 text for primary, zinc surface with zinc-100 text for secondary.

## Visual Theme

A modern technical inspection bench: dark zinc surfaces, quiet contrast, dense numeric readouts, and restrained motion. Density is daily-app balanced, variance is offset asymmetric, and motion is fluid but work-focused.

Colors:

- **Zinc Field** (#18181B) - primary app background.
- **Charcoal Panel** (#27272A) - side panels, toolbar, and elevated surfaces.
- **Soft Surface** (#3F3F46) - secondary controls and inactive chips.
- **Paper White** (#F4F4F5) - primary text.
- **Muted Steel** (#A1A1AA) - secondary text, metadata labels, timestamps.
- **Whisper Line** (rgba(244,244,245,0.12)) - image outlines and separators.
- **Thermal Teal** (#5EEAD4) - the single accent for primary action, active tool, and focus rings.

Typography:

- Display/body: Geist.
- Mono: Geist Mono for coordinates, temperatures, offsets, and sample values.
- Banned: Inter, generic serif fonts, pure black, neon glow, and oversized gradient headlines.

Components:

- Buttons: 44px minimum hit area, 8px radius, exact-property transitions, active scale `0.96`.
- Tool buttons: icon-first with tooltip labels; active tool uses Thermal Teal fill and zinc text.
- Panels: 12px outer radius with 8px inner elements for concentric radius.
- Canvas: dark image well with a 1px low-opacity outline around the loaded JPEG.
- Region overlays: saved shapes use amber, active previews use teal, point temperature labels sit beside the marker, max-temperature hotspots use red-orange, min markers use cool cyan, and labels use dark translucent capsules with tabular numbers.
- Stats rows: monospace numbers, tabular figures, tight dividers, no card-within-card nesting.

## Compatibility

- Branch: `rust-version`
- Base branch: `java-version`
- Language-neutral docs, samples, and reverse-engineering reference files remain in place.
- Java implementation files are removed once Rust/Tauri reaches MVP parity.
- Rust sample validation must use `reference/original-program/samples/1.jpg` through `7.jpg`.
- MVP has no supported CLI surface.
- Cross-platform packaging is handled by GitHub Actions on native runners: Windows x64 portable exe plus NSIS, Linux x64 AppImage/deb, and macOS arm64 `.app`.

## Risks

- Tauri file access/scopes can be awkward if all reads happen in frontend JS. Avoid that by passing selected paths to Rust commands.
- Canvas coordinate transforms can drift from parser coordinates. Keep a single projection function and test rotation round trips.
- Visual polish can expand scope. MVP keeps only controls needed for Swing parity.
- Deleting Java before Rust tests pass can lose the executable oracle. Port tests first, delete Java last.

## Rollback

Rollback means reverting the replacement branch to the previous Java implementation from `java-version`. Do not keep a hybrid Java-plus-Rust app as the intended end state.
