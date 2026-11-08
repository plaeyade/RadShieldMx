import { describe, expect, it } from 'vitest';
import { densidadDiseno, revisarCertificado, tvlCotaAcero, tvlDisenoHD, TVL_INFORMADO } from '@/lib/ininBloquesHD';
import { MATERIALS_DB } from '@/lib/materialDatabase';

describe('Bloques HD TM NIPOL (ININ LSCD-589/TD/2024)', () => {
  it('TVL de diseño = concreto NCRP 151 escalado por masa', () => {
    expect(tvlDisenoHD(5.5, '18')).toEqual({ tvl1_cm: 19.2, tvle_cm: 18.4 });
    expect(tvlDisenoHD(5.0, '6')).toEqual({ tvl1_cm: 17.4, tvle_cm: 15.5 });
    expect(tvlDisenoHD(2.35, 'Co60').tvle_cm).toBe(21);
  });

  it('el diseño nunca es menos conservador que lo medido', () => {
    for (const d of [3.5, 4.0, 5.0] as const)
      for (const e of ['Co60', '6', '18'] as const) expect(tvlDisenoHD(d, e).tvle_cm).toBeGreaterThanOrEqual(TVL_INFORMADO[d][e].tvl);
  });

  it('detecta TVL medidos por debajo de la cota del acero a igual masa', () => {
    expect(tvlCotaAcero(5.0, '18')).toBe(17.3);
    const h = revisarCertificado();
    expect(h.filter((x) => x.nivel === 'bloquea').length).toBeGreaterThanOrEqual(6);
    expect(h.some((x) => x.texto.includes('5.5 g/cm³'))).toBe(true);
    expect(h.some((x) => x.texto.includes('5.80') && x.texto.includes('5.97'))).toBe(true);
  });

  it('densidad de diseño = masa específica seca IMCYC', () => {
    expect(densidadDiseno(5.0).rho).toBe(3.99);
    expect(densidadDiseno(5.5).rho).toBe(5.5);
    expect(revisarCertificado().some((x) => x.texto.includes('IMCYC midió 3.99'))).toBe(true);
  });

  it('el catálogo incluye 3.5, 4.0, 5.0 y 5.5 con TVL por masa', () => {
    const hd = MATERIALS_DB.filter((m) => m.manufacturer === 'TM NIPOL (México)');
    expect(hd.map((m) => m.density_g_cm3)).toEqual([3.32, 3.68, 3.99, 5.5]);
    expect(hd[3].TVL_primary_cm['18MV']).toBe(19.2);
  });
});
