/**
 * Fase 13, paso 3 — laberinto y puerta de teleterapia en el motor del proyecto (NCRP 151 §2.4, ejemplos §7.1.10–7.1.13).
 *
 * Las ecuaciones ya estaban en `ncrp151Laberinto.ts` (validadas contra §7.1.10–7.1.13), pero sólo las usaba el diálogo
 * «Laberinto y puerta», con una energía y fuera del proyecto. Aquí se evalúa la puerta de cada laberinto declarado en
 * el plano (`FloorPlan.laberintos`) con TODAS las fuentes de teleterapia de la sala:
 *
 * - Fotones en la puerta (Ec. 2.9–2.14, todas las energías): dispersión del haz en los muros H_S, fuga dispersada H_LS,
 *   dispersión del paciente H_ps y fuga a través del muro interior H_LT; H_Tot = 2.64·H_G, sumado entre energías como
 *   en §7.1.10 (18 + 6 MV).
 * - Energías ≥ 10 MV: rayos gamma de captura (Ec. 2.15–2.17, H_cg = W_L·h_φ) y neutrones (Kersey, Ec. 2.18, o
 *   Wu–McGinley, Ec. 2.19–2.21; H_n = W_L·H_n,D), con la carga de fuga W_L de la Ec. 3.6 (IMRT), como §7.1.11–7.1.12.
 *   Sin datos del fabricante, Q_n y H₀ son el máximo de la Tabla B.9 para la energía (conservador).
 * - Puerta (§2.4.3, §7.1.13): con neutrones, polietileno borado (TVL 45 mm) y plomo para la captura (TVL 61 mm), cada
 *   componente a (P/T)/2; sólo fotones, plomo con TVL 6 mm a P/T. Con el blindaje instalado de la puerta se calcula la
 *   dosis residual y el estado (CUMPLE / NO_CUMPLE / SIN_ESPESOR).
 *
 * La geometría (distancias y áreas de las Figs. 2.7 y 2.8) la captura el usuario; todavía no se mide del plano.
 *
 * Decisiones del propietario (23-11-2026): neutrones por el MAYOR de Kersey y Wu–McGinley, mostrando los dos valores
 * (notas por energía); neutrones y captura desde 10 MV inclusive; y la regla de la suma en la puerta (si neutrones +
 * captura + fotones detrás de la puerta de §7.1.13 rebasan P/T, se añade plomo: 8.9 mm en vez de 7.1 mm sin IMRT).
 */
import { cargaFuga, transmisionTVL, tvlFuga, type EnergiaMV, type FuenteTeleterapia } from '@/lib/ncrp151';
import {
  albedoConcreto, capturaGammaPorGy, filaAlbedo, fotonesEnPuerta, fuenteNeutronesConservadora, neutronesKersey,
  neutronesWuMcGinley, puerta, TVL_PUERTA, type FotonesPuerta, type SalaNeutrones,
} from '@/lib/ncrp151Laberinto';
import { fuenteTeleterapiaDe } from '@/lib/normativeBarrierEngine';
import { ENERGIA_NEUTRONES_MIN_MV } from '@/lib/shieldingMath';
import type { FloorPlan, LaberintoPuertaPlano, RadiationSource } from '@/types/radshield';

export const MOTOR_LABERINTO = 'laberintoPuerta/ncrp151-2.4-v1';
/** Energía nominal desde la que se calculan neutrones y captura, 10 MV inclusive (decisión del propietario, 23-11-2026; Tabla B.9 tabula equipos de 10 MV). */
export const MV_NEUTRONES_MIN = ENERGIA_NEUTRONES_MIN_MV;
/** Horas de haz por semana con que se informa la tasa media en la puerta (misma convención que la memoria). */
export const HORAS_HAZ_SEMANA = 40;

export type EstadoPuerta = 'CUMPLE' | 'NO_CUMPLE' | 'SIN_ESPESOR' | 'SIN_DATOS';

export interface ComponentePorEnergia {
  energia: EnergiaMV;
  W_Gy_semana: number;
  WL_Gy_semana: number;
  fotones: FotonesPuerta;
  /** Sv/semana; 0 por debajo de 10 MV. */
  captura_Sv: number;
  neutronesKersey_Sv: number | null;
  neutronesWu_Sv: number | null;
  /** El adoptado según el método (Sv/semana). */
  neutrones_Sv: number;
  fuenteNeutrones: string | null;
}

