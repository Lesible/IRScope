use serde::Serialize;
use std::fs;
use std::path::Path;

#[derive(Clone)]
pub struct IrImage {
    pub version: u16,
    pub width: usize,
    pub height: usize,
    pub timestamp: String,
    pub temperatures: Vec<f32>,
    pub metadata: Vec<u8>,
    pub parsed_metadata: IrMetadata,
    pub jpeg_end_offset: usize,
    pub payload_offset: usize,
}

#[derive(Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IrMetadata {
    pub emissivity: f32,
    pub environment_temperature: f32,
    pub distance_raw: u32,
    pub relative_humidity_percent: u8,
    pub mdf_or_correction_temperature: f32,
    pub productor: String,
    pub camera_type: String,
    pub camera_serial: String,
    pub longitude: f64,
    pub latitude: f64,
    pub unknown_int_100: u32,
    pub description: String,
    pub jpeg_payload_offset: u32,
    pub guid_or_checksum: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegionStats {
    pub count: usize,
    pub min: f32,
    pub min_x: usize,
    pub min_y: usize,
    pub max: f32,
    pub max_x: usize,
    pub max_y: usize,
    pub avg: f64,
}

struct Acc {
    count: usize,
    min: f32,
    min_x: usize,
    min_y: usize,
    max: f32,
    max_x: usize,
    max_y: usize,
    sum: f64,
}

impl Acc {
    fn new() -> Self {
        Self {
            count: 0,
            min: f32::INFINITY,
            min_x: 0,
            min_y: 0,
            max: f32::NEG_INFINITY,
            max_x: 0,
            max_y: 0,
            sum: 0.0,
        }
    }

    fn add(&mut self, x: usize, y: usize, v: f32) {
        if v < self.min {
            self.min = v;
            self.min_x = x;
            self.min_y = y;
        }
        if v > self.max {
            self.max = v;
            self.max_x = x;
            self.max_y = y;
        }
        self.sum += f64::from(v);
        self.count += 1;
    }

    fn done(self) -> Result<RegionStats, String> {
        if self.count == 0 {
            return Err("empty region".to_string());
        }
        Ok(RegionStats {
            count: self.count,
            min: self.min,
            min_x: self.min_x,
            min_y: self.min_y,
            max: self.max,
            max_x: self.max_x,
            max_y: self.max_y,
            avg: self.sum / self.count as f64,
        })
    }
}

impl IrImage {
    pub fn temp_at(&self, x: usize, y: usize) -> Result<f32, String> {
        self.check_point(x, y)?;
        Ok(self.temperatures[y * self.width + x])
    }

    fn check_point(&self, x: usize, y: usize) -> Result<(), String> {
        if x >= self.width || y >= self.height {
            return Err(format!(
                "point outside image: {x},{y} for {}x{}",
                self.width, self.height
            ));
        }
        Ok(())
    }

    pub fn full_stats(&self) -> Result<RegionStats, String> {
        let mut acc = Acc::new();
        for y in 0..self.height {
            for x in 0..self.width {
                acc.add(x, y, self.temperatures[y * self.width + x]);
            }
        }
        acc.done()
    }

    pub fn point(&self, x: usize, y: usize) -> Result<RegionStats, String> {
        let mut acc = Acc::new();
        acc.add(x, y, self.temp_at(x, y)?);
        acc.done()
    }

    pub fn rect(&self, x1: usize, y1: usize, x2: usize, y2: usize) -> Result<RegionStats, String> {
        let min_x = x1.min(x2).min(self.width.saturating_sub(1));
        let max_x = x1.max(x2).min(self.width.saturating_sub(1));
        let min_y = y1.min(y2).min(self.height.saturating_sub(1));
        let max_y = y1.max(y2).min(self.height.saturating_sub(1));
        let mut acc = Acc::new();
        for y in min_y..=max_y {
            for x in min_x..=max_x {
                acc.add(x, y, self.temperatures[y * self.width + x]);
            }
        }
        acc.done()
    }

