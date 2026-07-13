# 红外温度统计与极值点绘制移植说明（Java + Vue Web）

本文整理 IRScope 中点、线、矩形区域的最高温、最低温、平均温计算，以及最高/最低温点在 JPG 预览图上的绘制流程。目标环境是 Java 后端 + Vue Web 前端。

本文不要求 React、Tauri 或第三方 Canvas 绘图库。Java 负责读取温度矩阵和计算统计值，Vue 负责坐标换算、请求接口、保存标记和 Canvas 绘制。

## 1. 技术栈

| 层 | 技术 | 职责 |
|---|---|---|
| 后端 | Java | 保存温度矩阵，计算点/线/框区域统计 |
| 接口 | HTTP + JSON | 接收热图坐标，返回统计结果 |
| 前端 | Vue 3 + TypeScript | 管理图片、工具、拖动区域和分析标记 |
| 绘制 | 浏览器原生 Canvas 2D API | 绘制 JPG、区域、极值点和温度标签 |
| 图片尺寸 | `HTMLImageElement.naturalWidth/naturalHeight` | 获取 JPG 实际像素尺寸 |

不需要 ECharts、Konva、Fabric.js 等额外绘图库。已有项目如果使用 JavaScript 而不是 TypeScript，可以移除类型声明，算法不变。

## 2. 核心职责边界

```text
Vue 指针事件
  -> 显示坐标
  -> 撤销旋转，得到 JPG 坐标
  -> JPG 坐标缩放为热图坐标
  -> HTTP 请求 Java
  -> Java 遍历温度矩阵并返回 Stats
  -> Vue 保存 Mark
  -> 热图极值坐标缩放为 JPG 坐标
  -> 应用旋转，得到 Canvas 坐标
  -> 绘制区域、最高点、最低点和温度标签
```

必须保持两个尺寸概念：

- JPG 图片尺寸：用于展示和 Canvas 尺寸，例如 `640 x 512`。
- 热图矩阵尺寸：用于查温度和区域统计，例如 `384 x 288`。

统计坐标始终是热图坐标。不能把 JPG 坐标直接传给 Java 温度查询接口。

## 3. HTTP 数据契约

下面的 URL 是移植模板，不是 IRScope 现有接口。请替换为目标 Java 项目的实际 Controller 路径和图片标识方式。

### 3.1 分析请求

```http
POST /api/infrared/{imageId}/analyze
Content-Type: application/json
```

```json
{
  "kind": "rect",
  "x1": 20,
  "y1": 30,
  "x2": 120,
  "y2": 90
}
```

`kind` 支持：

- `point`：使用 `(x2, y2)` 查询一个温点。
- `line`：统计 `(x1, y1)` 到 `(x2, y2)` 的离散线段像素。
- `rect`：统计包含边界的矩形区域。

### 3.2 统计响应

```json
{
  "count": 6161,
  "min": 21.37,
  "minX": 42,
  "minY": 51,
  "max": 48.62,
  "maxX": 95,
  "maxY": 67,
  "avg": 28.14
}
```

前端类型：

```ts
export type Tool = "point" | "line" | "rect";

export type ImageSize = {
  width: number;
  height: number;
};

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

export type ThermalImageInfo = {
  imageId: string;
  thermalWidth: number;
  thermalHeight: number;
  fullStats: Stats;
};

export type Region = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type Mark = Region & {
  id: number;
  kind: Tool;
  stats: Stats;
};
```

## 4. Java 统计计算伪代码

温度矩阵按行优先保存：

```text
index = y * thermalWidth + x
temperature = temperatures[index]
```

统计累加器：

```text
count = 0
sum = 0.0
min = positive infinity
max = negative infinity
minX = 0
minY = 0
maxX = 0
maxY = 0

function add(x, y, temperature):
    if temperature < min:
        min = temperature
        minX = x
        minY = y

    if temperature > max:
        max = temperature
        maxX = x
        maxY = y

    sum = sum + temperature
    count = count + 1

function finish():
    if count == 0:
        fail "empty region"

    return Stats(
        count,
        min, minX, minY,
        max, maxX, maxY,
        sum / count
    )
```

