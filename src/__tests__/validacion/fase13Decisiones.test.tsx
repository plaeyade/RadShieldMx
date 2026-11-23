/**
 * Fase 13 — decisiones del propietario del 23-11-2026:
 * 1. neutrones en la puerta por el MAYOR de Kersey y Wu–McGinley, mostrando los dos;
 * 2. neutrones desde 10 MV inclusive;
 * 3. regla de la suma en la puerta (8.9 mm Pb en §7.1.13 sin IMRT en vez de 7.1–7.3 mm);
 * 4. el edificio no tiene sótanos;
 * 5. punto protegido a 0.5 m sobre el piso de arriba y 1.7 m sobre el de abajo;
 * 6. linac Elekta Versa HD (perfil con energías configurables y cita pública).
 */
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { evaluarLaberintoPuerta, evaluarLaberintosDelPlano, MV_NEUTRONES_MIN } from '@/lib/laberintoPuerta';
import type { FuenteTeleterapia } from '@/lib/ncrp151';
import { ENERGIA_NEUTRONES_MIN_MV, getShieldingCitationIds, requiereNeutrones } from '@/lib/shieldingMath';
import {
  ALTURA_PUNTO_NIVEL_ABAJO_M, ALTURA_PUNTO_NIVEL_ARRIBA_M, EDIFICIO_SIN_SOTANOS, NivelInexistente,
  alturaNivel_m, distanciasTechoPiso_m, elevacionNivel_m,
} from '@/lib/nivelesEdificio';
import { calculateFloorCeiling, type FloorCeilingConfig } from '@/hooks/useFloorCeilingCalc';
import FloorCeilingDialog from '@/sections/dialogs/FloorCeilingDialog';
import {
  CONFIG_VERSA_HD_PROYECTO, PERFIL_ELEKTA_VERSA_HD, fuentesDesdeConfiguracion, requiereNeutronesLinac,
  validarConfiguracionLinac, type ConfiguracionLinac,
} from '@/lib/perfilesEquipo';
import { modalidadEquipo } from '@/lib/equipoAFuente';
import { MODALITIES, type FloorPlan, type LaberintoPuertaPlano, type RadiationSource } from '@/types/radshield';

const dentro = (v: number, ref: number, tol: number) => expect(Math.abs(v - ref) / ref).toBeLessThanOrEqual(tol);

// Sala del capítulo 7 de NCRP 151 (§7.1.10–7.1.13), como en fase13Paso3.test.ts, con el método por omisión.
const LAB: LaberintoPuertaPlano = {
  id: 'lab-1', nombre: 'Puerta del laberinto',
  geometria: { dh_m: 4.2, dr_m: 5.9, dz_m: 6.8, A0_m2: 2.82, Az_m2: 8.4, dsec_m: 7.3, dsecFuga_m: 7.9, dzz_m: 9.9, A1_m2: 11.8, dL_m: 7.1, muroZ_cm: 125 },
  sala: { d1_m: 6.4, d2_m: 8.5, Sr_m2: 2 * (7.8 * 3.65 + 7.8 * 3.65 + 7.8 * 7.8), S0_m2: 9.2, S1_m2: 8.4 },
  neutronesPorEnergia: [{ mv: 18, Qn: 1.22e12, H0_mSv_Gy: 1.6, referencia: 'NCRP 151 Tabla B.9 (Varian 1800, 18 MV)' }],
  fPaciente: 0.34, anguloReflexion_deg: 75,
  dimensiones: { ancho_m: 2.4, alto_m: 3.5 },
  P_mSv_semana: 0.1, T: 1,
};
const dual: { nombre: string; f: FuenteTeleterapia }[] = [
  { nombre: '18 MV', f: { energia: 18, W_Gy_semana: 450, fraccionIMRT: 0, factorIMRT: 5 } },
  { nombre: '6 MV', f: { energia: 6, W_Gy_semana: 225, fraccionIMRT: 0, factorIMRT: 5 } },
];

