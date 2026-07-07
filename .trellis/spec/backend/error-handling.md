# Error Handling

IRScope uses standard Java exceptions. There are no custom exception classes and no API error envelope.

## Parser Failures

Parser validation should fail early with `IllegalArgumentException` when the file structure is invalid or unsupported.

Reference patterns:

- `IrImageParser.parse` rejects files without a true JPEG EOI or without enough payload bytes.
- `IrImage.checkPoint` rejects coordinates outside the parsed image dimensions.
- `IrMetadata.parse` rejects tails too short for the shared numeric fields, but tail length appears camera-dependent. Preserve the full raw tail and parse only offsets that exist.

Keep messages concrete enough to diagnose the file shape, for example include the path or dimensions when available.

## CLI Failures

`IrParserCli.main` lets exceptions propagate. That keeps command-line failures visible to Maven, shell scripts, and manual verification.

Argument validation uses `IllegalArgumentException`:

- `--cli` requires a path.
- `--csv`, `--point`, `--line`, and `--rect` require values.
- coordinate lists must have the expected comma-separated arity.

## Swing Failures

`IrParserSwing` catches user-facing load and save failures and shows `JOptionPane` dialogs. Do not let GUI event-handler exceptions silently disappear when they represent open/save failure.

The current preview path catches exceptions while dragging analysis marks because preview is transient; final mark creation still validates through `RegionStats`.

## Binary Parsing Rules

- Use explicit length checks before reading binary fields.
- Use `Math.multiplyExact` for width, height, and byte-size multiplication where overflow is possible.
- Preserve raw metadata bytes even when structured parsing is partial or expands in the future.

Avoid broad fallback parsing that returns nonsense dimensions or temperatures. Bad format detection is better than a plausible-looking but wrong temperature matrix.
