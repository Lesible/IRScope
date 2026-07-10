# Support recognizable infrared JPG sample

## Goal

Make IRScope parse recognizable infrared JPG files whose IR payload header is not at a hard-coded offset, starting with `/Users/robot/Downloads/2020001989228007424_infrared.jpg`.

## Background

- The supplied JPG is a valid JPEG preview: `640x512`.
- Its private IR payload starts after the true JPEG EOI at offset `21869`.
- The supported thermal matrix header is present, but shifted by 3 bytes from the payload start:
  - prefix bytes: `0a de 41`
  - version: `256`
  - thermal size: `384x288`
  - timestamp: `20260710032122`
  - metadata tail: `158` bytes
- Current Rust parser supports only header shift `0` and the earlier observed shift `2`, so it rejects this image before reading the valid `384x288` matrix.
- Reverse-engineering notes show `YFFileIdentify.dll` exposes `yf_parse_file_header`, `yf_parse_file_end`, `yf_get_img_width`, `yf_get_img_height`, and `yf_get_img_size`, so compatibility should come from file/header recognition instead of fixed dimensions.

## Requirements

- Keep true JPEG marker parsing for the JPEG EOI.
- Detect the IR payload header by scanning a small bounded prefix range after EOI for a plausible header, not by hard-coding only known offsets.
- Accept valid thermal dimensions other than `640x480`; the thermal matrix size may differ from the JPEG preview size.
- Preserve the existing temperature sanity checks and metadata preservation.
- Keep all seven bundled reference samples and the existing shifted-header sample behavior working.
- Do not call the original Windows EXE/DLLs at runtime.

## Acceptance Criteria

- [x] `/Users/robot/Downloads/2020001989228007424_infrared.jpg` parses as version `256`, size `384x288`, timestamp `20260710032122`, metadata length `158`.
- [x] Existing parser tests for `reference/original-program/samples/1.jpg` through `7.jpg` still pass.
- [x] The shifted-header regression test still passes.
- [x] A focused regression check covers a 3-byte prefixed header.
- [x] Format docs mention bounded header-prefix scanning so future ports do not reintroduce fixed-offset support only.

## Out Of Scope

- Full reimplementation of `YFFileIdentify.dll`.
- Runtime dependency on the original Windows program.
- Decoding unknown prefix byte semantics beyond preserving compatibility evidence.
