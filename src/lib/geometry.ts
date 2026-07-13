export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function scalePoint(
  x: number,
  y: number,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
) {
  return {
    x: scalePixel(x, sourceWidth, targetWidth),
    y: scalePixel(y, sourceHeight, targetHeight)
  };
}

function scalePixel(value: number, sourceSize: number, targetSize: number) {
  if (sourceSize <= 0 || targetSize <= 0) throw new Error("image dimensions must be positive");
  if (sourceSize === 1 || targetSize === 1) return 0;
  return Math.round((clamp(value, 0, sourceSize - 1) * (targetSize - 1)) / (sourceSize - 1));
}

export function displayToImage(x: number, y: number, width: number, height: number, rotation: number) {
  switch (rotation & 3) {
    case 1:
      return { x: y, y: height - 1 - x };
    case 2:
      return { x: width - 1 - x, y: height - 1 - y };
    case 3:
      return { x: width - 1 - y, y: x };
    default:
      return { x, y };
  }
}

export function imageToDisplay(x: number, y: number, width: number, height: number, rotation: number) {
  switch (rotation & 3) {
    case 1:
      return { x: height - 1 - y, y: x };
    case 2:
      return { x: width - 1 - x, y: height - 1 - y };
    case 3:
      return { x: y, y: width - 1 - x };
    default:
      return { x, y };
  }
}
