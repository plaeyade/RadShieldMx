/**
 * ═══════════════════════════════════════════════════════════
 * Plan Analyzer — Computer Vision for Architectural Drawings
 * Canvas 2D + Canny Edge + Hough Transform (pure TypeScript)
 * Detects walls, doors, windows from floor plan images
 * ═══════════════════════════════════════════════════════════
 */

export interface DetectedBarrier {
  id: string;
  type: "wall" | "door" | "window" | "room";
  x1: number; y1: number;
  x2: number; y2: number;
  confidence: number; // 0-1
  thickness: number;  // pixels
  isHorizontal: boolean;
  lengthPx: number;
  label?: string;
}

export interface PlanAnalysis {
  barriers: DetectedBarrier[];
  rooms: Array<{ x: number; y: number; width: number; height: number; label?: string }>;
  dimensions: Array<{ x1: number; y1: number; x2: number; y2: number; value?: string }>;
  scaleEstimate: number; // pixels per meter
  imageWidth: number;
  imageHeight: number;
  processingTimeMs: number;
}

// ─── Grayscale conversion ───
function toGrayscale(imgData: ImageData): Uint8ClampedArray {
  const gray = new Uint8ClampedArray(imgData.width * imgData.height);
  for (let i = 0; i < imgData.data.length; i += 4) {
    gray[i / 4] = 0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2];
  }
  return gray;
}

// ─── Gaussian blur 5x5 ───
function gaussianBlur(gray: Uint8ClampedArray, w: number, h: number): Float32Array {
  const kernel = [1, 4, 7, 4, 1, 4, 16, 26, 16, 4, 7, 26, 41, 26, 7, 4, 16, 26, 16, 4, 1, 4, 7, 4, 1];
  const kernelSum = 273;
  const result = new Float32Array(w * h);
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      let sum = 0;
      for (let ky = -2; ky <= 2; ky++) {
        for (let kx = -2; kx <= 2; kx++) {
          sum += gray[(y + ky) * w + (x + kx)] * kernel[(ky + 2) * 5 + (kx + 2)];
        }
      }
      result[y * w + x] = sum / kernelSum;
    }
  }
  return result;
}

// ─── Sobel edge detection ───
function sobelEdges(blurred: Float32Array, w: number, h: number): { magnitude: Float32Array; direction: Float32Array } {
  const magnitude = new Float32Array(w * h);
  const direction = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const gx = -blurred[(y - 1) * w + (x - 1)] + blurred[(y - 1) * w + (x + 1)]
        - 2 * blurred[y * w + (x - 1)] + 2 * blurred[y * w + (x + 1)]
        - blurred[(y + 1) * w + (x - 1)] + blurred[(y + 1) * w + (x + 1)];
      const gy = -blurred[(y - 1) * w + (x - 1)] - 2 * blurred[(y - 1) * w + x] - blurred[(y - 1) * w + (x + 1)]
        + blurred[(y + 1) * w + (x - 1)] + 2 * blurred[(y + 1) * w + x] + blurred[(y + 1) * w + (x + 1)];
      magnitude[idx] = Math.sqrt(gx * gx + gy * gy);
      direction[idx] = Math.atan2(gy, gx);
    }
  }
  return { magnitude, direction };
}

// ─── Non-maximum suppression ───
function nonMaxSuppress(mag: Float32Array, dir: Float32Array, w: number, h: number): Uint8ClampedArray {
  const result = new Uint8ClampedArray(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const angle = (dir[idx] * 180) / Math.PI;
      const absAngle = ((angle % 180) + 180) % 180;
      let neighbor1 = 0, neighbor2 = 0;
      if ((absAngle >= 0 && absAngle < 22.5) || (absAngle >= 157.5)) {
        neighbor1 = mag[y * w + (x - 1)]; neighbor2 = mag[y * w + (x + 1)];
      } else if (absAngle >= 22.5 && absAngle < 67.5) {
        neighbor1 = mag[(y - 1) * w + (x + 1)]; neighbor2 = mag[(y + 1) * w + (x - 1)];
      } else if (absAngle >= 67.5 && absAngle < 112.5) {
        neighbor1 = mag[(y - 1) * w + x]; neighbor2 = mag[(y + 1) * w + x];
      } else {
        neighbor1 = mag[(y - 1) * w + (x - 1)]; neighbor2 = mag[(y + 1) * w + (x + 1)];
      }
      result[idx] = mag[idx] >= neighbor1 && mag[idx] >= neighbor2 ? Math.min(255, mag[idx]) : 0;
    }
  }
  return result;
}