建议 Java 中使用 `double` 累加 `sum`，即使温度矩阵元素是 `float`。比较使用严格的 `<` 和 `>` 时，如果多个点温度相同，会保留按遍历顺序遇到的第一个坐标。

### 4.1 点分析

```text
validate x and y inside thermal matrix
add(x, y, temperatures[y * thermalWidth + x])
return finish()
```

点分析只有一个像素，因此 `min == max == avg`，最小值和最大值坐标也相同。

### 4.2 矩形分析

矩形包含四条边：

```text
left = clamp(min(x1, x2), 0, thermalWidth - 1)
right = clamp(max(x1, x2), 0, thermalWidth - 1)
top = clamp(min(y1, y2), 0, thermalHeight - 1)
bottom = clamp(max(y1, y2), 0, thermalHeight - 1)

for y from top through bottom:
    for x from left through right:
        add(x, y, temperatures[y * thermalWidth + x])

return finish()
```

例如 `(100,100)` 到 `(200,200)` 的像素数是：

```text
(200 - 100 + 1) * (200 - 100 + 1) = 10201
```

### 4.3 线分析

使用 Bresenham 算法生成离散温点：

```text
x = x1
y = y1
dx = abs(x2 - x1)
sx = 1 if x1 < x2 else -1
dy = -abs(y2 - y1)
sy = 1 if y1 < y2 else -1
error = dx + dy

loop:
    add(x, y, temperatures[y * thermalWidth + x])

    if x == x2 and y == y2:
        break

    e2 = 2 * error
    if e2 >= dy:
        error = error + dy
        x = x + sx
    if e2 <= dx:
        error = error + dx
        y = y + sy

return finish()
```

## 5. 坐标系统与缩放公式

页面中存在四层坐标：

1. 浏览器客户区坐标：`PointerEvent.clientX/clientY`。
2. Canvas 显示坐标：考虑 CSS 缩放后的 Canvas 像素。
3. 未旋转 JPG 坐标：范围由 `naturalWidth/naturalHeight` 决定。
4. 热图坐标：范围由 Java 返回的 `thermalWidth/thermalHeight` 决定。

单轴端点对齐公式：

```text
target = round(source * (targetSize - 1) / (sourceSize - 1))
```

这个公式保证：

- `0` 映射到 `0`。
- `sourceSize - 1` 映射到 `targetSize - 1`。
- 同尺寸映射保持 1:1。
- 尺寸为 `1` 时固定返回 `0`，避免除以零。

### 5.1 可复用 TypeScript 坐标模块

以下代码只使用标准 JavaScript，可直接放入 Vue 项目的 `src/utils/thermal-geometry.ts`。

```ts
export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function scalePixel(value: number, sourceSize: number, targetSize: number) {
  if (sourceSize <= 0 || targetSize <= 0) {
    throw new Error("image dimensions must be positive");
  }
  if (sourceSize === 1 || targetSize === 1) return 0;

  return Math.round(
    (clamp(value, 0, sourceSize - 1) * (targetSize - 1)) /
      (sourceSize - 1)
  );
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

export function displayToImage(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number
) {
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

export function imageToDisplay(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number
) {
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
```

旋转值约定：

- `0`：不旋转。
- `1`：顺时针 90 度。
- `2`：180 度。
- `3`：顺时针 270 度。

输入时必须先撤销旋转，再从 JPG 缩放到热图：

```ts
const imagePoint = displayToImage(
  displayX,
  displayY,
  previewWidth,
  previewHeight,
  rotation
);

const thermalPoint = scalePoint(
  imagePoint.x,
  imagePoint.y,
  previewWidth,
  previewHeight,
  thermalWidth,
  thermalHeight
);
```

