/**
 * Fase 10: el ejemplo del asistente «Guíame» (PET/CT con captación) pasa por el mismo motor que el botón
 * Calcular (`useShieldingEngine().calculateAllBarriers`) y da espesores finitos y coherentes con TG-108.
 */
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useShieldingEngine } from '@/hooks/useShieldingEngine';
import {
  aplicarOcupacion, muestraFuentes, muestraParedes, planoEjemploCompleto, planoTieneContenido, planoVacio,
} from '@/lib/ejemploGuiado';
import { dosisSemanalTG108 } from '@/lib/tg108';

describe('Ejemplo guiado PET/CT (Fase 10)', () => {
  it('el plano vacío no tiene contenido y el ejemplo sí', () => {
    expect(planoTieneContenido(planoVacio())).toBe(false);
    expect(planoTieneContenido(planoEjemploCompleto())).toBe(true);
    expect(planoTieneContenido(null)).toBe(false);
  });

  it('las piezas por paso componen el ejemplo completo', () => {
    const p = planoEjemploCompleto();
    expect(p.barriers).toEqual(aplicarOcupacion(muestraParedes().barriers));
    expect(p.sources).toEqual(muestraFuentes());
    expect(p.barriers).toHaveLength(7);
    expect(p.sources.every((s) => s.tg108 && s.modality.id === 'pet-f18')).toBe(true);
  });

  it('el motor da kerma y espesores finitos en todos los muros', () => {
    const p = planoEjemploCompleto();
    const { result } = renderHook(() => useShieldingEngine());
    const out = result.current.calculateAllBarriers(p.barriers, p.sources, p.scale_m_per_pixel);
    for (const b of out) {
      expect(Number.isFinite(b.maxKerma)).toBe(true);
      expect(b.maxKerma!).toBeGreaterThan(0);
      const t = b.requiredThickness_mm as Record<string, number>;
      if (b.maxKerma! * b.occupancyFactor <= b.designGoal_mSv_per_wk) {
        // Sin blindaje necesario: el motor no publica espesores.
        expect(Object.keys(t)).toHaveLength(0);
        continue;
      }
      expect(Number.isFinite(t.PB)).toBe(true);
      expect(Number.isFinite(t.CONCRETE235)).toBe(true);
      // Orden de magnitud de PET a 511 keV: decenas de mm de plomo como mucho, nunca metros.
      expect(t.PB).toBeGreaterThan(0);
      expect(t.PB).toBeLessThan(80);
    }
    // Al menos los muros hacia oficinas (T = 1, público) requieren blindaje.
    expect(out.filter((b) => Object.keys(b.requiredThickness_mm as object).length > 0).length).toBeGreaterThanOrEqual(3);
  });

  it('muro norte de captación: kerma y espesores iguales a TG-108 a mano (Γ·0.64, Rₜ, curva de banda ancha de la Tabla V)', () => {
    const p = planoEjemploCompleto();
    const { result } = renderHook(() => useShieldingEngine());
    const out = result.current.calculateAllBarriers(p.barriers, p.sources, p.scale_m_per_pixel);
    const norte = out.find((b) => b.id === 'eg-captacion-norte')!;
    // A mano, sin el motor: F-18 Γ = 0.143 μSv·m²/(MBq·h), absorción 0.36, T½ = 109.77 min (TG-108 Tabla 1).
    const T12 = 109.77 / 60;
    const Rt = (t: number) => 1.443 * (T12 / t) * (1 - Math.exp((-0.693 * t) / T12));
    const gp = 0.143 * 0.64;
    // Paciente de captación (175,175) → punto 0.3 m al norte del muro (y = 100): d = 75 px · 0.02 + 0.3 = 1.8 m.
    const dCapt = 1.8;
    const capt = (gp * 30 * 370 * 1 * Rt(1)) / dCapt ** 2; // Ec. 2–3, μSv/semana
    // Paciente del PET/CT (375,200) al mismo punto (x = 175, y = 85): Ec. 9–10 con vaciado 0.85 y F_U.
    const dImg = Math.hypot((375 - 175) * 0.02, (200 - 85) * 0.02);
    const img = (gp * 30 * 370 * 0.85 * Math.exp((-0.693 * 1) / T12) * 0.5 * Rt(0.5)) / dImg ** 2;
    const D = capt + img; // ≈ 273.6 μSv/semana
    expect(capt).toBeCloseTo(261.0, 0);
    expect(norte.maxKerma! * 1000).toBeGreaterThan(D * 0.99);
    expect(norte.maxKerma! * 1000).toBeLessThan(D * 1.02);
    // B = P/(T·D) con P = 20 μSv/semana (público), T = 1; espesor de la curva de banda ancha de TG-108 (Tabla V, ajuste
    // de Archer): x = ln{[B^−γ + β/α]/[1 + β/α]}/(αγ). Antes un TVL único (Pb 16.6 mm, concreto 176 mm: 18.9 y 200 mm).
    const B = 20 / D;
    const x_mm = (a: number, b: number, g: number) => (10 * Math.log((B ** -g + b / a) / (1 + b / a))) / (a * g);
    const t = norte.requiredThickness_mm as Record<string, number>;
    expect(Math.abs(t.PB - x_mm(1.543, -0.4408, 2.136))).toBeLessThan(0.2); // ≈ 18.0 mm
    expect(Math.abs(t.CONCRETE235 - x_mm(0.1539, -0.1161, 2.0752))).toBeLessThan(2); // ≈ 216 mm
    // Contrapeso: no hay dosis del sintético comparada con TG-108 a la distancia 3D (receptor en el piso).
    const tgPiso = dosisSemanalTG108({ ...p.sources[0].tg108!, nuclido: 'F18', d_m: Math.hypot(1.8, 1.0) });
    expect(norte.maxKerma! * 1000).toBeGreaterThan(tgPiso * 1.2);
  });
});
