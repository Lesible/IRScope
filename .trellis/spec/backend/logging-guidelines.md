# Logging Guidelines

IRScope has no logging framework.

## Current Output Channels

- CLI results are printed to stdout in `IrParserCli.printInfo` and `IrParserCli.printStats`.
- CLI errors propagate as exceptions.
- Swing status updates use the status label in `IrParserSwing`.
- Swing open/save failures use `JOptionPane`.
- Verification expectations live in `docs/verification.md`.

## Rules

- Do not add a logging dependency for normal parser work.
- Keep CLI output stable enough for docs and manual verification.
- Use `Locale.ROOT` for formatted numeric output, matching `IrParserCli` and `IrParserSwing`.
- Do not dump full temperature matrices or raw metadata to stdout by default; use CSV export or explicit debug tooling when needed.

If a future task needs trace logging for reverse engineering, prefer a small task-local diagnostic command or doc note over a permanent logging abstraction.
