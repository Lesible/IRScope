import type { Stats, Tool } from "../types";

export function fmt(value: number) {
  return value.toFixed(2);
}

export function temp(value: number) {
  return `${fmt(value)}℃`;
}

export function toolLabel(kind: Tool) {
  return kind === "point" ? "点分析" : kind === "line" ? "线分析" : "框分析";
}

export function formatStats(stats: Stats) {
  return `像素数=${stats.count} 最高温=${temp(stats.max)}@(${stats.maxX},${stats.maxY}) 最低温=${temp(stats.min)}@(${stats.minX},${stats.minY}) 平均温=${temp(stats.avg)}`;
}
