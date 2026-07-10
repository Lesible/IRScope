# Implementation Plan

- [x] Load pre-development context with `trellis-before-dev`.
- [x] Replace the hard-coded `0`/`2` payload header branches with one bounded candidate scan.
- [x] Reuse existing little-endian readers, timestamp check, overflow checks, and temperature sanity logic.
- [x] Add one narrow 3-byte-prefix regression test.
- [x] Update `docs/ir-image-format-generic.md` and `docs/verification.md`.
- [x] Run `rtk cargo test --manifest-path src-tauri/Cargo.toml`.
- [x] Run a direct parse check for `/Users/robot/Downloads/2020001989228007424_infrared.jpg` using a temporary local unit test, then remove that non-portable test.