export interface ResultadoLaberinto {
  id: string;
  nombre: string;
  motor: typeof MOTOR_LABERINTO;
  fuentes: string[];
  porEnergia: ComponentePorEnergia[];
  /** Sv/semana en la puerta sin blindaje de la puerta. */
  H_fotones_Sv: number;
  H_captura_Sv: number;
  H_neutrones_Sv: number;
  H_total_Sv: number;
  metodoNeutrones: 'kersey' | 'wu-mcginley' | 'mayor';
  /** Objetivo en la puerta: P/T (Sv/semana). */
  objetivo_Sv: number;
  /** Regla de §7.1.13 tal cual: neutrones y captura, cada uno a (P/T)/2; los fotones no entran con ≥ 10 MV. */
  requeridoNCRP: { bpe_mm: number; plomo_mm: number };
  /** El anterior con el plomo necesario para que la SUMA de las tres componentes no rebase P/T (el que se adopta). */
  requerido: { bpe_mm: number; plomo_mm: number };
  instalado: { bpe_mm: number; plomo_mm: number } | null;
  /** Dosis detrás de la puerta instalada (Sv/semana) y su tasa media en µSv/h (40 h de haz). */
  residual_Sv: number | null;
  residual_uSv_h: number | null;
  estado: EstadoPuerta;
  notas: string[];
  avisos: string[];
}

const numero = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const mvDe = (e: EnergiaMV): number => (e === 'Co60' ? 1.25 : e);

/** Dosis detrás de la puerta: cada componente con su TVL (§2.4.3); el BPE no se acredita a los fotones (conservador). */
export function dosisTrasPuerta(H: { neutrones: number; captura: number; fotones: number }, bpe_mm: number, plomo_mm: number): number {
  return H.neutrones * 10 ** (-bpe_mm / TVL_PUERTA.bpe_neutrones_mm)
    + H.captura * 10 ** (-plomo_mm / TVL_PUERTA.plomo_captura_mm)
    + H.fotones * 10 ** (-plomo_mm / TVL_PUERTA.plomo_dispersos_mm);
}

/** Fuentes de teleterapia de la sala: las de `fuenteIds` o, si no se declaran, todas las de linac del plano. */
export function fuentesDelLaberinto(l: LaberintoPuertaPlano, sources: RadiationSource[]): { s: RadiationSource; f: FuenteTeleterapia }[] {
  const ids = l.fuenteIds?.length ? new Set(l.fuenteIds) : null;
  return sources
    .filter((s) => !ids || ids.has(s.id))
    .map((s) => ({ s, f: fuenteTeleterapiaDe(s) }))
    .filter((x): x is { s: RadiationSource; f: FuenteTeleterapia } => x.f !== null);
}

