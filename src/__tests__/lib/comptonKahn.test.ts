import { describe, expect, it } from 'vitest';
import { comptonScatter } from '@/lib/nativeMCEngine';

// Media de cosθ de Klein-Nishina por integración numérica (dσ/dΩ ∝ P²(P + 1/P − sin²θ)).
function mediaKN(alpha: number): number {
  let num = 0, den = 0;
  const n = 20000;
  for (let i = 0; i < n; i++) {
    const mu = -1 + (2 * (i + 0.5)) / n;
    const P = 1 / (1 + alpha * (1 - mu));
    const w = P * P * (P + 1 / P - (1 - mu * mu));
    num += mu * w; den += w;
  }
  return num / den;
}

function lcg(seed: number) {
  let s = seed >>> 0;
  return { random: () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) + 0.5) / 4294967296 };
}

describe('Compton (Kahn) contra Klein-Nishina', () => {
  for (const E of [0.1, 0.511, 1.25, 6]) {
    it(`E = ${E} MeV: media de cosθ y energía coherentes`, () => {
      const rng = lcg(12345);
      let suma = 0;
      let fuera = 0;
      const N = 200000;
      for (let i = 0; i < N; i++) {
        const { cosTheta, E_prime } = comptonScatter(rng, E);
        if (cosTheta < -1 - 1e-12 || cosTheta > 1 + 1e-12 || E_prime > E) fuera++;
        suma += cosTheta;
      }
      expect(fuera).toBe(0);
      expect(Math.abs(suma / N - mediaKN(E / 0.511))).toBeLessThan(0.006);
    }, 20000);
  }
});