// ─── Hysteresis thresholding ───
function hysteresisThreshold(edges: Uint8ClampedArray, w: number, h: number, low: number, high: number): Uint8ClampedArray {
  const result = new Uint8ClampedArray(w * h);
  const strong = 255, weak = 128;
  for (let i = 0; i < edges.length; i++) {
    if (edges[i] >= high) result[i] = strong;
    else if (edges[i] >= low) result[i] = weak;
  }
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (result[idx] === weak) {
        let hasStrongNeighbor = false;
        for (let dy = -1; dy <= 1 && !hasStrongNeighbor; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (result[(y + dy) * w + (x + dx)] === strong) { hasStrongNeighbor = true; break; }
          }
        }
        result[idx] = hasStrongNeighbor ? strong : 0;
      }
    }
  }
  return result;
}

// ─── Hough line transform ───
function houghLines(edges: Uint8ClampedArray, w: number, h: number, threshold: number = 80): Array<{ rho: number; theta: number; votes: number }> {
  const maxRho = Math.ceil(Math.sqrt(w * w + h * h));
  const thetaBins = 180;
  const rhoBins = maxRho * 2;
  const accumulator = new Int32Array(rhoBins * thetaBins);

  const edgePoints: Array<[number, number]> = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (edges[y * w + x] === 255) edgePoints.push([x, y]);
    }
  }

  for (const [x, y] of edgePoints) {
    for (let t = 0; t < thetaBins; t++) {
      const theta = (t * Math.PI) / thetaBins;
      const rho = x * Math.cos(theta) + y * Math.sin(theta);
      const rIdx = Math.round(rho) + maxRho;
      if (rIdx >= 0 && rIdx < rhoBins) accumulator[rIdx * thetaBins + t]++;
    }
  }

  const lines: Array<{ rho: number; theta: number; votes: number }> = [];
  for (let r = 0; r < rhoBins; r++) {
    for (let t = 0; t < thetaBins; t++) {
      const votes = accumulator[r * thetaBins + t];
      if (votes > threshold) {
        let isMax = true;
        for (let dr = -3; dr <= 3 && isMax; dr++) {
          for (let dt = -3; dt <= 3; dt++) {
            const nr = r + dr, nt = ((t + dt + thetaBins) % thetaBins);
            if (nr >= 0 && nr < rhoBins && (dr !== 0 || dt !== 0)) {
              if (accumulator[nr * thetaBins + nt] > votes) { isMax = false; break; }
            }
          }
        }
        if (isMax) lines.push({ rho: r - maxRho, theta: (t * Math.PI) / thetaBins, votes });
      }
    }
  }

  return lines.sort((a, b) => b.votes - a.votes).slice(0, 200);
}

