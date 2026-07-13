import type { ImageInfo, ImageSize, Mark, Stats } from "../types";
import { fmt, formatStats, temp, toolLabel } from "../lib/format";
import { useState } from "react";

export function Inspector({
  info,
  previewSize,
  marks,
  onDeleteMark,
  onClearMarks
}: {
  info: ImageInfo | null;
  previewSize: ImageSize | null;
  marks: Mark[];
  onDeleteMark: (id: number) => void;
  onClearMarks: () => void;
}) {
  const [tab, setTab] = useState<"info" | "marks">("info");

  return (
    <aside className="inspector">
      <div className="tabs" role="tablist" aria-label="右侧信息">
        <button type="button" className={tab === "info" ? "active" : ""} onClick={() => setTab("info")}>
          基础信息
        </button>
        <button type="button" className={tab === "marks" ? "active" : ""} onClick={() => setTab("marks")}>
          分析列表
        </button>
      </div>

      <div className="tab-body">
        {tab === "info" ? (
          <>
            <Panel title="图像">
              {info ? (
                <dl className="meta-grid">
                  <Row label="图像尺寸" value={previewSize ? `${previewSize.width} x ${previewSize.height}` : "-"} />
                  <Row label="热图尺寸" value={`${info.width} x ${info.height}`} />
                  <Row label="时间" value={info.timestamp} />
                  <Row label="版本" value={String(info.version)} />
                  <Row label="元数据大小" value={`${info.metadataBytes} 字节`} />
                  <Row label="数据偏移" value={String(info.payloadOffset)} />
                  <Row label="中心温度" value={temp(info.centerTemperature)} />
                </dl>
              ) : (
                <p className="muted">未打开图片</p>
              )}
            </Panel>

            <Panel title="全图统计">
              {info ? <StatsView stats={info.fullStats} /> : <p className="muted">等待解析</p>}
            </Panel>

            <Panel title="设备元数据">
              {info ? (
                <dl className="meta-grid">
                  <Row label="厂商" value={info.metadata.productor || "-"} />
                  <Row label="型号" value={info.metadata.cameraType || "-"} />
                  <Row label="序列号" value={info.metadata.cameraSerial || "-"} />
                  <Row label="发射率" value={fmt(info.metadata.emissivity)} />
                  <Row label="环境温度" value={temp(info.metadata.environmentTemperature)} />
                  <Row label="湿度" value={`${info.metadata.relativeHumidityPercent}%`} />
                </dl>
              ) : (
                <p className="muted">等待解析</p>
              )}
            </Panel>
          </>
        ) : (
          <Panel title="分析列表">
            {marks.length ? (
              <>
                <button type="button" className="clear-marks" onClick={onClearMarks}>删除所有分析</button>
                <ol className="marks">
                  {marks.map((mark) => (
                    <li key={mark.id}>
                      <button type="button" onClick={() => onDeleteMark(mark.id)}>删除</button>
                      <strong>{toolLabel(mark.kind)} ({mark.x1},{mark.y1})-({mark.x2},{mark.y2})</strong>
                      <span>{formatStats(mark.stats)}</span>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="muted">选择点、线或框，在图像上点击/拖动。</p>
            )}
          </Panel>
        )}
      </div>
    </aside>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function StatsView({ stats }: { stats: Stats }) {
  return (
    <dl className="stats-grid">
      <Row label="像素数" value={String(stats.count)} />
      <Row label="最低温" value={`${temp(stats.min)} @ (${stats.minX},${stats.minY})`} />
      <Row label="最高温" value={`${temp(stats.max)} @ (${stats.maxX},${stats.maxY})`} />
      <Row label="平均温" value={temp(stats.avg)} />
    </dl>
  );
}