绘制时顺序相反，先从热图缩放到 JPG，再应用旋转：

```ts
function thermalToDisplay(
  x: number,
  y: number,
  thermalSize: ImageSize,
  previewSize: ImageSize,
  rotation: number
) {
  const imagePoint = scalePoint(
    x,
    y,
    thermalSize.width,
    thermalSize.height,
    previewSize.width,
    previewSize.height
  );

  return imageToDisplay(
    imagePoint.x,
    imagePoint.y,
    previewSize.width,
    previewSize.height,
    rotation
  );
}
```

验证样例：`640 x 512` JPG 中的 `(439,182)` 映射到 `384 x 288` 热图的 `(263,102)`；反向映射回 JPG 仍为 `(439,182)`。

## 6. 从 PointerEvent 得到热图坐标

Canvas 的 CSS 显示尺寸可能与其内部像素尺寸不同，所以不能直接使用 `event.offsetX/offsetY` 作为最终坐标。

```ts
function pointerToThermal(
  event: PointerEvent,
  canvas: HTMLCanvasElement,
  displaySize: ImageSize,
  previewSize: ImageSize,
  thermalSize: ImageSize,
  rotation: number
) {
  const rect = canvas.getBoundingClientRect();

  const displayX = clamp(
    Math.round(
      ((event.clientX - rect.left) * displaySize.width) /
        Math.max(1, rect.width)
    ),
    0,
    displaySize.width - 1
  );

  const displayY = clamp(
    Math.round(
      ((event.clientY - rect.top) * displaySize.height) /
        Math.max(1, rect.height)
    ),
    0,
    displaySize.height - 1
  );

  const imagePoint = displayToImage(
    displayX,
    displayY,
    previewSize.width,
    previewSize.height,
    rotation
  );

  return scalePoint(
    imagePoint.x,
    imagePoint.y,
    previewSize.width,
    previewSize.height,
    thermalSize.width,
    thermalSize.height
  );
}
```

`displaySize` 在旋转 90 或 270 度时需要交换宽高：

```ts
const displaySize = rotation % 2 === 0
  ? previewSize
  : { width: previewSize.height, height: previewSize.width };
```

## 7. Java HTTP 请求适配器

下面是 Vue 可调用的普通 TypeScript 函数。URL 仍是模板。

```ts
export async function analyzeRegion(
  imageId: string,
  kind: Tool,
  region: Region
): Promise<Stats> {
  const response = await fetch(
    `/api/infrared/${encodeURIComponent(imageId)}/analyze`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, ...region })
    }
  );

  if (!response.ok) {
    throw new Error(`analysis failed: HTTP ${response.status}`);
  }

  return (await response.json()) as Stats;
}
```

如果目标项目已经使用 Axios，只替换这个函数。坐标和绘制模块不需要修改。

## 8. Canvas 绘制模块

### 8.1 温度格式化

```ts
function formatTemperature(value: number) {
  return `${value.toFixed(2)} C`;
}
```

如果项目源码统一使用 UTF-8，可将 `C` 改为 `℃`。

### 8.2 绘制旋转图片

```ts
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
```

### 8.3 绘制最高/最低点

```ts
function drawHotspot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  radius: number,
  label: string
) {
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
```

当前配色：

- 最高温点：红色 `#fb553c`，半径 7。
- 最低温点：青色 `#67e8f9`，半径 5。

### 8.4 绘制统计标签

```ts
function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  lines: string[]
) {
  ctx.save();
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

  const width = Math.max(
    ...lines.map((line) => ctx.measureText(line).width)
  ) + 18;
  const height = lines.length * 18 + 10;

  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fillStyle = "rgba(24,24,27,0.86)";
  ctx.fill();
  ctx.strokeStyle = "rgba(244,244,245,0.18)";
  ctx.stroke();

  ctx.fillStyle = "#f4f4f5";
  lines.forEach((line, index) => {
    ctx.fillText(line, x + 9, y + 20 + index * 18);
  });

  ctx.restore();
}
```

