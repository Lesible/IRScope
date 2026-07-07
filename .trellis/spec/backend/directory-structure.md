# Directory Structure

IRScope is a single Maven module. Keep it that way unless a task explicitly asks for a port or packaging split.

## Directory Layout

```text
src/main/java/com/yfcam/irparser/   Java parser, CLI, Swing verifier, stats model
src/test/java/com/yfcam/irparser/   Executable self-test run by Maven
docs/                               Format, metadata, verification, and history docs
reference/original-program/         Original Windows binaries, logs, and sample JPGs
reference/reverse-engineering/      Disassembly, strings, headers, and inventory evidence
scripts/                            Small demo launchers
dist/                               Prebuilt runnable jar
```

## Java Package

All current Java code lives in `com.shenhao.ir.parser`.

- Parser logic belongs in `IrImageParser`.
- Parsed image state belongs in `IrImage`.
- Parsed metadata fields belong in `IrMetadata`.
- Region calculations belong in `RegionStats`.
- CLI argument handling and CSV export belong in `IrParserCli`.
- Swing-only UI code belongs in `IrParserSwing`.

Reference examples:

- `src/main/java/com/yfcam/irparser/IrImageParser.java` locates true JPEG EOI, parses the IR payload header, reads the float32 matrix, and preserves metadata bytes.
- `src/main/java/com/yfcam/irparser/RegionStats.java` owns point, line, and rectangle statistics over parsed coordinates.
- `src/test/java/com/yfcam/irparser/IrParserSelfTest.java` validates all seven sample images without JUnit.

## Documentation And Evidence

Keep format claims synchronized with the docs:

- `docs/ir-image-format-generic.md` is the language-neutral parser contract.
- `docs/metadata-structure.md` documents known fields in the variable-length metadata tail.
- `docs/verification.md` records expected command output and sample values.
- `docs/project-history.md` records why the code is shaped this way.

The DLLs and EXE under `reference/original-program/bin/` are reference attachments only. Do not add runtime dependencies on them.

## Ports

For Rust, Go, or another language, implement the language-neutral parser first from `docs/ir-image-format-generic.md`, then copy expected values from `docs/verification.md`. Keep new ports separate from the Java source tree.
