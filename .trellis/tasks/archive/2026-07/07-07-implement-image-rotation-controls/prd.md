# Implement image rotation controls

## Goal

Make the Swing image rotation controls actually rotate the displayed image and analysis interactions, and make CSV export automatically use a `.csv` suffix when the user omits it.

## Background

- `src/main/java/com/yfcam/irparser/IrParserSwing.java` currently wires `右转90度`, `左转90度`, and `翻转180度` to status text that says the transform is not implemented.
- Swing point, line, and rectangle analysis currently maps mouse positions directly through `ImagePanel.toImage`.
- CLI and Swing CSV export currently write exactly the provided path. Swing's menu label is `存储温度CSV`, so saving `temps` should produce `temps.csv`.

## Requirements

- Implement `右转90度`, `左转90度`, and `翻转180度` in the Swing UI.
- Rotation must affect the displayed image, mouse-to-image coordinate mapping, and drawn analysis marks.
- Rotation must not mutate the parsed temperature matrix or CSV coordinate system.
- Existing marks should remain valid and display in the rotated view.
- When exporting CSV, append `.csv` if the selected/provided filename has no `.csv` suffix, case-insensitive.
- Keep Java compatible with JDK 8-21.
- Do not add image-processing dependencies; use JDK/Swing APIs already present.

## Acceptance Criteria

- [x] Menu items and toolbar buttons for right 90, left 90, and 180 rotation change the visible image orientation.
- [x] After rotation, point/line/rectangle analysis uses the pixel under the rotated view position.
- [x] Existing analysis marks are redrawn at their rotated positions.
- [x] Swing CSV save to a filename like `temps` writes `temps.csv`.
- [x] CLI `--csv /tmp/temps` writes `/tmp/temps.csv`; `--csv /tmp/temps.csv` remains unchanged.
- [x] `mvn clean test package` passes.
- [x] Existing CLI stats for `reference/original-program/samples/1.jpg` remain unchanged.

## Out Of Scope

- Persisting rotated image files.
- Rotating the exported CSV coordinate system.
- Adding arbitrary-angle rotation, mirroring, undo/redo, or new UI controls.