    pub fn line(&self, x1: usize, y1: usize, x2: usize, y2: usize) -> Result<RegionStats, String> {
        self.check_point(x1, y1)?;
        self.check_point(x2, y2)?;
        let mut acc = Acc::new();
        let mut x = x1 as isize;
        let mut y = y1 as isize;
        let x2 = x2 as isize;
        let y2 = y2 as isize;
        let dx = (x2 - x).abs();
        let sx = if x < x2 { 1 } else { -1 };
        let dy = -(y2 - y).abs();
        let sy = if y < y2 { 1 } else { -1 };
        let mut err = dx + dy;
        loop {
            let ux = x as usize;
            let uy = y as usize;
            acc.add(ux, uy, self.temperatures[uy * self.width + ux]);
            if x == x2 && y == y2 {
                break;
            }
            let e2 = 2 * err;
            if e2 >= dy {
                err += dy;
                x += sx;
            }
            if e2 <= dx {
                err += dx;
                y += sy;
            }
        }
        acc.done()
    }
}

pub fn parse_path(path: &Path) -> Result<IrImage, String> {
    let data = fs::read(path).map_err(|e| format!("failed to read {}: {e}", path.display()))?;
    parse_bytes(&data).map_err(|e| format!("{}: {e}", path.display()))
}

pub fn parse_bytes(data: &[u8]) -> Result<IrImage, String> {
    let eoi = find_true_jpeg_eoi(data).ok_or("JPEG EOI not found")?;
    let payload_offset = eoi + 2;
    if data.len().saturating_sub(payload_offset) < 20 {
        return Err("missing IR payload after JPEG EOI".to_string());
    }

    let mut header = Header {
        version: u16le(data, payload_offset)?,
        width: u16le(data, payload_offset + 2)? as usize,
        height: u16le(data, payload_offset + 4)? as usize,
        timestamp_offset: payload_offset + 6,
        temps_offset: payload_offset + 20,
    };
    if header.version != 256 || !is_timestamp(data, header.timestamp_offset) {
        if data.len().saturating_sub(payload_offset) < 22
            || u16le(data, payload_offset + 2)? != 256
            || !is_timestamp(data, payload_offset + 8)
        {
            return Err(format!(
                "unsupported IR payload header at offset {payload_offset}: version={}",
                header.version
            ));
        }
        header = Header {
            version: u16le(data, payload_offset + 2)?,
            width: u16le(data, payload_offset + 4)? as usize,
            height: u16le(data, payload_offset + 6)? as usize,
            timestamp_offset: payload_offset + 8,
            temps_offset: payload_offset + 22,
        };
    }
    let timestamp = std::str::from_utf8(&data[header.timestamp_offset..header.timestamp_offset + 14])
        .map_err(|e| format!("invalid timestamp: {e}"))?
        .to_string();
    let count = header
        .width
        .checked_mul(header.height)
        .ok_or("image dimensions overflow")?;
    let temps_bytes = count.checked_mul(4).ok_or("temperature byte size overflow")?;
    let temps_end = header
        .temps_offset
        .checked_add(temps_bytes)
        .ok_or("temperature offset overflow")?;
    if temps_end > data.len() {
        return Err(format!(
            "IR payload too short for {}x{} float32 matrix",
            header.width, header.height
        ));
    }
    let mut temperatures = Vec::with_capacity(count);
    for i in 0..count {
        let temp = f32le(data, header.temps_offset + i * 4)?;
        // ponytail: sanity bound catches payload misalignment; relax if real hardware exceeds it.
        if !temp.is_finite() || !(-273.15..=10000.0).contains(&temp) {
            return Err(format!("unreasonable temperature at index {i}: {temp}"));
        }
        temperatures.push(temp);
    }
    let metadata = data[temps_end..].to_vec();
    Ok(IrImage {
        version: header.version,
        width: header.width,
        height: header.height,
        timestamp,
        temperatures,
        parsed_metadata: parse_metadata(&metadata)?,
        metadata,
        jpeg_end_offset: eoi,
        payload_offset,
    })
}

struct Header {
    version: u16,
    width: usize,
    height: usize,
    timestamp_offset: usize,
    temps_offset: usize,
}

fn parse_metadata(meta: &[u8]) -> Result<IrMetadata, String> {
    if meta.len() < 18 {
        return Err(format!("metadata too short: {} bytes", meta.len()));
    }
    Ok(IrMetadata {
        emissivity: f32le(meta, 0)?,
        environment_temperature: f32le(meta, 4)?,
        distance_raw: u32le(meta, 8)?,
        relative_humidity_percent: meta[13],
        mdf_or_correction_temperature: f32le(meta, 14)?,
        productor: c_string(meta, 18, 32),
        camera_type: c_string(meta, 50, 32),
        camera_serial: c_string(meta, 82, 32),
        longitude: read_or(meta, 114, 8, f64le, 0.0)?,
        latitude: read_or(meta, 122, 8, f64le, 0.0)?,
        unknown_int_100: read_or(meta, 130, 4, u32le, 0)?,
        description: description(meta),
        jpeg_payload_offset: read_or(meta, 175, 4, u32le, 0)?,
        guid_or_checksum: if meta.len() >= 195 {
            hex(&meta[179..195])
        } else {
            String::new()
        },
    })
}

