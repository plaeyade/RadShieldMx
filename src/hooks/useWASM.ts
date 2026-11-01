/**
 * useWASM — WebAssembly Module for Shielding Calculations (v45)
 * Recomendación #20/20: WASM para cálculos numéricos intensivos
 * Módulo custom 547 bytes con: inverse_archer, tvl_thickness, dose_from_source, gamma_index
 * Fallback a JS puro si WASM no disponible
 */
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export interface WASMInterface {
  inverseArcher: (B: number, alpha: number, beta: number, gamma: number) => number;
  tvlThickness: (K: number, P: number, tvl: number) => number;
  doseFromSource: (sx: number, sy: number, activity: number, px: number, py: number, gammaConst: number) => number;
  gammaIndex: (refDose: number, evalDose: number, ddPct: number, maxDose: number, dtaMm: number, distMm: number) => number;
  available: boolean;
}

// JS fallback implementations (pure JS, no WASM)
const jsFallback: WASMInterface = {
  inverseArcher: (B: number, alpha: number, beta: number, gamma: number): number => {
    if (B >= 1.0) return 0;
    if (B <= 0) return 999;
    const inner = ((Math.pow(B, -gamma) - 1) * alpha) / beta;
    if (inner <= 0) return 999;
    return (Math.log(inner) / alpha) * 10;
  },
  tvlThickness: (K: number, P: number, tvl: number): number => {
    if (K <= 0 || P <= 0 || tvl <= 0) return 0;
    const B = P / K;
    if (B >= 1) return 0;
    return -tvl * Math.log10(B);
  },
  doseFromSource: (sx: number, sy: number, activity: number, px: number, py: number, gammaConst: number): number => {
    const dx = px - sx, dy = py - sy;
    const distSq = dx * dx + dy * dy;
    if (distSq < 0.01) return 0;
    return gammaConst * activity / distSq;
  },
  gammaIndex: (refDose: number, evalDose: number, ddPct: number, maxDose: number, dtaMm: number, distMm: number): number => {
    const ddTerm = Math.abs(evalDose - refDose) / (ddPct * 0.01 * maxDose);
    const dtaTerm = distMm / dtaMm;
    return Math.sqrt(ddTerm * ddTerm + dtaTerm * dtaTerm);
  },
  available: false,
};

async function hasValidWasmHeader(response: Response): Promise<boolean> {
  const clone = response.clone();
  const header = new Uint8Array(await clone.arrayBuffer(), 0, 4);
  return header[0] === 0x00 && header[1] === 0x61 && header[2] === 0x73 && header[3] === 0x6d;
}

export function useWASM(): WASMInterface {
  const [wasm, setWasm] = useState<WASMInterface>(jsFallback);
  const instanceRef = useRef<WebAssembly.Instance | null>(null);

  useEffect(() => {
    const loadWASM = async () => {
      try {
        if (typeof WebAssembly !== 'object' || !WebAssembly.instantiateStreaming) {
          console.warn('WebAssembly not supported');
          return;
        }

        const response = await fetch('/wasm/shielding_math.wasm');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!(await hasValidWasmHeader(response))) {
          return;
        }

        const { instance } = await WebAssembly.instantiateStreaming(response, {
          env: {
            log: Math.log,
            exp: Math.exp,
            pow: Math.pow,
            sqrt: Math.sqrt,
          },
        });

        instanceRef.current = instance;
        const exports = instance.exports as Record<string, WebAssembly.ExportValue>;

        setWasm({
          inverseArcher: (B, alpha, beta, gamma) =>
            (exports.inverse_archer as Function)(B, alpha, beta, gamma),
          tvlThickness: (K, P, tvl) =>
            (exports.tvl_thickness as Function)(K, P, tvl),
          doseFromSource: (sx, sy, activity, px, py, gammaConst) =>
            (exports.dose_from_source as Function)(sx, sy, activity, px, py, gammaConst),
          gammaIndex: (refDose, evalDose, ddPct, maxDose, dtaMm, distMm) =>
            (exports.gamma_index as Function)(refDose, evalDose, ddPct, maxDose, dtaMm, distMm),
          available: true,
        });

        toast.success('WebAssembly accelerator loaded', {
          description: '547-byte module: inverseArcher, TVL, dose, gamma',
        });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.debug('WASM accelerator unavailable, using JavaScript fallback:', err);
        }
      }
    };

    loadWASM();
  }, []);

  return wasm;
}