// ─── Merge nearby parallel lines into walls ───
function linesToBarriers(lines: Array<{ rho: number; theta: number; votes: number }>, w: number, h: number): DetectedBarrier[] {
  const barriers: DetectedBarrier[] = [];
  const merged = new Set<number>();

  // Group by angle (horizontal vs vertical vs diagonal)
  const horizontal = lines.filter(l => {
    const deg = (l.theta * 180) / Math.PI;
    return (deg >= 0 && deg < 30) || (deg >= 150);
  });
  const vertical = lines.filter(l => {
    const deg = (l.theta * 180) / Math.PI;
    return deg >= 60 && deg < 120;
  });

  // Process horizontal lines (walls)
  for (let i = 0; i < horizontal.length; i++) {
    if (merged.has(i)) continue;
    const l1 = horizontal[i];
    const y1 = l1.rho / Math.sin(l1.theta || 0.01);

    // Find nearby parallel lines (wall thickness)
    let thickness = 3;
    for (let j = i + 1; j < horizontal.length && j < i + 5; j++) {
      if (merged.has(j)) continue;
      const l2 = horizontal[j];
      const y2 = l2.rho / Math.sin(l2.theta || 0.01);
      if (Math.abs(y2 - y1) < 15 && Math.abs(y2 - y1) > 2) {
        thickness = Math.abs(y2 - y1);
        merged.add(j);
        break;
      }
    }

    barriers.push({
      id: `wall-h-${i}`, type: "wall",
      x1: 0, y1: Math.round(y1), x2: w, y2: Math.round(y1),
      confidence: Math.min(1, l1.votes / 200),
      thickness: Math.round(thickness),
      isHorizontal: true, lengthPx: w,
      label: `Wall H${i}`,
    });
    merged.add(i);
  }

  // Process vertical lines
  for (let i = 0; i < vertical.length; i++) {
    if (merged.has(1000 + i)) continue;
    const l1 = vertical[i];
    const x1 = l1.rho / Math.cos(l1.theta || 0.01);

    let thickness = 3;
    for (let j = i + 1; j < vertical.length && j < i + 5; j++) {
      if (merged.has(1000 + j)) continue;
      const l2 = vertical[j];
      const x2 = l2.rho / Math.cos(l2.theta || 0.01);
      if (Math.abs(x2 - x1) < 15 && Math.abs(x2 - x1) > 2) {
        thickness = Math.abs(x2 - x1);
        merged.add(1000 + j);
        break;
      }
    }

    barriers.push({
      id: `wall-v-${i}`, type: "wall",
      x1: Math.round(x1), y1: 0, x2: Math.round(x1), y2: h,
      confidence: Math.min(1, l1.votes / 200),
      thickness: Math.round(thickness),
      isHorizontal: false, lengthPx: h,
      label: `Wall V${i}`,
    });
    merged.add(1000 + i);
  }

  return barriers;
}

// ─── Detect rooms from wall intersections ───
function detectRooms(barriers: DetectedBarrier[]): Array<{ x: number; y: number; width: number; height: number; label?: string }> {
  const hWalls = barriers.filter(b => b.isHorizontal).sort((a, b) => a.y1 - b.y1);
  const vWalls = barriers.filter(b => !b.isHorizontal).sort((a, b) => a.x1 - b.x1);

  const rooms: Array<{ x: number; y: number; width: number; height: number; label?: string }> = [];

  for (let i = 0; i < hWalls.length - 1; i++) {
    for (let j = 0; j < vWalls.length - 1; j++) {
      const y = hWalls[i].y1;
      const nextY = hWalls[i + 1].y1;
      const x = vWalls[j].x1;
      const nextX = vWalls[j + 1].x1;
      const roomH = nextY - y;
      const roomW = nextX - x;

      if (roomW > 50 && roomH > 50 && roomW < 800 && roomH < 800) {
        rooms.push({
          x: x + hWalls[i].thickness,
          y: y + hWalls[i].thickness,
          width: roomW - hWalls[i].thickness - vWalls[j].thickness,
          height: roomH - hWalls[i].thickness - hWalls[i + 1]?.thickness || 0,
          label: `Room ${rooms.length + 1}`,
        });
      }
    }
  }

  return rooms;
}

// ─── Estimate scale from common architectural patterns ───
function estimateScale(barriers: DetectedBarrier[]): number {
  // Typical wall thickness: 15-30cm. Find most common pixel thickness
  const thicknesses = barriers.map(b => b.thickness);
  if (thicknesses.length === 0) return 10; // default 10 px/m
  const avgThickness = thicknesses.reduce((a, b) => a + b, 0) / thicknesses.length;
  // Assume average wall ~20cm = 0.2m
  return avgThickness / 0.2;
}

