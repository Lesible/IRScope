# Database Guidelines

IRScope has no database, ORM, migrations, query layer, or persistent application state.

## Current Storage Model

- Input files are read directly from disk with `Files.readAllBytes` in `src/main/java/com/yfcam/irparser/IrImageParser.java`.
- CSV export writes a flat file from CLI or Swing paths in `IrParserCli` and `IrParserSwing`.
- Reference files under `reference/` are immutable evidence used for verification.

## Rules

- Do not add a database or ORM for parser results.
- Do not persist derived parser state unless a task explicitly asks for a file format.
- Keep parser data in memory as `IrImage`, `IrMetadata`, and `RegionStats`.

If a future task needs storage, document the file or database contract in a new task-specific design before adding dependencies.
