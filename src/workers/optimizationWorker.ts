/**
 * Optimization Web Worker for RadShield-MX
 * Offloads heavy calculations from the main thread:
 * - Shielding calculations (point kernel, transmission)
 * - Monte Carlo batch processing
 * - Heatmap computation
 * - Dose map generation
 */

// Point kernel dose calculation
function pointKernelDose(
  activity_Bq: number, gammaConstant: number, distance_m: number,
  shieldThicknesses: { material: string; tvl_cm: number; thickness_cm: number }[]
): { kerma_Gy_per_h: number; transmission: number; n_tvl: number } {
  const kerma = gammaConstant * activity_Bq / (distance_m * distance_m);
  let transmission = 1.0;
  let n_tvl = 0;
  for (const sh of shieldThicknesses) {
    const t = 10 ** (-sh.thickness_cm / sh.tvl_cm);
    transmission *= t;
    n_tvl += sh.thickness_cm / sh.tvl_cm;
  }
  return { kerma_Gy_per_h: kerma * transmission, transmission, n_tvl };
}

// Compute heatmap grid
function computeHeatmap(
  sources: Array<{ x: number; y: number; activity_Bq: number; gammaConstant: number }>,
  gridW: number, gridH: number, scale: number
): Float64Array {
  const data = new Float64Array(gridW * gridH);
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      let total = 0;
      const wx = gx * scale;
      const wy = gy * scale;
      for (const src of sources) {
        const d = Math.sqrt((wx - src.x) ** 2 + (wy - src.y) ** 2);
        if (d < 0.01) continue;
        total += src.gammaConstant * src.activity_Bq / (d * d);
      }
      data[gy * gridW + gx] = total;
    }
  }
  return data;
}

// Monte Carlo batch simulation (simplified)
function monteCarloBatch(
  numParticles: number, _sourceEnergy_MeV: number, shieldTVL_cm: number,
  shieldThickness_cm: number
): { meanTransmission: number; stdDev: number; particlesSimulated: number } {
  let sum = 0, sumSq = 0;
  for (let i = 0; i < numParticles; i++) {
    const r = Math.random();
    const transmitted = r < 10 ** (-shieldThickness_cm / shieldTVL_cm) ? 1 : 0;
    sum += transmitted;
    sumSq += transmitted * transmitted;
  }
  const mean = sum / numParticles;
  const variance = (sumSq / numParticles) - mean * mean;
  return { meanTransmission: mean, stdDev: Math.sqrt(variance / numParticles), particlesSimulated: numParticles };
}

self.onmessage = (event: MessageEvent) => {
  const { type, payload, id } = event.data;
  
  try {
    switch (type) {
      case 'pointKernel': {
        const result = pointKernelDose(
          payload.activity_Bq, payload.gammaConstant, payload.distance_m,
          payload.shieldThicknesses
        );
        self.postMessage({ id, type, result, status: 'success' });
        break;
      }
      case 'heatmap': {
        const result = computeHeatmap(payload.sources, payload.gridW, payload.gridH, payload.scale);
        self.postMessage({ id, type, result: Array.from(result), gridW: payload.gridW, gridH: payload.gridH, status: 'success' }, { transfer: [] });
        break;
      }
      case 'monteCarlo': {
        const result = monteCarloBatch(
          payload.numParticles, payload.sourceEnergy_MeV,
          payload.shieldTVL_cm, payload.shieldThickness_cm
        );
        self.postMessage({ id, type, result, status: 'success' });
        break;
      }
      case 'batchShielding': {
        const results = payload.barriers.map((b: any) => {
          let totalKerma = 0;
          for (const src of payload.sources) {
            const pk = pointKernelDose(src.activity_Bq, src.gammaConstant, b.distance_m, b.shields || []);
            totalKerma += pk.kerma_Gy_per_h;
          }
          return { barrierId: b.id, totalKerma_Gy_per_h: totalKerma, doseRate_uSv_per_h: totalKerma * 1e6 * 1.2 };
        });
        self.postMessage({ id, type, results, status: 'success' });
        break;
      }
      default:
        self.postMessage({ id, type, error: 'Unknown task type: ' + type, status: 'error' });
    }
  } catch (err: any) {
    self.postMessage({ id, type, error: err.message, status: 'error' });
  }
};

export {};