/** Evalúa la puerta de un laberinto con fuentes NCRP 151 ya resueltas. */
export function evaluarLaberintoPuerta(
  l: LaberintoPuertaPlano,
  fuentes: { nombre: string; f: FuenteTeleterapia }[],
): ResultadoLaberinto {
  const notas: string[] = [];
  const avisos: string[] = [];
  const metodo = l.metodoNeutrones ?? 'mayor';
  const T = numero(l.T) && l.T > 0 && l.T <= 1 ? l.T : 1;
  if (T !== l.T) avisos.push(`T = ${l.T} no válido en la puerta «${l.nombre}»: se usa T = 1.`);
  const objetivo_Sv = (l.P_mSv_semana / 1000) / T;
  const g = l.geometria;
  const base: Omit<ResultadoLaberinto, 'estado'> = {
    id: l.id, nombre: l.nombre, motor: MOTOR_LABERINTO, fuentes: fuentes.map((x) => x.nombre), porEnergia: [],
    H_fotones_Sv: 0, H_captura_Sv: 0, H_neutrones_Sv: 0, H_total_Sv: 0, metodoNeutrones: metodo,
    objetivo_Sv, requeridoNCRP: { bpe_mm: 0, plomo_mm: 0 }, requerido: { bpe_mm: 0, plomo_mm: 0 }, instalado: null, residual_Sv: null, residual_uSv_h: null, notas, avisos,
  };
  if (!fuentes.length) {
    avisos.push(`Laberinto «${l.nombre}»: sin fuentes de teleterapia con energía tabulada (NCRP 151); no se calcula la puerta.`);
    return { ...base, estado: 'SIN_DATOS' };
  }
  if (!(objetivo_Sv > 0)) {
    avisos.push(`Laberinto «${l.nombre}»: P no válido.`);
    return { ...base, estado: 'SIN_DATOS' };
  }

  const reflexion = numero(l.anguloReflexion_deg) ? l.anguloReflexion_deg : 0;
  const porEnergia: ComponentePorEnergia[] = [];
  let faltanDatosNeutrones = false;
  for (const { f } of fuentes) {
    const WL = cargaFuga(f);
    // 15 y 20 MV (p. ej. el Versa HD de 15 MV) no están en la Tabla B.8a: antes lanzaba un error; se usa la fila
    // tabulada inmediata inferior (10 MV para 15 MV), de albedo mayor (conservador).
    const e = filaAlbedo(f.energia);
    if (e !== String(f.energia)) notas.push(`${f.energia} MV: α₀ de la fila de ${e} MV de la Tabla B.8a (la energía no está tabulada; albedo mayor, conservador).`);
    const fot = fotonesEnPuerta(
      { ...g, B_muroZ: transmisionTVL(g.muroZ_cm, tvlFuga(f.energia, 'concrete')) },
      {
        energia: f.energia, W_Gy_semana: f.W_Gy_semana, WL_Gy_semana: WL, f: l.fPaciente,
        UG: l.UG, campo_cm2: l.campo_cm2,
        alfa0: albedoConcreto(e, reflexion), alfaZ: albedoConcreto('0.5MeV', reflexion),
      },
    );
    const c: ComponentePorEnergia = {
      energia: f.energia, W_Gy_semana: f.W_Gy_semana, WL_Gy_semana: WL, fotones: fot,
      captura_Sv: 0, neutronesKersey_Sv: null, neutronesWu_Sv: null, neutrones_Sv: 0, fuenteNeutrones: null,
    };
    const mv = mvDe(f.energia);
    if (mv >= MV_NEUTRONES_MIN) {
      if (!l.sala) {
        faltanDatosNeutrones = true;
      } else {
        const dato = l.neutronesPorEnergia?.find((x) => x.mv === mv);
        let Qn: number, H0: number | undefined, origen: string;
        if (dato && numero(dato.Qn)) {
          Qn = dato.Qn; H0 = dato.H0_mSv_Gy; origen = dato.referencia || `Dato del equipo para ${mv} MV`;
        } else {
          try {
            const cons = fuenteNeutronesConservadora(mv);
            Qn = cons.Qn; H0 = cons.H0_mSv_Gy || undefined; origen = cons.nota;
          } catch {
            avisos.push(`${mv} MV: la Tabla B.9 no tiene equipos de esa energía; capture Q_n y H₀ del fabricante.`);
            faltanDatosNeutrones = true;
            porEnergia.push(c);
            continue;
          }
        }
        const sala: SalaNeutrones = { ...l.sala, Qn, H0_mSv_Gy: H0 };
        c.fuenteNeutrones = origen;
        c.captura_Sv = WL * capturaGammaPorGy(sala, mv);
        c.neutronesWu_Sv = WL * neutronesWuMcGinley(sala);
        c.neutronesKersey_Sv = H0 ? WL * neutronesKersey(sala) : null;
        if (metodo === 'kersey' && c.neutronesKersey_Sv === null) {
          avisos.push(`${mv} MV: Kersey requiere H₀ (Tabla B.9); se usa Wu–McGinley.`);
        }
        c.neutrones_Sv = metodo === 'wu-mcginley' || c.neutronesKersey_Sv === null
          ? c.neutronesWu_Sv
          : metodo === 'kersey' ? c.neutronesKersey_Sv : Math.max(c.neutronesKersey_Sv, c.neutronesWu_Sv);
        // Se muestran los dos valores aunque se adopte uno (decisión del propietario, 23-11-2026).
        const us = (x: number) => `${(x * 1e6).toFixed(1)} µSv/semana`;
        notas.push(`${mv} MV: neutrones en la puerta por Kersey ${c.neutronesKersey_Sv === null ? 'sin H₀ (no se calcula)' : us(c.neutronesKersey_Sv)} y por Wu–McGinley ${us(c.neutronesWu_Sv)}; se adopta ${us(c.neutrones_Sv)} (${metodo === 'mayor' ? 'el mayor' : metodo === 'kersey' && c.neutronesKersey_Sv !== null ? 'Kersey' : 'Wu–McGinley'}).`);
      }
    }
    porEnergia.push(c);
  }

  const H_fotones_Sv = porEnergia.reduce((a, c) => a + c.fotones.HTot, 0);
  const H_captura_Sv = porEnergia.reduce((a, c) => a + c.captura_Sv, 0);
  const H_neutrones_Sv = porEnergia.reduce((a, c) => a + c.neutrones_Sv, 0);
  const door = puerta(objetivo_Sv, { neutrones: H_neutrones_Sv, captura: H_captura_Sv, fotones: H_fotones_Sv });
  notas.push(...door.notas);
  notas.push(`Neutrones: ${metodo === 'mayor' ? 'el mayor de Kersey (Ec. 2.18) y Wu–McGinley (Ec. 2.19–2.21)' : metodo === 'kersey' ? 'Kersey (Ec. 2.18)' : 'Wu–McGinley (Ec. 2.19–2.21)'}; captura con la Ec. 2.15–2.17; ambos con la carga de fuga W_L (Ec. 3.6).`);
  notas.push(`Fotones: Ec. 2.9–2.14 por energía y sumados; α₀ y α_z de la Tabla B.8a a ${reflexion}° de reflexión; α₁ de la Tabla B.8b.`);

  // Ec. 2.14 vale con 2 < d_zz/√(ancho·alto) < 6 y 1 < alto/ancho < 2 (§2.4.1).
  if (l.dimensiones && l.dimensiones.ancho_m > 0 && l.dimensiones.alto_m > 0) {
    const { ancho_m: w, alto_m: h } = l.dimensiones;
    const r = g.dzz_m / Math.sqrt(w * h);
    if (!(r > 2 && r < 6) || !(h / w > 1 && h / w < 2)) {
      avisos.push(`Laberinto «${l.nombre}»: fuera del intervalo de la Ec. 2.14 (d_zz/√(ancho·alto) = ${r.toFixed(2)}, alto/ancho = ${(h / w).toFixed(2)}); H_Tot = 2.64·H_G no está validado.`);
    }
  } else {
    avisos.push(`Laberinto «${l.nombre}»: sin ancho y alto del laberinto no se comprueba el intervalo de validez de la Ec. 2.14.`);
  }
  if (faltanDatosNeutrones) {
    avisos.push(`Laberinto «${l.nombre}»: hay fuentes ≥ ${MV_NEUTRONES_MIN} MV sin datos de la sala para neutrones (d₁, d₂, S_r, S₀, S₁): la puerta no puede declararse conforme.`);
  }

  const instalado = l.puertaInstalada && (numero(l.puertaInstalada.bpe_mm) || numero(l.puertaInstalada.plomo_mm))
    ? { bpe_mm: l.puertaInstalada.bpe_mm ?? 0, plomo_mm: l.puertaInstalada.plomo_mm ?? 0 }
    : null;
  const H = { neutrones: H_neutrones_Sv, captura: H_captura_Sv, fotones: H_fotones_Sv };
  const residual_Sv = instalado ? dosisTrasPuerta(H, instalado.bpe_mm, instalado.plomo_mm) : null;
  // Con la puerta requerida, comprobar que la suma de las tres componentes no rebasa P/T (fotones con TVL de 6 mm).
  const conRequerida = dosisTrasPuerta(H, door.bpe_mm, door.plomo_mm);
  let plomo_mm = door.plomo_mm;
  if (conRequerida > objetivo_Sv * 1.0001) {
    // §7.1.13 lleva neutrones y captura a P/2 cada uno y no cuenta los fotones (Ec. 2.14) con ≥ 10 MV; si la suma
    // rebasa P/T, se añade plomo (TVL 61 mm para la captura y 6 mm para los fotones) hasta cumplirla.
    let lo = plomo_mm, hi = plomo_mm + 400;
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (dosisTrasPuerta(H, door.bpe_mm, m) > objetivo_Sv) lo = m; else hi = m; }
    plomo_mm = hi;
    notas.push(`Con la regla de §7.1.13 (${door.bpe_mm.toFixed(1)} mm BPE + ${door.plomo_mm.toFixed(1)} mm Pb) la suma de neutrones, captura y fotones detrás de la puerta es ${(conRequerida * 1e6).toFixed(1)} µSv/semana > P/T; se adopta ${plomo_mm.toFixed(1)} mm de plomo para que la suma no rebase P/T.`);
  }

  const estado: EstadoPuerta = faltanDatosNeutrones ? 'SIN_DATOS' : !instalado ? 'SIN_ESPESOR'
    : (residual_Sv as number) <= objetivo_Sv * 1.0001 ? 'CUMPLE' : 'NO_CUMPLE';
  return {
    ...base,
    porEnergia, H_fotones_Sv, H_captura_Sv, H_neutrones_Sv, H_total_Sv: H_fotones_Sv + H_captura_Sv + H_neutrones_Sv,
    requeridoNCRP: { bpe_mm: door.bpe_mm, plomo_mm: door.plomo_mm },
    requerido: { bpe_mm: door.bpe_mm, plomo_mm },
    instalado,
    residual_Sv,
    residual_uSv_h: residual_Sv === null ? null : (residual_Sv * 1e6) / HORAS_HAZ_SEMANA,
    estado,
  };
}

/** Laberintos declarados en el plano, cada uno con sus fuentes de teleterapia. */
export function evaluarLaberintosDelPlano(plan: Pick<FloorPlan, 'laberintos' | 'sources'>): ResultadoLaberinto[] {
  return (plan.laberintos ?? []).map((l) =>
    evaluarLaberintoPuerta(l, fuentesDelLaberinto(l, plan.sources).map(({ s, f }) => ({ nombre: s.name, f }))));
}
