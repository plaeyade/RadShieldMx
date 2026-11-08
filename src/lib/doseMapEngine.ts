/**
 * Presentación de mallas de dosis (DoseMapDialog): mapas de color, isodosis por marching squares,
 * superficie 3D y estadísticas.
 *
 * Fase 3 (docs/plan-motores-calculo.md): este módulo ya NO calcula dosis. Se retiraron las tablas de
 * TVL propias (`TVL_PRIMARY_CONCRETE_MM`, …), `calculatePointDose` y `calculateDoseGrid` (W·U/d² con una
 * sola TVL por barrera, sin fuga ni dispersión, T aplicado al mapa y 1000 mSv fijos junto a la fuente).
 * Los valores salen de `calcularMallaRegular` (`doseFieldEngine`) y aquí sólo se convierten con
 * `resultadoDesdeMalla`. Unidades: kerma en mSv/semana, celdas en m.
 */
import type { MallaRegularDosis } from '@/lib/doseFieldEngine';

// ─── Color maps ────────────────────────────────────────────────────
export type ColorMap = 'jet' | 'viridis' | 'plasma' | 'inferno' | 'hot' | 'cool';

export const COLOR_MAPS: Record<ColorMap, [number, number, number][]> = {
  jet: [
    [0,0,0.5],[0,0,1],[0,0.5,1],[0,1,1],[0.5,1,0.5],[1,1,0],[1,0.5,0],[1,0,0],[0.5,0,0],
  ],
  viridis: [
    [0.267,0.004,0.329],[0.283,0.141,0.458],[0.254,0.265,0.529],[0.207,0.372,0.553],
    [0.163,0.471,0.558],[0.128,0.567,0.551],[0.135,0.659,0.518],[0.267,0.749,0.441],
    [0.478,0.821,0.318],[0.741,0.873,0.154],[0.993,0.906,0.144],
  ],
  plasma: [
    [0.05,0.03,0.53],[0.22,0.06,0.65],[0.38,0.12,0.65],[0.52,0.2,0.6],
    [0.65,0.3,0.55],[0.78,0.42,0.45],[0.88,0.55,0.35],[0.95,0.7,0.25],[0.98,0.85,0.15],[1,1,0.08],
  ],
  inferno: [
    [0.001,0.0,0.176],[0.1,0.03,0.3],[0.22,0.05,0.35],[0.35,0.08,0.35],
    [0.48,0.15,0.3],[0.6,0.25,0.22],[0.75,0.35,0.15],[0.88,0.5,0.1],[0.95,0.7,0.08],[0.98,0.9,0.2],
  ],
  hot: [
    [0.0,0.0,0.0],[0.3,0.0,0.0],[0.6,0.0,0.0],[0.9,0.0,0.0],
    [1.0,0.3,0.0],[1.0,0.6,0.0],[1.0,0.9,0.0],[1.0,1.0,0.3],[1.0,1.0,0.7],[1.0,1.0,1.0],
  ],
  cool: [
    [0.0,1.0,1.0],[0.0,0.9,0.95],[0.0,0.8,0.9],[0.0,0.7,0.85],
    [0.0,0.6,0.8],[0.0,0.5,0.75],[0.1,0.4,0.7],[0.3,0.3,0.65],[0.5,0.2,0.6],[0.7,0.1,0.55],
  ],
};

function lerpColor(a: [number,number,number], b: [number,number,number], t: number): [number,number,number] {
  return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
}

export function getColor(value: number, minVal: number, maxVal: number, cmap: ColorMap = 'jet'): [number, number, number] {
  const colors = COLOR_MAPS[cmap];
  const t = Math.max(0, Math.min(1, (value - minVal) / (maxVal - minVal || 1)));
  const idx = t * (colors.length - 1);
  const i0 = Math.floor(idx);
  const i1 = Math.min(i0 + 1, colors.length - 1);
  const f = idx - i0;
  return lerpColor(colors[i0], colors[i1], f);
}

// ─── Resultado de malla ─────────────────────────────────────────────
export interface DoseGridResult {
  grid: Float32Array; // width * height values in mSv/week
  width: number;
  height: number;
  cellSize_m: number;
  minDose: number;
  maxDose: number;
  contourLines: ContourLine[];
  calculationTime_ms: number;
}

export interface ContourLine {
  level: number;
  label: string;
  segments: [number, number, number, number][]; // [x1, y1, x2, y2] in grid coords
  color: string;
}

/**
 * Resultado de presentación a partir de una malla del motor de campo. `grid` conserva los valores del
 * motor (mSv/semana) en el mismo orden (iy·nx + ix); las isodosis se extraen sobre esos valores.
 */