如果需要兼容不支持 `CanvasRenderingContext2D.roundRect` 的旧浏览器，可以换成项目内的圆角矩形路径函数，不需要引入依赖。

### 8.5 绘制区域统计

```ts
function drawRegionStats(
  ctx: CanvasRenderingContext2D,
  stats: Stats,
  regionStart: { x: number; y: number },
  regionEnd: { x: number; y: number },
  thermalSize: ImageSize,
  previewSize: ImageSize,
  rotation: number
) {
  const maxPoint = thermalToDisplay(
    stats.maxX,
    stats.maxY,
    thermalSize,
    previewSize,
    rotation
  );
  const minPoint = thermalToDisplay(
    stats.minX,
    stats.minY,
    thermalSize,
    previewSize,
    rotation
  );

  drawHotspot(ctx, maxPoint.x, maxPoint.y, "#fb553c", 7, "MAX");
  drawHotspot(ctx, minPoint.x, minPoint.y, "#67e8f9", 5, "MIN");

  const labelX = clamp(
    Math.min(regionStart.x, regionEnd.x) + 10,
    8,
    Math.max(8, ctx.canvas.width - 210)
  );
  const labelY = clamp(
    Math.min(regionStart.y, regionEnd.y) - 58,
    8,
    Math.max(8, ctx.canvas.height - 70)
  );

  drawLabel(ctx, labelX, labelY, [
    `MAX ${formatTemperature(stats.max)}`,
    `MIN ${formatTemperature(stats.min)}`,
    `AVG ${formatTemperature(stats.avg)}`
  ]);
}
```

### 8.6 绘制一个分析标记

```ts
function drawMark(
  ctx: CanvasRenderingContext2D,
  mark: Mark,
  thermalSize: ImageSize,
  previewSize: ImageSize,
  rotation: number,
  color = "#fbbf24"
) {
  const start = thermalToDisplay(
    mark.x1,
    mark.y1,
    thermalSize,
    previewSize,
    rotation
  );
  const end = thermalToDisplay(
    mark.x2,
    mark.y2,
    thermalSize,
    previewSize,
    rotation
  );

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 4;

  if (mark.kind === "line") {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  } else if (mark.kind === "rect") {
    ctx.strokeRect(
      Math.min(start.x, end.x),
      Math.min(start.y, end.y),
      Math.abs(end.x - start.x),
      Math.abs(end.y - start.y)
    );
  } else {
    ctx.beginPath();
    ctx.arc(end.x, end.y, 5, 0, Math.PI * 2);
    ctx.moveTo(end.x - 10, end.y);
    ctx.lineTo(end.x + 10, end.y);
    ctx.moveTo(end.x, end.y - 10);
    ctx.lineTo(end.x, end.y + 10);
    ctx.stroke();
  }

  if (mark.kind === "point") {
    drawLabel(ctx, end.x + 12, end.y - 16, [
      formatTemperature(mark.stats.avg)
    ]);
  } else {
    drawRegionStats(
      ctx,
      mark.stats,
      start,
      end,
      thermalSize,
      previewSize,
      rotation
    );
  }

  ctx.restore();
}
```

当前行为：

- 点分析只绘制十字和单点温度。
- 线分析绘制线段、最高点、最低点、最高/最低/平均温标签。
- 框分析绘制矩形、最高点、最低点、最高/最低/平均温标签。
- 全图统计通常显示在信息面板中。若需要在图片上显示全图极值点，可把全图 `Stats` 与完整热图边界传给同一个绘制流程。

## 9. Canvas 完整重绘

不要在旧画面上增量叠加。图片、旋转或标记变化时清空 Canvas 并完整重绘：

