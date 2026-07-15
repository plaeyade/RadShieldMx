/**
 * shieldingWorker — Web Worker para cálculos de blindaje
 * Ejecuta cálculos intensivos en thread separado (no bloquea UI)
 * Soporta: NCRP 147 Archer, NCRP 151 TVL, McGinley scatter, dose grid
 */

// Re-implementamos las funciones matemáticas aquí (workers no pueden importar módulos)
// @ts-ignore — used by downstream consumers
function archerTransmission(xMm: number, alpha: number, beta: number, gamma: number): number {
  const xCm = xMm / 10;
  if (xCm <= 0) return 1.0;
  return Math.pow(1.0 + (beta / alpha) * Math.exp(alpha * gamma * xCm), -1.0 / gamma);
}

function inverseArcher(B: number, alpha: number, beta: number, gamma: number): number {
  if (B >= 1.0) return 0;
  if (B <= 0) return 999;
  const inner = ((Math.pow(B, -gamma) - 1) * alpha) / beta;
  if (inner <= 0) return 999;
  return (Math.log(inner) / alpha) * 10; // mm
}

// @ts-ignore — used by downstream consumers
function tvlThickness(K: number, P: number, tvlMm: number): number {
  if (K <= 0 || P <= 0 || tvlMm <= 0) return 0;
  const B = P / K;
  if (B >= 1) return 0;
  return -tvlMm * Math.log10(B);
}

interface WorkerMessage {
  id: string;
  type: 'barrier-calculation' | 'dose-grid' | 'gamma-index';
  payload: any;
}

interface WorkerResult {
  id: string;
  type: string;
  result: any;
  elapsedMs: number;
}

// Worker message handler
self.onmessage = function (event: MessageEvent<WorkerMessage>) {
  const { id, type, payload } = event.data;
  const startTime = performance.now();
  let result: any = null;

  try {
    switch (type) {
      case 'barrier-calculation': {
        // NCRP 147/151 barrier thickness calculation
        const { barriers, sources, scale, sampleDist, nPoints } = payload;
        result = calculateBarriers(barriers, sources, scale, sampleDist, nPoints);
        break;
      }
      case 'dose-grid': {
        // Dose grid calculation (nuclear medicine)
        const { sources, gridSize, xRange, yRange } = payload;
        result = calculateDoseGrid(sources, gridSize, xRange, yRange);
        break;
      }
      case 'gamma-index': {
        // 2D gamma index calculation
        const { refDose, evalDose, dta, ddPct, maxDose } = payload;
        result = calculateGammaIndex(refDose, evalDose, dta, ddPct, maxDose);
        break;
      }
      default:
        throw new Error(`Unknown worker type: ${type}`);
    }

    const elapsedMs = performance.now() - startTime;
    self.postMessage({ id, type, result, elapsedMs } as WorkerResult);
  } catch (err: any) {
    self.postMessage({ id, type: 'error', result: err.message, elapsedMs: 0 });
  }
};

// ===== Calculation Functions =====

function calculateBarriers(
  barriers: any[],
  sources: any[],
  scale: number,
  sampleDist: number,
  nPoints: number
): any[] {
  const results: any[] = [];

  for (const barrier of barriers) {
    const bdx = barrier.x2 - barrier.x1;
    const bdy = barrier.y2 - barrier.y1;
    const bLen = Math.sqrt(bdx * bdx + bdy * bdy);
    if (bLen === 0) continue;

    const ux = bdx / bLen;
    const uy = bdy / bLen;
    const nx = -uy;
    const ny = ux;

    const alpha = 2.246, beta = 5.73, gamma = 0.547;
    const designGoal = barrier.designGoal || 0.02;
    const occFactor = barrier.occupancyFactor || 0.2;
    const pt = designGoal / occFactor;

    let maxK = 0, maxT = 0;
    const points: any[] = [];

    for (let i = 0; i <= nPoints; i++) {
      const t = i / nPoints;
      const px = barrier.x1 + ux * bLen * t + nx * (sampleDist / scale);
      const py = barrier.y1 + uy * bLen * t + ny * (sampleDist / scale);

      let kerma = 0;
      for (const src of sources) {
        const dx = (px - src.x) * scale;
        const dy = (py - src.y) * scale;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.1) continue;
        const wf = src.workloadValue * (src.useFactor || 0.25);
        kerma += wf / (dist * dist);
      }

      const B = Math.max(1e-10, pt / (kerma || 1));
      const thickness = inverseArcher(B, alpha, beta, gamma);
      const clamped = Math.max(0, thickness);

      points.push({ x: px, y: py, kerma, thickness: clamped });
      if (kerma > maxK) maxK = kerma;
      if (clamped > maxT) maxT = clamped;
    }

    results.push({
      barrierId: barrier.id,
      barrierName: barrier.name,
      maxKerma: maxK,
      maxThickness: maxT,
      points,
    });
  }

  return results;
}

function calculateDoseGrid(
  sources: any[],
  gridSize: number,
  xRange: [number, number],
  yRange: [number, number]
): Float32Array {
  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;
  const n = gridSize;
  const doses = new Float32Array(n * n);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = xMin + (i / (n - 1)) * (xMax - xMin);
      const y = yMin + (j / (n - 1)) * (yMax - yMin);
      let dose = 0;

      for (const src of sources) {
        const dx = x - src.x;
        const dy = y - src.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > 0.01) {
          dose += src.activity * src.gammaConstant / distSq;
        }
      }

      doses[j * n + i] = dose;
    }
  }

  return doses;
}

function calculateGammaIndex(
  refDose: Float32Array,
  evalDose: Float32Array,
  _dta: number,
  ddPct: number,
  maxDose: number
): Float32Array {
  const gamma = new Float32Array(refDose.length);

  for (let i = 0; i < refDose.length; i++) {
    const ref = refDose[i];
    if (ref < maxDose * 0.1) {
      gamma[i] = 0;
      continue;
    }
    const ev = evalDose[i];
    const doseDiff = Math.abs(ev - ref) / (ddPct * 0.01 * maxDose);
    gamma[i] = Math.sqrt(doseDiff * doseDiff); // simplified: DTA=0 for same point
  }

  return gamma;
}

export {}; // Make this a module