export function resultadoDesdeMalla(malla: MallaRegularDosis, contourLevels: number[], calculationTime_ms = 0): DoseGridResult {
  let minDose = Infinity, maxDose = 0;
  for (const v of malla.valores) {
    if (!Number.isFinite(v)) continue;
    if (v < minDose) minDose = v;
    if (v > maxDose) maxDose = v;
  }
  if (!Number.isFinite(minDose)) minDose = 0;
  return {
    grid: malla.valores,
    width: malla.nx,
    height: malla.ny,
    cellSize_m: malla.paso_m,
    minDose,
    maxDose,
    contourLines: extractContours(malla.valores, malla.nx, malla.ny, contourLevels),
    calculationTime_ms,
  };
}

/**
 * Copia de presentación en escala log₁₀ (color y altura 3D): el campo cae como 1/d² y varía muchos
 * órdenes de magnitud. Las isodosis se conservan del resultado lineal. `piso` evita log(0).
 */
export function resultadoLogaritmico(res: DoseGridResult, piso = 1e-6): DoseGridResult {
  const tope = res.maxDose > 0 ? res.maxDose : piso;
  const grid = new Float32Array(res.grid.length);
  let minDose = Infinity, maxDose = -Infinity;
  for (let i = 0; i < res.grid.length; i++) {
    const v = res.grid[i];
    const w = Math.log10(Math.min(Math.max(Number.isFinite(v) ? v : tope, piso), tope));
    grid[i] = w;
    if (w < minDose) minDose = w;
    if (w > maxDose) maxDose = w;
  }
  return { ...res, grid, minDose, maxDose };
}

/**
 * Marching squares contour extraction.
 */
export function extractContours(
  grid: Float32Array, w: number, h: number, levels: number[]
): ContourLine[] {
  const lines: ContourLine[] = [];

  const CONTOUR_COLORS = ['#0066cc', '#339933', '#ff9900', '#ff3300', '#cc0000', '#990000'];

  for (let li = 0; li < levels.length; li++) {
    const level = levels[li];
    const segments: [number, number, number, number][] = [];

    for (let gy = 0; gy < h - 1; gy++) {
      for (let gx = 0; gx < w - 1; gx++) {
        // Four corners
        const tl = grid[gy * w + gx];
        const tr = grid[gy * w + gx + 1];
        const bl = grid[(gy + 1) * w + gx];
        const br = grid[(gy + 1) * w + gx + 1];

        // Case index (4-bit)
        let caseIdx = 0;
        if (tl >= level) caseIdx |= 8;
        if (tr >= level) caseIdx |= 4;
        if (br >= level) caseIdx |= 2;
        if (bl >= level) caseIdx |= 1;

        if (caseIdx === 0 || caseIdx === 15) continue;

        // Interpolation factors
        const top = tl === tr ? 0.5 : (level - tl) / (tr - tl);
        const right = tr === br ? 0.5 : (level - tr) / (br - tr);
        const bottom = bl === br ? 0.5 : (level - bl) / (br - bl);
        const left = tl === bl ? 0.5 : (level - tl) / (bl - tl);

        const addSeg = (x1: number, y1: number, x2: number, y2: number) => {
          segments.push([gx + x1, gy + y1, gx + x2, gy + y2]);
        };

        switch (caseIdx) {
          case 1: addSeg(0, left, bottom, 1); break;
          case 2: addSeg(bottom, 1, 1, right); break;
          case 3: addSeg(0, left, 1, right); break;
          case 4: addSeg(top, 0, 1, right); break;
          case 5: addSeg(0, left, top, 0); addSeg(bottom, 1, 1, right); break;
          case 6: addSeg(top, 0, bottom, 1); break;
          case 7: addSeg(0, left, bottom, 1); break;
          case 8: addSeg(0, left, top, 0); break;
          case 9: addSeg(top, 0, bottom, 1); break;
          case 10: addSeg(0, left, 1, right); break;
          case 11: addSeg(top, 0, 1, right); break;
          case 12: addSeg(0, left, 1, right); break;
          case 13: addSeg(1, right, bottom, 1); break;
          case 14: addSeg(0, left, top, 0); break;
        }
      }
    }

    if (segments.length > 0) {
      lines.push({
        level,
        label: `${level} mSv/sem`,
        segments,
        color: CONTOUR_COLORS[li % CONTOUR_COLORS.length],
      });
    }
  }

  return lines;
}

// ─── Canvas rendering ──────────────────────────────────────────────

/**
 * Render dose grid as color heatmap on canvas.
 */