describe('decisiones 1–3: neutrones y puerta', () => {
  it('1. por omisión el mayor de Kersey y Wu–McGinley, y la nota muestra los dos valores', () => {
    const r = evaluarLaberintoPuerta(LAB, dual);
    expect(r.metodoNeutrones).toBe('mayor');
    const c = r.porEnergia.find((x) => x.energia === 18)!;
    expect(c.neutrones_Sv).toBe(Math.max(c.neutronesKersey_Sv!, c.neutronesWu_Sv!));
    const nota = r.notas.find((n) => /^18 MV: neutrones en la puerta/.test(n))!;
    expect(nota).toContain(`Kersey ${(c.neutronesKersey_Sv! * 1e6).toFixed(1)} µSv/semana`);
    expect(nota).toContain(`Wu–McGinley ${(c.neutronesWu_Sv! * 1e6).toFixed(1)} µSv/semana`);
    expect(nota).toMatch(/el mayor/);
    // La de 6 MV no tiene neutrones ni nota de neutrones.
    expect(r.notas.some((n) => /^6 MV: neutrones/.test(n))).toBe(false);
  });

  it('2. neutrones desde 10 MV inclusive en el laberinto y en los avisos del motor', () => {
    expect(MV_NEUTRONES_MIN).toBe(10);
    expect(ENERGIA_NEUTRONES_MIN_MV).toBe(10);
    const r = evaluarLaberintoPuerta({ ...LAB, neutronesPorEnergia: undefined }, [{ nombre: '10 MV', f: { energia: 10, W_Gy_semana: 450 } }]);
    expect(r.H_neutrones_Sv).toBeGreaterThan(0);
    expect(r.notas.some((n) => /^10 MV: neutrones en la puerta por Kersey .* y por Wu–McGinley/.test(n))).toBe(true);
    const fuente = (id: string): RadiationSource => ({
      id, x: 0, y: 0, name: id, modality: MODALITIES.find((m) => m.id === id)!, workloadValue: 100, workloadUnit: '', isocenterHeight_m: 1.3, useFactor: 0.25,
    });
    expect(requiereNeutrones(fuente('linac-10mv'))).toBe(true);
    expect(getShieldingCitationIds(fuente('linac-10mv'))).toContain('NCRP-151-neutrons');
    expect(requiereNeutrones(fuente('linac-6mv'))).toBe(false);
    expect(getShieldingCitationIds(fuente('linac-6mv'))).not.toContain('NCRP-151-neutrons');
  });

  it('3. §7.1.13 sin IMRT: la regla de la suma adopta ≈ 8.9 mm de plomo (la de P/2 da ≈ 7.1–7.3 mm)', () => {
    const r = evaluarLaberintoPuerta(LAB, dual);
    dentro(r.requeridoNCRP.plomo_mm, 7.3, 0.05);
    dentro(r.requerido.plomo_mm, 8.9, 0.02);
    expect(r.requerido.bpe_mm).toBeCloseTo(r.requeridoNCRP.bpe_mm, 9);
  });
});

describe('decisiones 4–5: sin sótanos y puntos protegidos', () => {
  it('4. el edificio del proyecto no tiene sótanos: un nivel < 0 no existe', () => {
    expect(EDIFICIO_SIN_SOTANOS).toBe(true);
    expect(() => alturaNivel_m(-1, { sinSotanos: true })).toThrow(NivelInexistente);
    expect(() => elevacionNivel_m(-1, { sinSotanos: true })).toThrow(NivelInexistente);
    expect(() => distanciasTechoPiso_m(0, 1.3, { sinSotanos: true })).toThrow(NivelInexistente);
    // Los niveles de arriba no cambian.
    expect(elevacionNivel_m(2, { sinSotanos: true })).toBeCloseTo(10.4, 12);
  });

  const base: FloorCeilingConfig = {
    energy_MeV: 6, workload_Gy_week: 400, useFactor: 0.25, isocenterHeight_m: 1.3, roomHeight_m: 4,
    floorThickness_m: 1.2, ceilingThickness_m: 1.5, areaAboveOccupied: true, areaBelowOccupied: true,
    distanceToAbove_m: 5.5, distanceToBelow_m: 4, designGoalAbove_mSv_week: 0.02, designGoalBelow_mSv_week: 0.02,
    occupancyAbove: 1, occupancyBelow: 1,
  };

  it('4. sala en PB sin sótanos: el suelo no se calcula (terreno) y no se pide altura de sótano', () => {
    const r = calculateFloorCeiling({ ...base, niveles: { nivelSala: 0, edificio: { sinSotanos: true } } });
    expect(r.distanceToBelow_m).toBeNull();
    expect(r.sotanosSinAltura).toEqual([]);
    expect(r.nivelesInexistentes).toEqual([-1]);
    expect(r.floorRequiredThickness_mm).toBe(0);
    expect(r.floorCompliant).toBe(true);
    expect(r.recommendation).toMatch(/^Sin sótanos: bajo la sala está el terreno/);
    // El techo sigue: PB 5.40 m, punto 0.5 m sobre el piso de arriba.
    expect(r.distanceToAbove_m).toBeCloseTo(5.4 + 0.5 - 1.3, 12);
    // Sala en un sótano que no existe: no se calcula.
    const s = calculateFloorCeiling({ ...base, niveles: { nivelSala: -1, edificio: { sinSotanos: true } } });
    expect(s.recommendation).toMatch(/no tiene sótanos/);
    expect(s.nivelesInexistentes).toEqual([-1]);
  });

  it('5. punto protegido a 0.5 m sobre el piso de arriba y 1.7 m sobre el de abajo', () => {
    expect(ALTURA_PUNTO_NIVEL_ARRIBA_M).toBe(0.5);
    expect(ALTURA_PUNTO_NIVEL_ABAJO_M).toBe(1.7);
    const d = distanciasTechoPiso_m(1, 1.3, { sinSotanos: true });
    expect(d.arriba_m).toBeCloseTo(5 + 0.5 - 1.3, 12);
    expect(d.abajo_m).toBeCloseTo(1.3 + 5.4 - 1.7, 12);
  });

  it('4. el diálogo «Suelo y techo» oculta el campo de sótanos por omisión y lo muestra si se indica que hay', () => {
    render(<FloorCeilingDialog open onOpenChange={() => {}} />);
    expect(screen.queryByLabelText('Sótanos, piso a contrapiso (m)')).toBeNull();
    fireEvent.click(screen.getByLabelText('El edificio tiene sótanos (este proyecto: no)'));
    expect((screen.getByLabelText('Sótanos, piso a contrapiso (m)') as HTMLInputElement).value).toBe('');
  });
});

