/**
 * Fase 13 — salas nuevas (Gamma Knife Icon, Biograph Trinion PET/CT y Elekta Studio HDR): núcleo `barreraSala`,
 * términos fuente con sus fuentes citadas y espesores del diseño del proyecto (perímetros a límite de público).
 */
import { describe, expect, it } from 'vitest';
import {
  CARGAS_PROYECTO, DENSIDAD_SALA, EDIFICIO, GAMMA_AKR_IR192, GAMMA_KNIFE_ICON, MURO_INTERIOR_LABERINTO_HDR_cm,
  P_ZONA_mSv_semana, REQUISITOS_PASILLO_LABERINTO_HDR, TVL_IR192_SRS47_cm, barreraSala, dTecho, disenoProyecto, salasProyecto, terminoHDR, terminoLaberinto, terminoPET, terminoTC, terminosGammaKnife,
  transmision511, transmisionCo60, transmisionIr192, transmisionTCkVp,
} from '@/lib/salasGkPetHdr';
import { dosisSemanalTG108 } from '@/lib/tg108';
import { transmisionTG108 } from '@/lib/transmisionTG108';
import { MATERIALS, MODALITIES } from '@/types/radshield';
import { COMMERCIAL_EQUIPMENT } from '@/types/equipmentDB';
import { P_CONTROLADA_mSv_semana, P_NO_CONTROLADA_mSv_semana } from '@/lib/limitesDosis';

const P = P_NO_CONTROLADA_mSv_semana;

describe('curvas de transmisión', () => {
  it('Co-60: un TVL de NCRP 151 Tabla B.2 (concreto 21, plomo 4.0, acero 7.0 cm) da 0.1', () => {
    expect(transmisionCo60('concrete', 21)).toBeCloseTo(0.1, 10);
    expect(transmisionCo60('lead', 4)).toBeCloseTo(0.1, 10);
    expect(transmisionCo60('steel', 7)).toBeCloseTo(0.1, 10);
    // Baritado por equivalencia másica: 21 · 2.35/3.5 cm.
    expect(transmisionCo60('barite', (21 * 2.35) / DENSIDAD_SALA.barite)).toBeCloseTo(0.1, 10);
  });

  it('Ir-192: TVL de IAEA SRS-47 iguales a los del catálogo de materiales', () => {
    const tvl = (code: string) => MATERIALS.find((m) => m.code === code)!.TVL_mm!.Ir192 / 10;
    expect(TVL_IR192_SRS47_cm.concrete).toBe(tvl('CONCRETE235'));
    expect(TVL_IR192_SRS47_cm.lead).toBe(tvl('PB'));
    expect(TVL_IR192_SRS47_cm.steel).toBe(tvl('STEEL'));
    expect(transmisionIr192('concrete', 15.2)).toBeCloseTo(0.1, 10);
  });

  it('511 keV usa TG-108 Tabla V (plomo 10 mm → 0.2485) y kV las Figs. A.2/A.3 de NCRP 147', () => {
    expect(transmision511('lead', 1)).toBeCloseTo(transmisionTG108('lead', 10), 12);
    expect(transmision511('lead', 1)).toBeCloseTo(0.2485, 3);
    expect(transmisionTCkVp(140)('lead', 0.2)).toBeLessThan(transmisionTCkVp(140)('concrete', 0.2));
    // Con la misma masa, el baritado (como concreto) no atenúa más que el concreto: conservador en kV.
    expect(transmisionTCkVp(120)('barite', 10)).toBeCloseTo(transmisionTCkVp(120)('concrete', (10 * 3.5) / 2.35), 12);
  });
});

