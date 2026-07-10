# Design

## Parser Boundary

The fix belongs in `src-tauri/src/ir.rs` inside `parse_bytes`, because all app paths route through `parse_path -> parse_bytes`:

- `parse_ir_image`
- `analyze_region`
- `export_csv`

## Header Detection

After locating true JPEG EOI, scan a small bounded range from `payload_offset` for the existing header shape:

```text
u16le version == 256
u16le width > 0
u16le height > 0
ascii[14] timestamp all digits
width * height * 4 bytes fit in file
sampled temperatures are finite and within the existing sanity range
```

Use the first candidate that passes validation. This keeps the old zero-prefix layout and the existing 2-byte shifted layout, while accepting the new 3-byte prefix without adding another special branch.

## Compatibility

The JPEG preview dimensions are display dimensions; the IR payload width and height are thermal matrix dimensions. They can differ.

The original Windows program has a separate file-identification layer (`YFFileIdentify.dll`) for header/end parsing and width/height access. This implementation should mimic that behavior at the format level, not by linking to the DLL.

## Rollback

The change is isolated to parser header detection and tests/docs. Reverting `src-tauri/src/ir.rs` restores the previous two-layout behavior.