fn find_true_jpeg_eoi(data: &[u8]) -> Option<usize> {
    if data.len() < 4 || data[0] != 0xff || data[1] != 0xd8 {
        return None;
    }
    let mut i = 2;
    while i < data.len() {
        if data[i] != 0xff {
            i += 1;
            continue;
        }
        while i < data.len() && data[i] == 0xff {
            i += 1;
        }
        if i >= data.len() {
            return None;
        }
        let marker = data[i];
        i += 1;
        if marker == 0xd9 {
            return Some(i - 2);
        }
        if marker == 0xda {
            if i + 2 > data.len() {
                return None;
            }
            let len = u16be(data, i).ok()? as usize;
            i += len;
            while i + 1 < data.len() {
                if data[i] == 0xff {
                    let next = data[i + 1];
                    if next == 0x00 || (0xd0..=0xd7).contains(&next) {
                        i += 2;
                        continue;
                    }
                    if next == 0xd9 {
                        return Some(i);
                    }
                }
                i += 1;
            }
            return None;
        }
        if marker == 0xd8 || (0xd0..=0xd7).contains(&marker) {
            continue;
        }
        if i + 2 > data.len() {
            return None;
        }
        let len = u16be(data, i).ok()? as usize;
        if len < 2 {
            return None;
        }
        i += len;
    }
    None
}

fn is_timestamp(data: &[u8], offset: usize) -> bool {
    data.get(offset..offset + 14)
        .is_some_and(|s| s.iter().all(u8::is_ascii_digit))
}

fn c_string(data: &[u8], offset: usize, len: usize) -> String {
    let Some(bytes) = data.get(offset..offset + len) else {
        return String::new();
    };
    let end = bytes.iter().position(|b| *b == 0).unwrap_or(bytes.len());
    String::from_utf8_lossy(&bytes[..end]).trim().to_string()
}

fn description(meta: &[u8]) -> String {
    let Ok(len) = read_or(meta, 134, 4, u32le, 0) else {
        return String::new();
    };
    let len = len as usize;
    let Some(bytes) = meta.get(138..138 + len) else {
        return String::new();
    };
    String::from_utf8_lossy(bytes).to_string()
}

fn read_or<T>(
    data: &[u8],
    offset: usize,
    size: usize,
    f: fn(&[u8], usize) -> Result<T, String>,
    default: T,
) -> Result<T, String> {
    if offset.checked_add(size).is_some_and(|end| end <= data.len()) {
        f(data, offset)
    } else {
        Ok(default)
    }
}

fn hex(bytes: &[u8]) -> String {
    const CHARS: &[u8; 16] = b"0123456789abcdef";
    let mut out = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        out.push(CHARS[(b >> 4) as usize] as char);
        out.push(CHARS[(b & 0x0f) as usize] as char);
    }
    out
}

fn u16le(data: &[u8], offset: usize) -> Result<u16, String> {
    let bytes = data
        .get(offset..offset + 2)
        .ok_or_else(|| format!("need 2 bytes at offset {offset}"))?;
    Ok(u16::from_le_bytes([bytes[0], bytes[1]]))
}

fn u16be(data: &[u8], offset: usize) -> Result<u16, String> {
    let bytes = data
        .get(offset..offset + 2)
        .ok_or_else(|| format!("need 2 bytes at offset {offset}"))?;
    Ok(u16::from_be_bytes([bytes[0], bytes[1]]))
}

fn u32le(data: &[u8], offset: usize) -> Result<u32, String> {
    let bytes = data
        .get(offset..offset + 4)
        .ok_or_else(|| format!("need 4 bytes at offset {offset}"))?;
    Ok(u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]))
}

fn f32le(data: &[u8], offset: usize) -> Result<f32, String> {
    Ok(f32::from_bits(u32le(data, offset)?))
}

