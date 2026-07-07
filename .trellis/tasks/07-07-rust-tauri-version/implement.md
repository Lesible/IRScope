# Implementation Plan

## Checklist

- [x] Confirm MVP scope with the user: basic functions first; richer analysis is later iteration work.
- [x] Confirm replacement scope with the user: final branch must not keep Java and Rust app implementations side by side.
- [x] Confirm desktop-only scope with the user: no Rust CLI replacement in MVP.
- [x] Activate the task with `rtk python3 ./.trellis/scripts/task.py start .trellis/tasks/07-07-rust-tauri-version`.
- [x] Load `trellis-before-dev` before editing code.
- [x] Scaffold the smallest Tauri v2 app that supports React + TypeScript.
- [x] Add parser module `src-tauri/src/ir.rs` from the language-neutral docs.
- [x] Add Rust tests for all seven sample images and fixed `1.jpg` values.
- [x] Add Tauri commands for parse, analyze, and CSV export.
- [x] Build the UI surface: toolbar, canvas, metadata panel, marks panel, status/errors.
- [x] Implement point/line/rectangle overlay interaction and rotation projection.
- [x] Draw point temperature labels next to point marks.
- [x] Draw Max/Min/Avg labels and max-temperature hotspot markers for line/rectangle analysis overlays.
- [x] Resize the Tauri window after opening an image so the application follows the image size within the current monitor work area.
- [x] Apply `design.md` styles and only the selected motion patterns.
- [x] Add GitHub Actions packaging for Windows x64, Linux AppImage/deb, and macOS arm64 artifacts.
- [x] Delete Java app implementation files after Rust/Tauri MVP behavior is covered: `src/main/java`, `src/test/java`, `pom.xml`, and Java demo scripts.
- [x] Update README/docs with Rust/Tauri run and verification commands only.

## Validation Commands

```bash
rtk cargo test --manifest-path src-tauri/Cargo.toml
rtk npm run build
rtk npm run tauri build -- --debug
```

Use the commands that exist after scaffolding. If the package manager differs, update this file before implementation starts.

## Review Gates

- Parser tests pass before UI wiring.
- UI parse/open flow works on `reference/original-program/samples/1.jpg`.
- CSV output is manually checked for `x,y,temp` header.
- Repository no longer advertises Java/Maven as a supported app path.
- Repository no longer advertises CLI as an MVP surface.

## Rollback Points

- Before Java deletion: Rust parser tests must pass so verified behavior is not lost.
- After scaffolding: remove frontend and `src-tauri` files if the project shape is wrong.
- After parser port: parser module is isolated and can be replaced without touching UI.
- After UI wiring: Tauri commands are the contract; frontend can be restyled without parser changes.
- After Java deletion: rollback is a git revert or branch reset to `java-version`, not a mixed implementation.
