export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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
