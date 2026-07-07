import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { currentMonitor, getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { open, save } from "@tauri-apps/plugin-dialog";
import { PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Inspector } from "./components/Inspector";
import { fmt, formatStats, temp, toolLabel } from "./lib/format";
import { clamp, displayToImage, imageToDisplay } from "./lib/geometry";
import type { Drag, ImageInfo, Mark, Stats, Tool } from "./types";

const TOOLS: Array<{ id: Tool; label: string }> = [
  { id: "point", label: "点分析" },
  { id: "line", label: "线段分析" },
  { id: "rect", label: "框选分析" }
];

const INSPECTOR_WIDTH = 380;
const WORKSPACE_GAP_AND_PADDING = 36;
const VERTICAL_CHROME = 132;
const WINDOW_MARGIN = 40;
const BASE_WINDOW_WIDTH = 1280;
const BASE_WINDOW_HEIGHT = 900;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [info, setInfo] = useState<ImageInfo | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePaintTick, setImagePaintTick] = useState(0);
  const [tool, setTool] = useState<Tool>("point");
  const [rotation, setRotation] = useState(0);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [status, setStatus] = useState("打开一张红外 JPG 开始分析");
  const [busy, setBusy] = useState(false);

  const displaySize = useMemo(() => {
    if (!info) return { width: 640, height: 480 };
    return rotation % 2 === 0
      ? { width: info.width, height: info.height }
      : { width: info.height, height: info.width };
  }, [info, rotation]);

  const openImage = useCallback(async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "IR JPG", extensions: ["jpg", "jpeg"] }]
    });
    if (typeof selected !== "string") return;
    setBusy(true);
    try {
      const parsed = await invoke<ImageInfo>("parse_ir_image", { path: selected });
      setInfo(parsed);
      setImageUrl(convertFileSrc(selected));
      setImagePaintTick(0);
      setMarks([]);
      setDrag(null);
      setRotation(0);
      setStatus(`已打开 ${parsed.fileName}`);
      void resizeWindowForImage(parsed).catch(() => undefined);
    } catch (error) {
      setStatus(String(error));
    } finally {
      setBusy(false);
    }
  }, []);

  const exportCsv = useCallback(async () => {
    if (!info) return;
    const selected = await save({
      defaultPath: info.fileName.replace(/\.[^.]+$/, ".csv"),
      filters: [{ name: "CSV", extensions: ["csv"] }]
    });
    if (!selected) return;
    setBusy(true);
    try {
      const out = await invoke<string>("export_csv", { path: info.filePath, outPath: selected });
      setStatus(`已导出 ${out}`);
    } catch (error) {
      setStatus(String(error));
    } finally {
      setBusy(false);
    }
  }, [info]);

  const clearImage = useCallback(() => {
    setInfo(null);
    setImageUrl("");
    setImagePaintTick(0);
    setMarks([]);
    setDrag(null);
    setRotation(0);
    setStatus("已清除图像");
  }, []);

  const finishMark = useCallback(
    async (next: Drag) => {
      if (!info) return;
      setBusy(true);
      try {
        const stats = await invoke<Stats>("analyze_region", {
          req: { path: info.filePath, kind: tool, ...next }
        });
        const mark = { id: Date.now(), kind: tool, ...next, stats };
        setMarks((items) => [...items, mark]);
        setStatus(`${toolLabel(tool)} (${next.x1},${next.y1})-(${next.x2},${next.y2}) ${formatStats(stats)}`);
      } catch (error) {
        setStatus(String(error));
      } finally {
        setBusy(false);
      }
    },
    [info, tool]
  );

  const pointerPoint = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (!info || !canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = clamp(
        Math.round(((event.clientX - rect.left) * displaySize.width) / Math.max(1, rect.width)),
        0,
        displaySize.width - 1
      );
      const dy = clamp(
        Math.round(((event.clientY - rect.top) * displaySize.height) / Math.max(1, rect.height)),
        0,
        displaySize.height - 1
      );
      return displayToImage(dx, dy, info.width, info.height, rotation);
    },
    [displaySize.height, displaySize.width, info, rotation]
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (!info) return;
      const p = pointerPoint(event);
      setDrag({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
    },
    [info, pointerPoint]
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (!drag) return;
      const p = pointerPoint(event);
      setDrag((current) => (current ? { ...current, x2: p.x, y2: p.y } : null));
    },
    [drag, pointerPoint]
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (!drag) return;
      const p = pointerPoint(event);
      const next = { ...drag, x2: p.x, y2: p.y };
      setDrag(null);
      void finishMark(next);
    },
    [drag, finishMark, pointerPoint]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111113";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (image && image.complete && info) {
      drawRotatedImage(ctx, image, rotation, displaySize.width, displaySize.height, info.width, info.height);
      for (const mark of marks) drawMark(ctx, mark, info, rotation, "#fbbf24");
      if (drag) drawMark(ctx, { ...drag, kind: tool }, info, rotation, "#5eead4");
    }
  }, [displaySize.height, displaySize.width, drag, imagePaintTick, imageUrl, info, marks, rotation, tool]);

  return (
    <main className="app-shell">
      <header className="toolbar">
        <div className="tool-group" aria-label="文件">
          <button type="button" onClick={openImage} disabled={busy}>打开</button>
          <button type="button" onClick={exportCsv} disabled={!info || busy}>导出 CSV</button>
          <button
            type="button"
            onClick={() => {
              setMarks([]);
              setStatus("已清除绘制信息");
            }}
            disabled={!info || !marks.length || busy}
          >
            清除绘制
          </button>
          <button type="button" onClick={clearImage} disabled={!info || busy}>清除图像</button>
        </div>
        <div className="tool-group" aria-label="分析工具">
          {TOOLS.map((item) => (
            <button key={item.id} type="button" className={tool === item.id ? "active" : ""} onClick={() => setTool(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="tool-group" aria-label="旋转">
          <button type="button" onClick={() => setRotation((r) => (r + 3) % 4)} disabled={!info}>左转90</button>
          <button type="button" onClick={() => setRotation((r) => (r + 1) % 4)} disabled={!info}>右转90</button>
          <button type="button" onClick={() => setRotation((r) => (r + 2) % 4)} disabled={!info}>翻转180</button>
        </div>
      </header>

      <section className="workspace">
        <div className="canvas-panel">
          {imageUrl ? <img ref={imageRef} src={imageUrl} alt="" className="hidden-source" onLoad={() => setImagePaintTick((tick) => tick + 1)} /> : null}
          <canvas
            ref={canvasRef}
            className="image-canvas"
            style={{
              aspectRatio: `${displaySize.width} / ${displaySize.height}`
            } as React.CSSProperties}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        </div>

        <Inspector
          info={info}
          marks={marks}
          onDeleteMark={(id) => setMarks((items) => items.filter((item) => item.id !== id))}
          onClearMarks={() => {
            setMarks([]);
            setStatus("已删除所有分析");
          }}
        />
      </section>

      <footer className="status-line">{busy ? "处理中..." : status}</footer>
    </main>
  );
}

async function resizeWindowForImage(info: ImageInfo) {
  const monitor = await currentMonitor();
  const workArea = monitor?.workArea.size.toLogical(monitor.scaleFactor);
  const maxWidth = (workArea?.width ?? 1600) - WINDOW_MARGIN;
  const maxHeight = (workArea?.height ?? 1000) - WINDOW_MARGIN;
  const targetWidth = Math.min(Math.max(BASE_WINDOW_WIDTH, info.width + INSPECTOR_WIDTH + WORKSPACE_GAP_AND_PADDING), maxWidth);
  const targetHeight = Math.min(Math.max(BASE_WINDOW_HEIGHT, info.height + VERTICAL_CHROME), maxHeight);
  const appWindow = getCurrentWindow();
  await appWindow.setSize(new LogicalSize(Math.round(targetWidth), Math.round(targetHeight)));
  await appWindow.center();
}

function drawRotatedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  rotation: number,
  displayWidth: number,
  displayHeight: number,
  imageWidth: number,
  imageHeight: number
) {
  ctx.save();
  switch (rotation & 3) {
    case 1:
      ctx.translate(displayWidth, 0);
      ctx.rotate(Math.PI / 2);
      break;
    case 2:
      ctx.translate(displayWidth, displayHeight);
      ctx.rotate(Math.PI);
      break;
    case 3:
      ctx.translate(0, displayHeight);
      ctx.rotate(-Math.PI / 2);
      break;
  }
  ctx.drawImage(image, 0, 0, imageWidth, imageHeight);
  ctx.restore();
}

function drawMark(
  ctx: CanvasRenderingContext2D,
  mark: { kind: Tool; x1: number; y1: number; x2: number; y2: number; stats?: Stats },
  info: ImageInfo,
  rotation: number,
  color: string
) {
  const a = imageToDisplay(mark.x1, mark.y1, info.width, info.height, rotation);
  const b = imageToDisplay(mark.x2, mark.y2, info.width, info.height, rotation);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 4;
  if (mark.kind === "line") {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  } else if (mark.kind === "rect") {
    ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  } else {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.moveTo(b.x - 10, b.y);
    ctx.lineTo(b.x + 10, b.y);
    ctx.moveTo(b.x, b.y - 10);
    ctx.lineTo(b.x, b.y + 10);
    ctx.stroke();
  }
  if (mark.stats) {
    if (mark.kind === "point") {
      drawLabel(ctx, b.x + 12, b.y - 16, [temp(mark.stats.avg)]);
    } else {
      drawRegionStats(ctx, mark.stats, a, b, info, rotation);
    }
  }
  ctx.restore();
}

function drawRegionStats(
  ctx: CanvasRenderingContext2D,
  stats: Stats,
  a: { x: number; y: number },
  b: { x: number; y: number },
  info: ImageInfo,
  rotation: number
) {
  const max = imageToDisplay(stats.maxX, stats.maxY, info.width, info.height, rotation);
  const min = imageToDisplay(stats.minX, stats.minY, info.width, info.height, rotation);
  drawHotspot(ctx, max.x, max.y, "#fb553c", 7, "最高");
  drawHotspot(ctx, min.x, min.y, "#67e8f9", 5, "最低");
  const x = clamp(Math.min(a.x, b.x) + 10, 8, ctx.canvas.width - 210);
  const y = clamp(Math.min(a.y, b.y) - 58, 8, ctx.canvas.height - 70);
  drawLabel(ctx, x, y, [`最高温 ${temp(stats.max)}`, `最低温 ${temp(stats.min)}`, `平均温 ${temp(stats.avg)}`]);
}

function drawHotspot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius: number, label: string) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.strokeStyle = "#18181b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  ctx.fillStyle = "#f4f4f5";
  ctx.fillText(label, x + radius + 4, y + 4);
  ctx.restore();
}

function drawLabel(ctx: CanvasRenderingContext2D, x: number, y: number, lines: string[]) {
  ctx.save();
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  const width = Math.max(...lines.map((line) => ctx.measureText(line).width)) + 18;
  const height = lines.length * 18 + 10;
  roundRect(ctx, x, y, width, height, 8);
  ctx.fillStyle = "rgba(24,24,27,0.86)";
  ctx.fill();
  ctx.strokeStyle = "rgba(244,244,245,0.18)";
  ctx.stroke();
  ctx.fillStyle = "#f4f4f5";
  lines.forEach((line, index) => ctx.fillText(line, x + 9, y + 20 + index * 18));
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