```ts
function redraw(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  marks: Mark[],
  thermalSize: ImageSize,
  previewSize: ImageSize,
  rotation: number
) {
  const displaySize = rotation % 2 === 0
    ? previewSize
    : { width: previewSize.height, height: previewSize.width };

  canvas.width = displaySize.width;
  canvas.height = displaySize.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111113";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawRotatedImage(
    ctx,
    image,
    rotation,
    displaySize.width,
    displaySize.height,
    previewSize.width,
    previewSize.height
  );

  for (const mark of marks) {
    drawMark(ctx, mark, thermalSize, previewSize, rotation);
  }
}
```

## 10. Vue 3 接入流程

下面只展示关键逻辑。状态管理可以使用组件内 `ref`，也可以放入现有 Pinia store。

### 10.1 模板

```vue
<template>
  <div class="thermal-viewer">
    <img
      ref="sourceImage"
      :src="imageUrl"
      alt=""
      hidden
      @load="onImageLoad"
    />

    <canvas
      ref="canvas"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
    />
  </div>
</template>
```

### 10.2 响应式状态

```ts
import { nextTick, ref, watch } from "vue";

const canvas = ref<HTMLCanvasElement | null>(null);
const sourceImage = ref<HTMLImageElement | null>(null);
const previewSize = ref<ImageSize | null>(null);
const thermalInfo = ref<ThermalImageInfo | null>(null);
const tool = ref<Tool>("rect");
const rotation = ref(0);
const marks = ref<Mark[]>([]);
const drag = ref<Region | null>(null);
```

### 10.3 图片加载

```ts
async function onImageLoad() {
  const image = sourceImage.value;
  if (!image || image.naturalWidth <= 0 || image.naturalHeight <= 0) return;

  previewSize.value = {
    width: image.naturalWidth,
    height: image.naturalHeight
  };

  await nextTick();
  repaint();
}
```

### 10.4 指针拖动

```ts
function currentThermalPoint(event: PointerEvent) {
  if (!canvas.value || !previewSize.value || !thermalInfo.value) {
    throw new Error("image is not ready");
  }

  const displaySize = rotation.value % 2 === 0
    ? previewSize.value
    : {
        width: previewSize.value.height,
        height: previewSize.value.width
      };

  return pointerToThermal(
    event,
    canvas.value,
    displaySize,
    previewSize.value,
    {
      width: thermalInfo.value.thermalWidth,
      height: thermalInfo.value.thermalHeight
    },
    rotation.value
  );
}

function onPointerDown(event: PointerEvent) {
  const point = currentThermalPoint(event);
  drag.value = {
    x1: point.x,
    y1: point.y,
    x2: point.x,
    y2: point.y
  };
}

function onPointerMove(event: PointerEvent) {
  if (!drag.value) return;
  const point = currentThermalPoint(event);
  drag.value = { ...drag.value, x2: point.x, y2: point.y };
}

async function onPointerUp(event: PointerEvent) {
  if (!drag.value || !thermalInfo.value) return;

  const point = currentThermalPoint(event);
  const region = { ...drag.value, x2: point.x, y2: point.y };
  drag.value = null;

  const stats = await analyzeRegion(
    thermalInfo.value.imageId,
    tool.value,
    region
  );

  marks.value.push({
    id: Date.now(),
    kind: tool.value,
    ...region,
    stats
  });
}
```

生产代码应在 `onPointerUp` 外层接入项目已有的 loading 和错误提示机制。

### 10.5 响应式重绘

```ts
function repaint() {
  if (
    !canvas.value ||
    !sourceImage.value ||
    !previewSize.value ||
    !thermalInfo.value
  ) return;

  redraw(
    canvas.value,
    sourceImage.value,
    marks.value,
    {
      width: thermalInfo.value.thermalWidth,
      height: thermalInfo.value.thermalHeight
    },
    previewSize.value,
    rotation.value
  );
}

watch(
  [marks, rotation, previewSize, thermalInfo],
  () => nextTick(repaint),
  { deep: true }
);
```

如果要在拖动过程中显示预览框，可以把 `drag` 也加入监听，并用临时颜色调用一个不含 `stats` 的区域轮廓绘制函数。