describe('decisión 6: perfil Elekta Versa HD', () => {
  it('catálogo con cita: fotones 6/10/15/18 MV y 6/10 MV FFF; electrones 4–18 MeV; FFF hasta 2400 MU/min', () => {
    const p = PERFIL_ELEKTA_VERSA_HD;
    expect(p.fotonesDisponibles.filter((e) => !e.fff).map((e) => e.mv)).toEqual([6, 10, 15, 18]);
    expect(p.fotonesDisponibles.filter((e) => e.fff).map((e) => e.mv)).toEqual([6, 10]);
    expect(p.electronesDisponibles_MeV.map((e) => e.mev)).toEqual([4, 6, 8, 9, 10, 12, 15, 18]);
    expect(Math.max(...p.tasaMaxima_MU_min.fff.map((x) => x.mu_min))).toBe(2400);
    expect(p.fugaCabezal.fraccion).toBe(1e-3);
    const ids = new Set(p.fuentes.map((f) => f.id));
    for (const e of [...p.fotonesDisponibles, ...p.electronesDisponibles_MeV]) for (const f of e.fuentes) expect(ids.has(f)).toBe(true);
    for (const f of p.fuentes) expect(f.url).toMatch(/^https:\/\//);
  });

  it('configuración del proyecto (confirmada 23-11-2026): fotones 6/10/18 MV y FFF 6/10 MV, electrones 4–15 MeV, neutrones activos', () => {
    const c = CONFIG_VERSA_HD_PROYECTO;
    expect(c.confirmado).toBe(true);
    expect(c.fotones.filter((e) => !e.fff).map((e) => e.mv)).toEqual([6, 10, 18]);
    expect(c.fotones.filter((e) => e.fff).map((e) => e.mv)).toEqual([6, 10]);
    expect(c.opcionesCitadas).toEqual([{ mv: 15, fff: false }]);
    expect(c.fotones.some((e) => e.mv === 15)).toBe(false);
    expect(c.electrones_MeV).toEqual([4, 6, 8, 9, 10, 12, 15]);
    expect(requiereNeutronesLinac(c)).toBe(true);
    expect(requiereNeutronesLinac({ fotones: [{ mv: 10, fff: false }] })).toBe(true);
    expect(requiereNeutronesLinac({ fotones: [{ mv: 18, fff: false }] })).toBe(true);
    const avisos = validarConfiguracionLinac(c);
    expect(avisos.some((a) => /sin confirmar/.test(a))).toBe(false);
    expect(avisos.some((a) => /no está en el catálogo/.test(a))).toBe(false);
    expect(avisos.some((a) => /neutrones y captura/.test(a))).toBe(true);
    expect(avisos.filter((a) => /NCRP 151 no tabula haces FFF/.test(a))).toHaveLength(2);
    expect(modalidadEquipo({ name: 'Elekta Versa HD', energies: c.fotones.map((e) => e.mv), workload_Gy_week: 500, isoHeight_m: 1 })).toBe('linac-18mv');
  });

  it('12 MV como fotones no existe en el Versa HD: avisa que 12 MeV es de electrones', () => {
    const c: ConfiguracionLinac = { ...CONFIG_VERSA_HD_PROYECTO, fotones: [{ mv: 12, fff: false }], confirmado: true };
    expect(validarConfiguracionLinac(c).some((a) => /12 MV no está en el catálogo de fotones.*12 MeV sí existe como electrones/.test(a))).toBe(true);
  });

  const conPuerta = (cfg: ConfiguracionLinac, W: Record<string, number>) => {
    const { fuentes, avisos } = fuentesDesdeConfiguracion(cfg, { idBase: 'versa', x: 0, y: 0, W_Gy_semana: W });
    const { neutronesPorEnergia: _n, ...lab } = LAB;
    const plano: FloorPlan = {
      id: 'p', name: 'Versa HD', imageUrl: null, scale_m_per_pixel: 1, width_pixels: 20, height_pixels: 20,
      barriers: [], occupiedRegions: [], sources: fuentes, laberintos: [lab],
    };
    return { fuentes, avisos, r: evaluarLaberintosDelPlano(plano)[0] };
  };

  it('las fuentes del perfil entran al laberinto: con 10 y 18 MV hay neutrones y captura (Tabla B.9 a falta del fabricante)', () => {
    const W = { '6 MV': 150, '10 MV': 100, '18 MV': 100, '6 MV FFF': 50, '10 MV FFF': 50 };
    const { fuentes, avisos, r } = conPuerta(CONFIG_VERSA_HD_PROYECTO, W);
    expect(avisos).toEqual([]);
    expect(fuentes.map((f) => f.modality.id)).toEqual(['linac-6mv', 'linac-10mv', 'linac-18mv', 'linac-6mv', 'linac-10mv']);
    expect(new Set(fuentes.map((f) => f.id)).size).toBe(5);
    expect(fuentes.every((f) => f.manufacturerVariant === 'Elekta Versa HD')).toBe(true);
    expect(r.H_neutrones_Sv).toBeGreaterThan(0);
    expect(r.H_captura_Sv).toBeGreaterThan(0);
    // Cada energía ≥ 10 MV aporta neutrones por sí sola (10 MV, 10 MV FFF y 18 MV); 6 MV (con o sin filtro) no.
    const cfg = (fotones: ConfiguracionLinac['fotones']) => ({ ...CONFIG_VERSA_HD_PROYECTO, fotones });
    expect(conPuerta(cfg([{ mv: 6, fff: false }, { mv: 6, fff: true }]), { '6 MV': 225, '6 MV FFF': 225 }).r.H_neutrones_Sv).toBe(0);
    for (const [e, nombre] of [[{ mv: 10, fff: false }, '10 MV'], [{ mv: 18, fff: false }, '18 MV'], [{ mv: 10, fff: true }, '10 MV FFF']] as const) {
      const rr = conPuerta(cfg([{ mv: 6, fff: false }, e]), { '6 MV': 225, [nombre]: 225 }).r;
      expect(rr.H_neutrones_Sv).toBeGreaterThan(0);
      expect(rr.H_captura_Sv).toBeGreaterThan(0);
    }
    // 15 MV (opción citada, no configurada) sigue calculando con la Tabla B.9 si alguien la añade.
    const r15 = conPuerta(cfg([{ mv: 15, fff: false }]), { '15 MV': 450 }).r;
    expect(r15.H_neutrones_Sv).toBeGreaterThan(0);
    expect(r15.porEnergia[0].fuenteNeutrones).toMatch(/Tabla B\.9 para 15 MV/);
  });

  it('15 MV en el laberinto: α₀ de la fila de 10 MV de la Tabla B.8a (antes lanzaba «Tabla B.8a no tiene la fuente 15»)', () => {
    const r = evaluarLaberintoPuerta(LAB, [{ nombre: '15 MV', f: { energia: 15, W_Gy_semana: 450 } }]);
    expect(r.notas.some((n) => /^15 MV: α₀ de la fila de 10 MV/.test(n))).toBe(true);
    const r10 = evaluarLaberintoPuerta(LAB, [{ nombre: '10 MV', f: { energia: 10, W_Gy_semana: 450 } }]);
    expect(r.porEnergia[0].fotones.HS).toBeCloseTo(r10.porEnergia[0].fotones.HS, 15);
    expect(r10.notas.some((n) => /α₀ de la fila/.test(n))).toBe(false);
  });

  it('sin carga o sin modalidad de la energía: no crea fuente y avisa', () => {
    const { fuentes, avisos } = fuentesDesdeConfiguracion(
      { ...CONFIG_VERSA_HD_PROYECTO, fotones: [{ mv: 6, fff: false }, { mv: 8, fff: false }, { mv: 15, fff: false }] },
      { idBase: 'v', x: 0, y: 0, W_Gy_semana: { '6 MV': 100, '8 MV': 100 } },
    );
    expect(fuentes.map((f) => f.modality.id)).toEqual(['linac-6mv']);
    expect(avisos.some((a) => /8 MV: sin modalidad/.test(a))).toBe(true);
    expect(avisos.some((a) => /15 MV: sin carga/.test(a))).toBe(true);
  });
});
