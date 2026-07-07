export type Tool = "point" | "line" | "rect";

export type Stats = {
  count: number;
  min: number;
  minX: number;
  minY: number;
  max: number;
  maxX: number;
  maxY: number;
  avg: number;
};

export type Metadata = {
  emissivity: number;
  environmentTemperature: number;
  distanceRaw: number;
  relativeHumidityPercent: number;
  mdfOrCorrectionTemperature: number;
  productor: string;
  cameraType: string;
  cameraSerial: string;
  longitude: number;
  latitude: number;
  unknownInt100: number;
  description: string;
  jpegPayloadOffset: number;
  guidOrChecksum: string;
};

export type ImageInfo = {
  filePath: string;
  fileName: string;
  version: number;
  width: number;
  height: number;
  timestamp: string;
  jpegEndOffset: number;
  payloadOffset: number;
  metadataBytes: number;
  metadata: Metadata;
  fullStats: Stats;
  centerTemperature: number;
};

export type Mark = {
  id: number;
  kind: Tool;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stats: Stats;
};

export type Drag = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};