describe('términos fuente', () => {
  it('Gamma Knife Icon: 192 fuentes, ≤ 6600 Ci (NRC ML23038A070) y K = Σ horas × tasa (McDermott 2007, Ec. 6)', () => {
    expect(GAMMA_KNIFE_ICON.fuentes).toBe(192);
    expect(GAMMA_KNIFE_ICON.actividadMaxima_Ci).toBe(6600);
    const t = terminosGammaKnife('frontal', { horasTratamiento_semana: 10, horasReposo_semana: 40 });
    expect(t[0].K1m_uSv_m2_semana).toBe(10 * 3100);
    expect(t[1].K1m_uSv_m2_semana).toBe(40 * 5);
    // Tasa frontal: 240 μSv/h (Elekta, fuentes nuevas) a 3.4 m, llevada a 6600 Ci con el factor 1.1.
    expect(GAMMA_KNIFE_ICON.tasaTratamiento_uSv_m2_h.frontal).toBeCloseTo(240 * 3.4 * 3.4 * 1.1, -2);
  });

  it('el perfil del Icon en la base de equipos dice 192 fuentes', () => {
    expect(COMMERCIAL_EQUIPMENT.find((e) => e.model === 'Leksell Gamma Knife Icon')!.maxFieldSize_cm).toContain('192');
  });

  it('HDR: Γδ del catálogo (0.111 μGy·m²/(MBq·h)); 10 Ci dan ≈ 41 mGy/h a 1 m', () => {
    expect(MODALITIES.find((m) => m.id === 'hdr-192ir')!.doseRateConstant).toBe(GAMMA_AKR_IR192);
    const t = terminoHDR({ actividad_Ci: 10, horasSemana: 2 });
    expect(t.tasa1m_uSv_m2_h).toBeCloseTo(0.111 * 370000, 6);
    expect(t.K1m_uSv_m2_semana).toBeCloseTo(2 * 0.111 * 370000, 6);
  });

  it('PET: el término a 1 m es TG-108 Ec. 9–10 a 1 m; TC: κ·DLP de NCRP 147 §5.6.1', () => {
    const e = CARGAS_PROYECTO.pet;
    expect(terminoPET(e).K1m_uSv_m2_semana).toBeCloseTo(dosisSemanalTG108({ ...e, d_m: 1 }), 12);
    expect(terminoTC('x', { estudiosSemana: 1, DLP_mGy_cm: 1000, factor: 1, kvp: 120, region: 'cuerpo' }).K1m_uSv_m2_semana).toBeCloseTo(360, 9);
  });

  it('laberinto: dispersión simple K₁·α·A/(dᵢ²·d_r²)', () => {
    const t = terminoLaberinto({ K1m_uSv_m2_semana: 1e5, tasa1m_uSv_m2_h: 1e4, alfa: 0.03, A_m2: 4, d_i_m: 2, d_r_m: 5 }, transmisionIr192);
    expect(t.K1m_uSv_m2_semana).toBeCloseTo((1e5 * 0.03 * 4) / (4 * 25), 9);
  });
});

describe('barreraSala', () => {
  it('un término, distancia fija: reproduce B = P/(T·K) y n TVL', () => {
    // K = 2000 μSv/semana a 1 m, P = 20 μSv/semana → B = 0.01 → 2 TVL de concreto (42 cm).
    const r = barreraSala({ terminos: [{ nombre: 'x', K1m_uSv_m2_semana: 2000, curva: transmisionCo60 }], material: 'concrete', P_mSv_semana: P, T: 1, dFija_m: 1 });
    expect(r.espesor_cm).toBeCloseTo(42, 4);
    expect(r.espesorRedondeado_cm).toBe(42);
    expect(r.cumple).toBe(true);
  });

  it('muro: el punto queda a d_interior + t + 0.3 m y la solución es la mínima que cumple', () => {
    const term = [{ nombre: 'x', K1m_uSv_m2_semana: 1e5, curva: transmisionIr192 }];
    const r = barreraSala({ terminos: term, material: 'concrete', P_mSv_semana: P, T: 1, dInterior_m: 2 });
    expect(r.d_m).toBeCloseTo(2 + r.espesorRedondeado_cm / 100 + 0.3, 9);
    const d = 2 + r.espesor_cm / 100 + 0.3;
    expect((1e5 * transmisionIr192('concrete', r.espesor_cm)) / (d * d)).toBeCloseTo(20, 4);
  });

  it('dos términos: el espesor combinado supera al de cada término solo', () => {
    const pet = terminoPET(CARGAS_PROYECTO.pet);
    const tc = terminoTC('TC', CARGAS_PROYECTO.petTC);
    const s = (t: typeof pet[]) => barreraSala({ terminos: t, material: 'concrete', P_mSv_semana: P, T: 1, dInterior_m: 2.5 }).espesor_cm;
    expect(s([pet, tc])).toBeGreaterThan(s([pet]));
    expect(s([pet, tc])).toBeGreaterThan(s([tc]));
  });

  it('sin blindaje necesario devuelve 0', () => {
    const r = barreraSala({ terminos: [{ nombre: 'x', K1m_uSv_m2_semana: 1, curva: transmisionCo60 }], material: 'lead', P_mSv_semana: P, T: 1, dFija_m: 1 });
    expect(r.espesorRedondeado_cm).toBe(0);
  });
});