export function renderDoseHeatmap(
  ctx: CanvasRenderingContext2D,
  result: DoseGridResult,
  canvasWidth: number,
  canvasHeight: number,
  cmap: ColorMap = 'jet',
  showContours: boolean = true
) {
  const { grid, width, height, minDose, maxDose, contourLines } = result;

  // Create ImageData
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const val = grid[y * width + x];
      const [r, g, b] = getColor(val, minDose, maxDose, cmap);
      const idx = (y * width + x) * 4;
      data[idx] = Math.round(r * 255);
      data[idx + 1] = Math.round(g * 255);
      data[idx + 2] = Math.round(b * 255);
      data[idx + 3] = 200; // alpha for overlay
    }
  }

  // Put pixel data
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  offscreen.getContext('2d')!.putImageData(imageData, 0, 0);

  // Scale to canvas
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(offscreen, 0, 0, canvasWidth, canvasHeight);

  // Draw contour lines
  if (showContours) {
    const scaleX = canvasWidth / width;
    const scaleY = canvasHeight / height;
    for (const contour of contourLines) {
      ctx.strokeStyle = contour.color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      for (const [x1, y1, x2, y2] of contour.segments) {
        ctx.moveTo(x1 * scaleX, y1 * scaleY);
        ctx.lineTo(x2 * scaleX, y2 * scaleY);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  }
}

// ─── Dose statistics ───────────────────────────────────────────────

export function calculateDoseStats(result: DoseGridResult) {
  const { grid, minDose, maxDose } = result;
  const n = grid.length;

  // Mean
  let sum = 0;
  for (let i = 0; i < n; i++) sum += grid[i];
  const mean = sum / n;

  // Percentiles
  const sorted = Array.from(grid).sort((a, b) => a - b);
  const p50 = sorted[Math.floor(n * 0.5)];
  const p95 = sorted[Math.floor(n * 0.95)];
  const p99 = sorted[Math.floor(n * 0.99)];

  // Areas above thresholds
  let above_0_02 = 0, above_0_1 = 0, above_0_5 = 0, above_1_0 = 0;
  for (let i = 0; i < n; i++) {
    if (grid[i] > 0.02) above_0_02++;
    if (grid[i] > 0.1) above_0_1++;
    if (grid[i] > 0.5) above_0_5++;
    if (grid[i] > 1.0) above_1_0++;
  }

  return {
    mean, min: minDose, max: maxDose,
    median: p50, p95, p99,
    areaAbove_0_02_mSv: above_0_02,
    areaAbove_0_1_mSv: above_0_1,
    areaAbove_0_5_mSv: above_0_5,
    areaAbove_1_0_mSv: above_1_0,
    totalCells: n,
  };
}

// ─── 3D mesh generation for Three.js ───────────────────────────────

export interface Dose3DMesh {
  vertices: Float32Array;
  indices: Uint32Array;
  colors: Float32Array;
  normals: Float32Array;
}

export function generateDose3DMesh(
  result: DoseGridResult,
  cmap: ColorMap = 'jet',
  heightScale: number = 0.05
): Dose3DMesh {
  const { grid, width, height, cellSize_m, minDose, maxDose } = result;
  const nVerts = width * height;
  const vertices = new Float32Array(nVerts * 3);
  const colors = new Float32Array(nVerts * 3);
  const normals = new Float32Array(nVerts * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const val = grid[idx];
      const [r, g, b] = getColor(val, minDose, maxDose, cmap);

      vertices[idx * 3] = x * cellSize_m;
      vertices[idx * 3 + 1] = (val - minDose) * heightScale; // altura ∝ (valor − mínimo)
      vertices[idx * 3 + 2] = y * cellSize_m;

      colors[idx * 3] = r;
      colors[idx * 3 + 1] = g;
      colors[idx * 3 + 2] = b;

      // Simple flat shading normal
      normals[idx * 3] = 0;
      normals[idx * 3 + 1] = 1;
      normals[idx * 3 + 2] = 0;
    }
  }

  // Triangle indices
  const nTriangles = (width - 1) * (height - 1) * 2;
  const indices = new Uint32Array(nTriangles * 3);
  let ti = 0;
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const i00 = y * width + x;
      const i10 = y * width + x + 1;
      const i01 = (y + 1) * width + x;
      const i11 = (y + 1) * width + x + 1;

      indices[ti++] = i00; indices[ti++] = i10; indices[ti++] = i11;
      indices[ti++] = i00; indices[ti++] = i11; indices[ti++] = i01;
    }
  }

  return { vertices, indices, colors, normals };
}
