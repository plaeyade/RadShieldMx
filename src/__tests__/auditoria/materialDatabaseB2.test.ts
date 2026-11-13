/**
 * Fase 11 — `lib/materialDatabase` contra NCRP 151 Tabla B.2 (primaria) y B.7 (fuga en concreto): las filas de concreto,
 * acero y plomo son las de la tabla; el resto no puede quedar por debajo del piso por masa (`pisoMasa`).
 */
import { describe, expect, it } from 'vitest';
import { FACTOR_W_PB, MATERIALS_DB, getMaterialById, getRecommendedMaterial, pisoMasa } from '@/lib/materialDatabase';
import { TABLA_B_2, TABLA_B_7 } from '@/lib/ncrp151';

const E = ['6MV', '10MV', '15MV', '18MV', '25MV', 'Co60'] as const;
const clave = (k: (typeof E)[number]) => (k === 'Co60' ? 'Co60' : k.replace('MV', ''));
const TABULADOS = ['concrete-normal-235', 'steel-normal', 'lead-cast', 'lead-sheet'];

describe('materialDatabase frente a NCRP 151 Tabla B.2', () => {
  it('concreto, acero y plomo = Tabla B.2 (TVL₁); fuga de concreto = Tabla B.7', () => {
    for (const k of E) {
      expect(getMaterialById('concrete-normal-235')!.TVL_primary_cm[k]).toBe(TABLA_B_2.concrete[clave(k)].tvl1_cm);
      expect(getMaterialById('concrete-normal-235')!.TVL_secondary_cm[k]).toBe(TABLA_B_7[clave(k)].tvl1_cm);
      expect(getMaterialById('steel-normal')!.TVL_primary_cm[k]).toBe(TABLA_B_2.steel[clave(k)].tvl1_cm);
      expect(getMaterialById('lead-cast')!.TVL_primary_cm[k]).toBe(TABLA_B_2.lead[clave(k)].tvl1_cm);
    }
  });

  it('sólo los materiales de la Tabla B.2 quedan como referencia NCRP 151', () => {
    expect(MATERIALS_DB.filter((m) => m.isNCRP151).map((m) => m.id).sort()).toEqual(['concrete-normal-235', 'lead-cast', 'steel-normal']);
  });

  it('ningún TVL por debajo del piso por masa (envolvente concreto/acero; tungsteno por plomo)', () => {
    for (const m of MATERIALS_DB) {
      if (TABULADOS.includes(m.id)) continue;
      for (const k of E) {
        for (const tipo of ['primary', 'secondary'] as const) {
          const v = (tipo === 'primary' ? m.TVL_primary_cm : m.TVL_secondary_cm)[k];
          const piso = pisoMasa(m, k, tipo);
          if (v === null || piso === null) continue;
          expect(v, `${m.id} ${k} ${tipo}`).toBeGreaterThanOrEqual(piso);
        }
      }
    }
    // Casos corregidos.
    expect(getMaterialById('concrete-barite-335')!.TVL_secondary_cm['6MV']).toBeCloseTo((34 * 2.35) / 3.35, 1);
    expect(getMaterialById('tungsten')!.TVL_primary_cm.Co60).toBeCloseTo((4.0 * 11.34 * 1.054) / 17, 2);
  });

  it('tungsteno: factor por masa frente al plomo = máximo de (µ/ρ)_Pb/(µ/ρ)_W de NIST SRD 126 en 1.25–20 MeV', () => {
    // [E (MeV), µ/ρ Pb, µ/ρ W] (cm²/g), NIST X-Ray Mass Attenuation Coefficients, z82 y z74.
    const nist: [number, number, number][] = [
      [1.25, 0.05876, 0.05577], [1.5, 0.05222, 0.05], [2, 0.04606, 0.04433], [3, 0.04234, 0.04075], [4, 0.04197, 0.04038],
      [6, 0.04391, 0.0421], [10, 0.04972, 0.04747], [20, 0.06206, 0.05893],
    ];
    const max = Math.max(...nist.map(([, pb, w]) => pb / w));
    expect(FACTOR_W_PB).toBeGreaterThanOrEqual(+max.toFixed(3));
    for (const [, pb, w] of nist) expect(pb / w).toBeGreaterThan(1); // el W no es conservador por masa sin el factor
    const w = getMaterialById('tungsten')!;
    for (const k of E) expect(w.TVL_primary_cm[k]!).toBeGreaterThanOrEqual((TABLA_B_2.lead[clave(k)].tvl1_cm * 11.34 * max) / 17 - 0.005);
  });

  it('getRecommendedMaterial: espesor equivalente al mismo número de TVL que el concreto', () => {
    const r = getRecommendedMaterial(74, 6); // 2 TVL de concreto a 6 MV
    expect(r.find((x) => x.material.id === 'lead-cast')!.actualThickness).toBeCloseTo(2 * 5.7, 9);
    expect(r.find((x) => x.material.id === 'concrete-normal-235')!.actualThickness).toBeCloseTo(74, 9);
  });
});
