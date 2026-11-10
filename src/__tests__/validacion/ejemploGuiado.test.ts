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
      expect(t.PB).toBeGreaterThan(1);
      expect(t.PB).toBeLessThan(80);
    }
    // Al menos los muros hacia oficinas (T = 1, público) requieren blindaje.
    expect(out.filter((b) => Object.keys(b.requiredThickness_mm as object).length > 0).length).toBeGreaterThanOrEqual(3);
  });

  it('el kerma del muro norte de captación no es menor que TG-108 a la distancia mínima (conservador)', () => {
    const p = planoEjemploCompleto();
    const { result } = renderHook(() => useShieldingEngine());
    const out = result.current.calculateAllBarriers(p.barriers, p.sources, p.scale_m_per_pixel);
    const norte = out.find((b) => b.id === 'eg-captacion-norte')!;
    const fuente = p.sources[0];
    // Distancia del paciente (175,175; 1 m de altura) al punto de muestreo 0.3 m más allá del muro (y = 100).
    const dy = (175 - 100) * p.scale_m_per_pixel + 0.3;
    const dMin = Math.hypot(dy, 1.0);
    const tg = dosisSemanalTG108({ ...fuente.tg108!, nuclido: 'F18', d_m: dMin }) / 1000; // mSv/semana
    expect(norte.maxKerma!).toBeGreaterThanOrEqual(tg * 0.95);
  });
});
