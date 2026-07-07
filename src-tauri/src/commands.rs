use crate::ir::{self, IrMetadata, RegionStats};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{BufWriter, Write};
use std::path::{Path, PathBuf};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageInfo {
    file_path: String,
    file_name: String,
    version: u16,
    width: usize,
    height: usize,
    timestamp: String,
    jpeg_end_offset: usize,
    payload_offset: usize,
    metadata_bytes: usize,
    metadata: IrMetadata,
    full_stats: RegionStats,
    center_temperature: f32,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegionRequest {
    path: String,
    kind: String,
    x1: usize,
    y1: usize,
    x2: usize,
    y2: usize,
}

#[tauri::command]
pub fn parse_ir_image(path: String) -> Result<ImageInfo, String> {
    let img = ir::parse_path(Path::new(&path))?;
    let file_name = Path::new(&path)
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| path.clone());
    Ok(ImageInfo {
        file_path: path,
        file_name,
        version: img.version,
        width: img.width,
        height: img.height,
        timestamp: img.timestamp.clone(),
        jpeg_end_offset: img.jpeg_end_offset,
        payload_offset: img.payload_offset,
        metadata_bytes: img.metadata.len(),
        metadata: img.parsed_metadata.clone(),
        full_stats: img.full_stats()?,
        center_temperature: img.temp_at(img.width / 2, img.height / 2)?,
    })
}

#[tauri::command]
pub fn analyze_region(req: RegionRequest) -> Result<RegionStats, String> {
    let img = ir::parse_path(Path::new(&req.path))?;
    match req.kind.as_str() {
        "point" => img.point(req.x2, req.y2),
        "line" => img.line(req.x1, req.y1, req.x2, req.y2),
        "rect" => img.rect(req.x1, req.y1, req.x2, req.y2),
        other => Err(format!("unknown analysis kind: {other}")),
    }
}

#[tauri::command]
pub fn export_csv(path: String, out_path: String) -> Result<String, String> {
    let img = ir::parse_path(Path::new(&path))?;
    let out = csv_path(Path::new(&out_path));
    let file = File::create(&out).map_err(|e| format!("failed to create {}: {e}", out.display()))?;
    let mut writer = BufWriter::new(file);
    writer
        .write_all(b"x,y,temp\n")
        .map_err(|e| format!("failed to write CSV header: {e}"))?;
    for y in 0..img.height {
        for x in 0..img.width {
            writeln!(writer, "{x},{y},{}", img.temperatures[y * img.width + x])
                .map_err(|e| format!("failed to write CSV row: {e}"))?;
        }
    }
    Ok(out.to_string_lossy().to_string())
}

fn csv_path(path: &Path) -> PathBuf {
    if path
        .extension()
        .is_some_and(|ext| ext.to_string_lossy().eq_ignore_ascii_case("csv"))
    {
        path.to_path_buf()
    } else {
        path.with_extension("csv")
    }
}