describe('diseño del proyecto (público en todos los perímetros, sin sótanos, PB 5.40 m)', () => {
  const fila = (sala: string, barrera: string, material: string) =>
    disenoProyecto().find((f) => f.sala === sala && f.barrera === barrera && f.material === material)!.resultado.espesorRedondeado_cm;

  it('techo: punto a 0.5 m sobre el piso de N1 (+5.90 m)', () => {
    expect(EDIFICIO.alturaPB_m).toBe(5.4);
    expect(EDIFICIO.sotanos).toBe(0);
    expect(dTecho(1)).toBeCloseTo(4.9, 12);
  });

  it('todas las barreras cumplen T·K ≤ P con el espesor redondeado', () => {
    const d = disenoProyecto();
    expect(d.length).toBeGreaterThan(40);
    for (const f of d) expect(f.resultado.cumple, `${f.sala}/${f.barrera}/${f.material}`).toBe(true);
  });

  it('Gamma Knife Icon: frontal 46, laterales 21, trasero 17, techo 14 cm de concreto; puerta 39 mm de Pb', () => {
    expect(fila('gk', 'frontal', 'concrete')).toBe(46);
    expect(fila('gk', 'frontal', 'lead')).toBeCloseTo(9, 9);
    expect(fila('gk', 'lateral', 'concrete')).toBe(21);
    expect(fila('gk', 'trasero', 'concrete')).toBe(17);
    expect(fila('gk', 'techo', 'concrete')).toBe(14);
    expect(fila('gk', 'puerta', 'lead')).toBeCloseTo(3.9, 9);
    expect(fila('gk', 'puertaT5', 'lead')).toBeCloseTo(1.2, 9);
  });

  it('PET/CT Trinion: 17 / 9 / 15 / 11 cm de concreto; ventana 9 mm de Pb', () => {
    expect(fila('pet', 'trasero', 'concrete')).toBe(17);
    expect(fila('pet', 'frontal', 'concrete')).toBe(9);
    expect(fila('pet', 'lateral', 'concrete')).toBe(15);
    expect(fila('pet', 'techo', 'concrete')).toBe(11);
    expect(fila('pet', 'ventana', 'lead')).toBeCloseTo(0.9, 9);
  });

  it('HDR Studio: 45 / 47 cm de muros, laberinto 24 (controlada; se construyen 34) + 40 cm, techo 42 cm; puerta 6 mm de Pb', () => {
    expect(fila('hdr', 'oe', 'concrete')).toBe(45);
    expect(fila('hdr', 'norte', 'concrete')).toBe(47);
    expect(fila('hdr', 'laberinto', 'concrete')).toBe(24);
    expect(fila('hdr', 'laberinto', 'barite')).toBe(16);
    expect(fila('hdr', 'laberinto', 'lead')).toBeCloseTo(2.6, 9);
    expect(MURO_INTERIOR_LABERINTO_HDR_cm).toBe(34);
    expect(fila('hdr', 'labext', 'concrete')).toBe(40);
    expect(fila('hdr', 'labext', 'barite')).toBe(28);
    expect(fila('hdr', 'techo', 'concrete')).toBe(42);
    expect(fila('hdr', 'puerta', 'lead')).toBeCloseTo(0.6, 9);
  });

  it('las salas caben en la PB: techo bajo la losa de N1 y equipos dentro del interior', () => {
    for (const s of salasProyecto()) {
      const techo = disenoProyecto().find((f) => f.sala === s.id && f.barrera === 'techo' && f.material === 'concrete')!.resultado.espesorRedondeado_cm;
      expect(EDIFICIO.alturaPB_m - techo / 100).toBeGreaterThan(3);
      expect(s.fuente_m[0]).toBeLessThan(s.interior_m[0]);
      expect(s.fuente_m[1]).toBeLessThan(s.interior_m[1]);
    }
  });
});