// ─── Main analyze function ───
export async function analyzeFloorPlan(imageSource: HTMLImageElement | HTMLCanvasElement): Promise<PlanAnalysis> {
  const startTime = performance.now();

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const w = imageSource instanceof HTMLImageElement ? imageSource.naturalWidth : imageSource.width;
  const h = imageSource instanceof HTMLImageElement ? imageSource.naturalHeight : imageSource.height;

  // Resize for performance (max 1024px)
  const scale = Math.min(1, 1024 / Math.max(w, h));
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  ctx.drawImage(imageSource, 0, 0, canvas.width, canvas.height);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const gray = toGrayscale(imgData);
  const blurred = gaussianBlur(gray, canvas.width, canvas.height);
  const { magnitude, direction } = sobelEdges(blurred, canvas.width, canvas.height);
  const suppressed = nonMaxSuppress(magnitude, direction, canvas.width, canvas.height);

  // Auto-threshold using Otsu
  const high = computeOtsuThreshold(suppressed);
  const edges = hysteresisThreshold(suppressed, canvas.width, canvas.height, high * 0.4, high);

  const lines = houghLines(edges, canvas.width, canvas.height, Math.max(40, canvas.width / 20));
  const barriers = linesToBarriers(lines, canvas.width, canvas.height);
  const rooms = detectRooms(barriers);
  const scaleEstimate = estimateScale(barriers);

  return {
    barriers,
    rooms,
    dimensions: [],
    scaleEstimate,
    imageWidth: canvas.width,
    imageHeight: canvas.height,
    processingTimeMs: Math.round(performance.now() - startTime),
  };
}

// ─── Otsu threshold ───
function computeOtsuThreshold(data: Uint8ClampedArray): number {
  const histogram = new Uint32Array(256);
  for (let i = 0; i < data.length; i++) histogram[data[i]]++;

  const total = data.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];

  let sumB = 0, wB = 0, wF = 0;
  let maxVar = 0, threshold = 0;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;
    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const betweenVar = wB * wF * (mB - mF) * (mB - mF);
    if (betweenVar > maxVar) {
      maxVar = betweenVar;
      threshold = t;
    }
  }

  return threshold;
}

// ─── Draw results on canvas ───
export function drawAnalysisOverlay(
  canvas: HTMLCanvasElement,
  analysis: PlanAnalysis
): void {
  const ctx = canvas.getContext("2d")!;

  // Draw barriers
  for (const b of analysis.barriers) {
    ctx.strokeStyle = b.confidence > 0.7 ? "rgba(0,255,0,0.8)" : b.confidence > 0.4 ? "rgba(255,165,0,0.8)" : "rgba(255,0,0,0.6)";
    ctx.lineWidth = Math.max(2, b.thickness);
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();

    // Label
    ctx.fillStyle = "rgba(0,255,0,0.9)";
    ctx.font = "10px sans-serif";
    const mx = (b.x1 + b.x2) / 2;
    const my = (b.y1 + b.y2) / 2;
    ctx.fillText(b.label || "", mx + 5, my - 5);
  }

  // Draw rooms
  for (const r of analysis.rooms) {
    ctx.strokeStyle = "rgba(0,100,255,0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(r.x, r.y, r.width, r.height);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(0,100,255,0.7)";
    ctx.font = "11px sans-serif";
    ctx.fillText(r.label || "", r.x + 5, r.y + 15);
  }

  // Legend
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(10, 10, 200, 80);
  ctx.fillStyle = "white";
  ctx.font = "11px sans-serif";
  ctx.fillText(`Walls: ${analysis.barriers.length}`, 15, 28);
  ctx.fillText(`Rooms: ${analysis.rooms.length}`, 15, 44);
  ctx.fillText(`Scale: ${analysis.scaleEstimate.toFixed(1)} px/m`, 15, 60);
  ctx.fillText(`Time: ${analysis.processingTimeMs}ms`, 15, 76);
}

export function pxToMeters(px: number, scalePxPerM: number): number {
  return px / scalePxPerM;
}

export function metersToPx(m: number, scalePxPerM: number): number {
  return m * scalePxPerM;
}