## 11. 信息面板展示

Vue 模板可直接显示后端返回值：

```vue
<dl v-if="selectedStats">
  <dt>像素数</dt>
  <dd>{{ selectedStats.count }}</dd>

  <dt>最低温</dt>
  <dd>
    {{ selectedStats.min.toFixed(2) }} C
    @ ({{ selectedStats.minX }}, {{ selectedStats.minY }})
  </dd>

  <dt>最高温</dt>
  <dd>
    {{ selectedStats.max.toFixed(2) }} C
    @ ({{ selectedStats.maxX }}, {{ selectedStats.maxY }})
  </dd>

  <dt>平均温</dt>
  <dd>{{ selectedStats.avg.toFixed(2) }} C</dd>
</dl>
```

这些坐标是热图坐标。界面文案应避免把它们称为 JPG 像素坐标。

## 12. 必须验证的场景

### 12.1 同尺寸

```text
JPG: 640 x 480
热图: 640 x 480
预期: 所有坐标保持 1:1
```

### 12.2 不同尺寸

```text
JPG: 640 x 512
热图: 384 x 288
热图最高点: (263,102)
预期 JPG 绘制点: (439,182)
```

### 12.3 边界

- JPG 左上角必须映射到热图左上角。
- JPG 右下角必须映射到热图右下角。
- 指针超出 Canvas 时必须 clamp 到有效边界。
- 任一尺寸小于等于 0 时必须拒绝映射。
- 任一轴尺寸为 1 时该轴坐标固定为 0。

### 12.4 旋转

- 输入顺序：显示坐标 -> 撤销旋转 -> JPG 坐标 -> 热图坐标。
- 输出顺序：热图坐标 -> JPG 坐标 -> 应用旋转 -> Canvas 坐标。
- 90/270 度时 Canvas 宽高交换。

### 12.5 统计值

可使用以下已验证样例值检查 Java 实现：

```text
全图: count=307200 min=-0.82@(308,25) max=49.65@(308,359) avg=10.22
点 320,240: count=1 min=20.63 max=20.63 avg=20.63
线 0,0 到 639,479: count=640 min=6.61@(129,97) max=22.85@(494,370) avg=10.66
框 100,100 到 200,200: count=10201 min=-0.76@(174,116) max=8.29@(100,182) avg=7.46
```

## 13. 最小移植清单

Java 后端：

1. 保持温度矩阵行优先索引 `y * width + x`。
2. 实现统一统计累加器。
3. 实现点、Bresenham 线、包含边界矩形的像素遍历。
4. 返回固定的 `Stats` JSON 字段。
5. 校验所有请求坐标和空区域。

Vue 前端：

1. 复制 TypeScript 数据类型。
2. 复制坐标模块。
3. 复制 Canvas 绘制函数。
4. 用现有 HTTP 客户端实现 `analyzeRegion`。
5. 从图片 `naturalWidth/naturalHeight` 获取 JPG 尺寸。
6. 从 Java 响应获取热图尺寸，绝不假定两者相同。
7. 在标记、旋转或图片变化后完整重绘 Canvas。

## 14. IRScope 源码对应位置

本文算法来自 IRScope `rust-version` 分支的以下实现：

- `src/lib/geometry.ts`：端点对齐缩放、旋转正反变换。
- `src/App.tsx`：指针坐标、分析请求、Canvas 重绘、极值点和标签绘制。
- `src/types.ts`：`Stats`、`ImageInfo`、`Mark` 数据结构。
- `src/lib/format.ts`：温度与统计结果格式化。
- `src/components/Inspector.tsx`：全图统计和分析列表展示。
- `src-tauri/src/ir.rs`：统计累加器、点/线/框算法。

移植到 Java + Vue 时需要保留的是数据契约、坐标顺序和绘制算法，不需要保留原项目的桌面桥接或组件状态写法。
