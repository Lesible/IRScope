# IRScope Backend Development Guidelines

IRScope is a small Java 8-compatible parser and verification UI for infrared JPG files. The original Windows executable and DLLs under `reference/` are evidence only; runtime code must stay self-contained.

## Pre-Development Checklist

Before editing parser behavior, CLI behavior, Swing behavior, tests, docs, or ports:

- Read `docs/project-history.md`, `docs/ir-image-format-generic.md`, `docs/metadata-structure.md`, `docs/porting-guide.md`, and `docs/verification.md`.
- Read the relevant spec files below.
- Keep Java source compatible with JDK 8-21 unless a task explicitly changes that constraint.
- Validate parser changes against `reference/original-program/samples/1.jpg` through `7.jpg`.

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Java package layout, docs, reference attachments, and ports | Active |
| [Error Handling](./error-handling.md) | Parser, CLI, Swing, and metadata failure patterns | Active |
| [Quality Guidelines](./quality-guidelines.md) | Format invariants, tests, compatibility, and review checks | Active |
| [Logging Guidelines](./logging-guidelines.md) | Current no-logging convention and user-facing output | Active |
| [Database Guidelines](./database-guidelines.md) | Not applicable: this project has no database layer | Active |

## Verification Commands

```bash
rtk mvn clean test package
rtk java -jar target/irscope.jar --cli reference/original-program/samples/1.jpg --stats
```