fn f64le(data: &[u8], offset: usize) -> Result<f64, String> {
    let bytes = data
        .get(offset..offset + 8)
        .ok_or_else(|| format!("need 8 bytes at offset {offset}"))?;
    Ok(f64::from_le_bytes([
        bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7],
    ]))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn validates_reference_samples() {
        let expected = [
            (-0.82, 49.65, 20.63),
            (-4.57, 30.98, 25.21),
            (-12.66, 46.83, 21.29),
            (-43.15, 57.08, 42.07),
            (16.57, 35.81, 34.50),
            (-5.23, 25.20, 1.81),
            (-0.08, 76.02, 34.62),
        ];
        for i in 1..=7 {
            let img = parse_path(Path::new(&format!("../reference/original-program/samples/{i}.jpg"))).unwrap();
            assert_eq!(img.version, 256);
            assert_eq!((img.width, img.height), (640, 480));
            assert_eq!(img.metadata.len(), 195);
            assert_eq!(img.parsed_metadata.productor, "MISSION");
            assert_eq!(img.parsed_metadata.camera_type, "C600");
            assert_eq!(img.parsed_metadata.camera_serial, "1001");
            assert!((img.parsed_metadata.emissivity - 0.9).abs() < 0.001);
            assert!((img.parsed_metadata.environment_temperature - 32.0).abs() < 0.001);
            assert_eq!(img.parsed_metadata.relative_humidity_percent, 50);
            let full = img.full_stats().unwrap();
            let (min, max, center) = expected[i - 1];
            assert!((full.min - min).abs() < 0.02, "min {i}: {}", full.min);
            assert!((full.max - max).abs() < 0.02, "max {i}: {}", full.max);
            assert!((img.temp_at(320, 240).unwrap() - center).abs() < 0.02);
        }
        let one = parse_path(Path::new("../reference/original-program/samples/1.jpg")).unwrap();
        assert_eq!(one.point(320, 240).unwrap().count, 1);
        assert_eq!(one.line(0, 0, 639, 479).unwrap().count, 640);
        assert_eq!(one.rect(100, 100, 200, 200).unwrap().count, 10201);
    }

    #[test]
    fn supports_shifted_header() {
        let width = 384usize;
        let height = 288usize;
        let count = width * height;
        let mut data = vec![0u8; 4 + 22 + count * 4 + 158];
        data[0] = 0xff;
        data[1] = 0xd8;
        data[2] = 0xff;
        data[3] = 0xd9;
        put16(&mut data, 4, 0x41e3);
        put16(&mut data, 6, 256);
        put16(&mut data, 8, width as u16);
        put16(&mut data, 10, height as u16);
        data[12..26].copy_from_slice(b"20260707095718");
        let temps = 26;
        for i in 0..count {
            put32(&mut data, temps + i * 4, (20.0f32 + (i % 50) as f32 / 10.0).to_bits());
        }
        let meta = temps + count * 4;
        put32(&mut data, meta, 0.95f32.to_bits());
        put32(&mut data, meta + 4, 26.68f32.to_bits());
        put32(&mut data, meta + 8, 3840);
        put32(&mut data, meta + 14, 26.68f32.to_bits());
        let camera_type = b"HM-TD5737T-4/W";
        let serial = b"20260513AACHEA8074000";
        data[meta + 50..meta + 50 + camera_type.len()].copy_from_slice(camera_type);
        data[meta + 82..meta + 82 + serial.len()].copy_from_slice(serial);
        let mut tmp = std::env::temp_dir();
        tmp.push("irscope-shifted-header.jpg");
        std::fs::File::create(&tmp).unwrap().write_all(&data).unwrap();
        let img = parse_path(&tmp).unwrap();
        let _ = std::fs::remove_file(tmp);
        assert_eq!(img.version, 256);
        assert_eq!((img.width, img.height), (width, height));
        assert_eq!(img.timestamp, "20260707095718");
        assert_eq!(img.metadata.len(), 158);
        assert_eq!(img.parsed_metadata.camera_type, "HM-TD5737T-4/W");
        assert_eq!(img.parsed_metadata.camera_serial, "20260513AACHEA8074000");
    }

    fn put16(data: &mut [u8], offset: usize, value: u16) {
        data[offset..offset + 2].copy_from_slice(&value.to_le_bytes());
    }

    fn put32(data: &mut [u8], offset: usize, value: u32) {
        data[offset..offset + 4].copy_from_slice(&value.to_le_bytes());
    }
}
