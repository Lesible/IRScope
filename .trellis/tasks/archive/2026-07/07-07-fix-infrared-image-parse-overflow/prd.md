# Fix infrared image parse overflow

## Goal

Make `/Users/robot/Downloads/2020002208535580672_infrared.jpg` parse safely and correctly enough for CLI/Swing analysis instead of producing absurd values or crashing when the user clicks analysis.

## Requirements

- Reproduce the failure with the provided image.
- Identify why the current parser accepts or derives invalid dimensions, matrix offsets, temperatures, or metadata for this file.
- Fix the shared parsing path, not only one UI or CLI caller.
- Keep existing seven reference samples working.
- Keep Java compatible with JDK 8-21.
- Do not add runtime dependencies on the original Windows DLLs.
- Preserve raw metadata bytes when parsing succeeds.

## Acceptance Criteria

- [x] `mvn clean test package` passes.
- [x] `java -jar target/irscope.jar --cli reference/original-program/samples/1.jpg --stats` still matches documented sample behavior.
- [x] The provided image no longer causes absurd analysis output or unhandled GUI analysis failure.
- [x] A small regression check covers the failing image or the malformed-layout condition that caused it.

## Notes

- Provided file: `/Users/robot/Downloads/2020002208535580672_infrared.jpg`.
- User reported that clicking analysis produces abnormally huge data.