describe('pasillo del laberinto HDR = zona controlada (decisión del propietario 24-11-2026)', () => {
  const d = disenoProyecto();
  const lab = d.filter((f) => f.sala === 'hdr' && f.barrera === 'laberinto');

  it('el pasillo usa P de área controlada (0.1 mSv/semana, NCRP 147/151) de limitesDosis.ts, con T = 1/8', () => {
    expect(P_ZONA_mSv_semana.controlada).toBe(P_CONTROLADA_mSv_semana);
    expect(P_CONTROLADA_mSv_semana).toBe(0.1);
    expect(lab).toHaveLength(3);
    const hdr = salasProyecto().find((s) => s.id === 'hdr')!.barreras.find((b) => b.id === 'laberinto')!;
    expect(hdr.T).toBe(1 / 8);
    for (const f of lab) {
      expect(f.zona).toBe('controlada');
      expect(f.P_mSv_semana).toBe(P_CONTROLADA_mSv_semana);
      expect(f.resultado.dosisOcupacion_uSv_semana).toBeLessThanOrEqual(P_CONTROLADA_mSv_semana * 1000);
    }
  });

  it('todos los demás puntos siguen a límite de público (0.02 mSv/semana)', () => {
    const resto = d.filter((f) => !(f.sala === 'hdr' && f.barrera === 'laberinto'));
    expect(resto.length).toBe(d.length - 3);
    for (const f of resto) {
      expect(f.zona, `${f.sala}/${f.barrera}`).toBe('publico');
      expect(f.P_mSv_semana).toBe(P_NO_CONTROLADA_mSv_semana);
      expect(f.resultado.dosisOcupacion_uSv_semana).toBeLessThanOrEqual(P_NO_CONTROLADA_mSv_semana * 1000 * (1 + 1e-9));
    }
  });

  it('señalización, acceso restringido y prohibición de paso de público y de pacientes no acompañados', () => {
    const r = lab[0].requisitos!;
    expect(r).toBe(REQUISITOS_PASILLO_LABERINTO_HDR);
    const txt = r.join(' ');
    expect(txt).toMatch(/señal/i);
    expect(txt).toMatch(/[Aa]cceso restringido/);
    expect(txt).toMatch(/no puede ser paso de público ni de pacientes no acompañados/);
    expect(lab[0].nota).toMatch(/24-11-2026/);
    expect(lab[0].nota).toMatch(/Cyclotron-SIM #38/);
  });

  it('se construyen 34 cm: no se adelgaza al analítico de zona controlada y cubre el MC preliminar (#38)', () => {
    const conc = lab.find((f) => f.material === 'concrete')!;
    expect(MURO_INTERIOR_LABERINTO_HDR_cm).toBeGreaterThanOrEqual(conc.resultado.espesorRedondeado_cm);
    // Los 34 cm son el dimensionado original del pasillo a límite de público (PR #80): el analítico cumple con margen.
    const term = salasProyecto().find((s) => s.id === 'hdr')!.barreras.find((b) => b.id === 'laberinto')!.terminos;
    const publico = barreraSala({ terminos: term, material: 'concrete', P_mSv_semana: P, T: 1 / 8, dInterior_m: 2.5 });
    expect(publico.espesorRedondeado_cm).toBe(MURO_INTERIOR_LABERINTO_HDR_cm);
    expect(publico.dosisOcupacion_uSv_semana).toBeLessThanOrEqual(1000 * P_NO_CONTROLADA_mSv_semana);
    // MC preliminar de Cyclotron-SIM #38 con 34 cm: H*(10) = 584 ± 8 μSv en el pasillo cada semana; con T = 1/8, 73.
    const mcTH_uSv = 584 / 8;
    expect(mcTH_uSv).toBeGreaterThan(1000 * P_NO_CONTROLADA_mSv_semana);
    expect(mcTH_uSv).toBeLessThanOrEqual(1000 * P_CONTROLADA_mSv_semana);
  });
});
