# Journal - lesiew (Part 1)

> AI development session journal
> Started: 2026-07-07

---


## 2026-07-07 - decompile-current-project progress

- Created Trellis task `.trellis/tasks/07-07-decompile-current-project` and activated it (`in_progress`).
- Wrote `prd.md`, `design.md`, and `implement.md` for JPG/IR parsing, Java parser, CLI, and Swing validation UI.
- Generated `decompiled/` analysis workspace: inventory, interfaces, disassembly, Java parser project, and parsing docs.
- Implemented Maven/JDK21 Java parser with CLI and Swing UI shaped after original tool strings: 打开图片、点/线/框分析、分析字符串、图片中的信息.
- Validation run reached `mvn -q -f decompiled/java-ir-parser/pom.xml test package`; CLI/CSV commands were run after packaging.
- Remaining: run Trellis check/final validation, optionally screenshot GUI manually, update specs if needed, finish/archive/commit if repository setup is added.

## 2026-07-07 - decompile-current-project validation update

- Added Swing GUI validation mode with original-tool-like layout: menu/toolbar, image workspace, right-side 图片中的信息/分析字符串 tabs, bottom status bar.
- Verified Maven build: `mvn -q -f decompiled/java-ir-parser/pom.xml test package`.
- Verified CLI stats/point/line/rect/CSV commands; recorded output in `decompiled/analysis/verification.md`.
- Confirmed `decompiled/` currently contains 118 files, including inventory for 22 PE files and Java runnable jar `decompiled/java-ir-parser/target/ir-parser.jar`.

## 2026-07-07 - generic IR format documentation

- Added `decompiled/analysis/ir-image-format-generic.md` as a language-independent format document.
- It documents JPEG true-EOI scanning, IR payload layout, temperature matrix indexing, metadata handling, point/line/rect statistics, pseudocode, sample validation values, and DLL layer mapping.
- Linked the generic document from `decompiled/README.md` and `decompiled/analysis/temperature-parsing.md`; updated PRD acceptance criteria.

## 2026-07-07 - metadata reverse engineering

- Reversed the 195-byte IR metadata tail into structured fields and documented offsets/types in `decompiled/analysis/metadata-structure.md`.
- Added Java `IrMetadata` parser and wired it into CLI output and Swing 图片中的信息 panel.
- Confirmed Maven tests pass after metadata parsing: `mvn -q -f decompiled/java-ir-parser/pom.xml test package`.
- Remaining uncertain fields are explicitly named with lower confidence: `mdfOrCorrectionTemperature`, `unknownInt100`, and `fileGuidOrChecksum`.

## 2026-07-07 - demo launchers

- Added `decompiled/run-demo.sh` and `decompiled/run-demo.bat` to launch the Swing verification demo.
- Updated `decompiled/README.md` with demo commands.

## 2026-07-07 - Java project naming

- Named the Java demo/project `IRScope`.
- Updated Maven artifact/final jar to `irscope.jar`, Swing title, launch scripts, and README command references.
- Rebuilt and verified `java -jar decompiled/java-ir-parser/target/irscope.jar 例图/1.jpg --point 320,240`.

## 2026-07-07 - JDK compatibility

- Lowered IRScope Maven compiler release from JDK 21 to JDK 17.
- Verified `mvn -q -f decompiled/java-ir-parser/pom.xml clean test package` and CLI stats still pass.
- Current minimum is JDK 17 due to records/switch expressions/HexFormat; Java 8 would need small refactors.

## 2026-07-07 - Java 8 compatibility

- Refactored IRScope from Java 17 syntax to Java 8-compatible code: records -> final classes, switch expressions -> classic switch, Path.of -> Paths.get, HexFormat -> small hex helper, var -> explicit type.
- Set Maven compiler release to 8.
- Verified on current JDK 21 with `mvn -q -f decompiled/java-ir-parser/pom.xml clean test package` and CLI stats.

## 2026-07-07 - default GUI startup

- Changed IRScope startup so no args opens GUI, and a direct JPG path opens GUI.
- CLI mode moved to `--cli <jpg> ...`; `--gui [jpg]` still works.
- Updated docs and verified Maven build plus CLI point command.
