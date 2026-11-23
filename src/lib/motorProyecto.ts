/**
 * Fase 11 — motor único de cálculo del proyecto.
 *
 * Toda ruta de cálculo del diseñador (barra superior «Calcular Blindaje», asistente «Guíame», «Calc» de la barra
 * lateral, tecla F5, botones «Calcular» del lienzo, cálculo preliminar de un DXF confirmado, cálculo por lotes) pasa
 * por `calcularBarrerasValidadas`: puntos de muestreo de `shieldingMath`, kerma sin blindaje del motor de campo
 * (`doseFieldEngine`, TG-108 para PET), espesores de `normativeBarrierEngine` (NCRP 147 diagnóstico y TC, NCRP 151
 * teleterapia; PET con la curva de banda ancha de TG-108 a 511 keV, `espesorPET511`; I-131, Lu-177 y SPECT Tc-99m por espectro completo con
 * buildup GP de ANSI/ANS-6.4.3 y la regla «el mayor entre haz estrecho a la línea más energética y haz ancho»,
 * `espesorTerapiaGP`) y trazas de auditoría. El estado de cumplimiento es el de `verificarBarrera` (instalado ≥ requerido,
 * sólo con traza del motor).
 *
 * Sustituye a `AsyncShieldingEngine` (Fase 10, hallazgo crítico): aquel worker serializaba sólo posición, carga y
 * factor de uso, y aplicaba un TVL fijo de plomo de 16.6 mm sin modalidad, energía ni TG-108. La asincronía que
 * aportaba (no bloquear la interfaz y avisar del progreso) la da aquí `calcularProyectoAsync`, que cede el hilo entre
 * barreras y ejecuta exactamente la misma función por barrera.
 */
import { MATERIALS, type Barrier, type CalculationInputWarning, type FloorPlan, type RadiationSource } from '@/types/radshield';
import type { CTIsodosisProfile } from '@/types/ctIsodosis';
import {
  inverseArcher,
  tvlThickness,
  exponentialThickness,
  desnivelPuntoProtegido_m,
  generateSamplePoints,
  buildCalculationTrace,
  buildCalculationUnitSnapshot,
  buildConservativeCalculationComparison,
  getCalculationAuditWarnings,
  getShieldingEnergyKey,
} from '@/lib/shieldingMath';
import { buildCalculationCacheKey } from '@/lib/calculationCacheKey';
import { espesorPET511 } from '@/lib/transmisionTG108';
import { ESPECTROS_TERAPIA, espesorTerapiaGP, lineaEstrecha, MODALIDAD_NUCLIDO_TERAPIA, notasTerapia, nuclidoTerapiaDe, REFERENCIA_GP_ANS643 } from '@/lib/terapiaEspectroGP';
import { calcularBarreraNormativa, LINAC, TC } from '@/lib/normativeBarrierEngine';
import { codigoCatalogo, dosisEnPunto } from '@/lib/doseFieldEngine';
import { verificarBarrera, verificarPlano } from '@/lib/estadoProyecto';
import type { EstadoVerificacion } from '@/lib/verificacionBlindaje';

/** Identificador del motor que queda en los resultados (para pruebas y trazas). */
export const MOTOR_PROYECTO = 'motorProyecto/normativo-v1';

export interface PuntoLinea {
  x: number;
  y: number;
  /** Kerma sin blindaje del motor de campo en el punto (mSv/semana). */
  kermaRate: number;
  /** Espesor requerido de la barrera en su material (mm); el motor normativo no lo resuelve punto a punto. */
  barrierThickness_mm: number;
  material: string;
}

export interface LineaMuestreo {
  barrierId: string;
  points: PuntoLinea[];
  maxKermaPoint: PuntoLinea | null;
  maxThicknessPoint: PuntoLinea | null;
}

/** Resultado por barrera para el lienzo, reportes PDF/CNSNS y el paquete de evidencia (`CanvasBarrierResult`). */
export interface ResultadoBarrera {
  barrierId: string;
  barrierName: string;
  maxKermaRate_mGy_per_wk: number;
  maxBarrierThickness_mm: number;
  thicknessLead_mm: number;
  thicknessConcrete_mm: number;
  material: string;
  location: string;
  /** Estado de `verificarBarrera`: CUMPLE sólo si el espesor instalado ≥ requerido. */
  estado: EstadoVerificacion;
  pass: boolean;
  designGoal: number;
  motor: string;
}

// ─── Método por fuente (hallazgo 3 de la auditoría independiente 2026-11) ───────────────────────────────────────────────────────────
// Antes el método, la energía y la categoría salían de `sources[0]`: con un ciclotrón primero no había espesor en
// ninguna barrera y con un paciente PET primero la primaria del linac se calculaba con TG-108. Ahora las fuentes se
// agrupan por método; cada grupo se resuelve con su propio método y los grupos se combinan sumando sus
// transmisiones (Σ_g K_g·B_g(x) ≤ P/T). Con un solo grupo el cálculo es exactamente el de antes.

/** Clave del método de cálculo de una fuente. */
export function claveMetodoFuente(s: RadiationSource): string {
  const cat = s.modality.category;
  if (cat === 'cyclotron') return 'ciclotron';
  if (cat === 'diagnostic') return TC.test(s.modality.id) ? 'diagnostico-tc' : 'diagnostico';
  if (cat === 'therapy') return LINAC.test(s.modality.id) ? 'teleterapia-mv' : `terapia-${getShieldingEnergyKey(s)}`;
  const nuc = MODALIDAD_NUCLIDO_TERAPIA[s.modality.id];
  return nuc ? `gp-${nuc}` : `nuclear-${getShieldingEnergyKey(s)}`;
}

export interface GrupoFuentes {
  clave: string;
  fuentes: RadiationSource[];
}

/** Agrupa las fuentes por método, conservando el orden de aparición. */
export function agruparFuentesPorMetodo(sources: RadiationSource[]): GrupoFuentes[] {
  const grupos = new Map<string, RadiationSource[]>();
  for (const s of sources) {
    const k = claveMetodoFuente(s);
    const l = grupos.get(k);
    if (l) l.push(s); else grupos.set(k, [s]);
  }
  return [...grupos].map(([clave, fuentes]) => ({ clave, fuentes }));
}

interface EvalGrupo {
  requiredThickness: Record<string, number>;
  maxKerma: number;
  kermaPuntos: number[];
  normativo: ReturnType<typeof calcularBarreraNormativa>;
  nuclidoGP: ReturnType<typeof nuclidoTerapiaDe>;
  rigeGP: string[];
  energyKey: string;
  esCiclotron: boolean;
}

/** Espesor requerido por material para un grupo de fuentes de un mismo método (el cálculo de siempre). */
function evaluarGrupo(
  b: Barrier,
  sources: RadiationSource[],
  points: { x: number; y: number }[],
  scale_m_per_pixel: number,
  ctIsodosisProfile?: CTIsodosisProfile,
): EvalGrupo {
  let maxKerma = 0;
  const kermaPuntos: number[] = [];
  for (const p of points) {
    // Fase 2: el kerma sin blindaje en los puntos de muestreo sale del motor de campo (mismas
    // componentes que el mapa; la barrera sólo clasifica primaria/secundaria, no atenúa aquí).
    const d = dosisEnPunto(sources, p.x, p.y, scale_m_per_pixel, { barriers: [b], ctIsodosisProfile, materials: MATERIALS });
    kermaPuntos.push(d.kermaSinBlindaje_mSv_semana);
    maxKerma = Math.max(maxKerma, d.kermaSinBlindaje_mSv_semana);
  }

  const requiredThickness: Record<string, number> = {};
  const energy_MeV = sources[0]?.modality.energy_MeV || 6;
  const energyKey = getShieldingEnergyKey(sources[0]) || String(Math.round(energy_MeV));

  // Ciclotrón: el motor genérico (Γ·A/d² con TVL gamma) subestima ~100× la fuente de neutrones y
  // usa TVL de fotones: no se publica espesor; el aviso de auditoría remite al módulo de ciclotrón/MC.
  const esCiclotron = sources[0]?.modality.category === 'cyclotron';
  // NCRP 147/151: B = P / (K·T). T fuera de (0, 1] → T = 1 (conservador; la auditoría lo marca).
  const T = Number.isFinite(b.occupancyFactor) && b.occupancyFactor > 0 && b.occupancyFactor <= 1 ? b.occupancyFactor : 1;
  const metaEfectiva = b.designGoal_mSv_per_wk / T;
  // I-131 / Lu-177 / Tc-99m: espectro completo con buildup GP (ANSI/ANS-6.4.3) y regla max(haz estrecho, haz ancho) (Fase 11).
  const nuclidoGP = esCiclotron ? null : nuclidoTerapiaDe(sources);
  const rigeGP: string[] = [];
  for (const mat of esCiclotron ? [] : MATERIALS) {
    let thickness = 0;
    if (sources[0]?.modality.category === 'diagnostic') {
      const B = Math.max(1e-10, metaEfectiva / (maxKerma || 1));
      thickness = inverseArcher(B, mat);
    } else if (sources[0]?.modality.category === 'therapy') {
      thickness = tvlThickness(maxKerma, metaEfectiva, mat, energyKey);
    } else if (nuclidoGP) {
      const r = espesorTerapiaGP(nuclidoGP, maxKerma, metaEfectiva, mat);
      thickness = r.espesor_mm;
      if (r.rige) rigeGP.push(`${mat.code}: ${r.rige}${r.fueraRangoGP ? ` (línea con peso ≥ 1 % a ${r.mfpMaxLineas.toFixed(0)} mfp: fuera de 0.5–40 mfp del GP)` : ''}`);
    } else if (energyKey === '511keV') {
      // PET: curva de banda ancha de AAPM TG-108 (Tabla V) invertida numéricamente, no un TVL único (Fase 11, etapa 8).
      thickness = espesorPET511(maxKerma, metaEfectiva, mat);
    } else {
      thickness = exponentialThickness(maxKerma, metaEfectiva, mat, energyKey);
    }
    // Etapa 2: kerma·T ≤ P → requerido 0 (antes quedaba vacío y la barrera salía «sin cálculo»). Ciclotrón: sin espesor.
    if (Number.isFinite(thickness) && thickness >= 0) requiredThickness[mat.code] = Math.max(0, thickness);
  }
  // NCRP 147 (diagnóstico) y NCRP 151 (teleterapia MV) sustituyen al punto-kernel cuando aplican.
  const normativo = esCiclotron ? null : calcularBarreraNormativa(b, sources, points, scale_m_per_pixel, MATERIALS, ctIsodosisProfile);
  if (normativo) {
    for (const k of Object.keys(requiredThickness)) delete requiredThickness[k];
    Object.assign(requiredThickness, normativo.espesores_mm);
    maxKerma = normativo.kermaMax_mSv_semana;
  }
  return { requiredThickness, maxKerma, kermaPuntos, normativo, nuclidoGP, rigeGP, energyKey, esCiclotron };
}

/** Traza de un grupo (la misma que antes daba el motor con una sola clase de fuente). */
function trazaGrupo(b: Barrier, sources: RadiationSource[], ev: EvalGrupo, scale_m_per_pixel: number, nPuntos: number) {
  const calculationTrace = buildCalculationTrace({
    barrier: b,
    sources,
    scale_m_per_pixel,
    maxKerma_mSv_per_wk: ev.maxKerma,
    requiredThickness_mm: ev.requiredThickness,
    samplePointCount: nPuntos,
  });
  const { nuclidoGP, normativo } = ev;
  if (nuclidoGP && !normativo) {
    calculationTrace.formulaId = 'ANS643_GP_ESPECTRO_MAX_HAZ_ESTRECHO';
    calculationTrace.standard = lineaEstrecha(nuclidoGP) === null
      ? 'ANSI/ANS-6.4.3 GP'
      : `ANSI/ANS-6.4.3 GP + haz estrecho${ESPECTROS_TERAPIA[nuclidoGP].terapia ? ' (CNSNS)' : ''}`;
    calculationTrace.assumptions = [...calculationTrace.assumptions, ...notasTerapia(nuclidoGP), `Rige: ${ev.rigeGP.join('; ') || '—'}.`, REFERENCIA_GP_ANS643];
  }
  if (normativo) {
    calculationTrace.formulaId = normativo.metodo === 'NCRP147' ? 'NCRP147_TABLES_4.5_4.7_B1_C1' : 'NCRP151_PRIMARY_LEAKAGE_SCATTER';
    calculationTrace.standard = normativo.metodo;
    calculationTrace.assumptions = [...calculationTrace.assumptions, ...normativo.notas];
  }
  return calculationTrace;
}

/** Fracciones de P en las que se evalúa la curva de cada grupo para combinarlo con otros o con muros en serie. */
const FRACCIONES_CURVA = [1, 0.1, 0.01, 0.001];

/** Curva espesor → dosis relativa (en unidades de P/T) de un grupo y un material: puntos (t_k, 10^-k). */
export function dosisRelativaCurva(t: number[], x: number): number {
  // Con t_k = 0 la dosis sin blindaje ya está por debajo de 10^-k: la mayor k con t = 0 acota la dosis en 0.
  let k0 = -1;
  for (let k = 0; k < t.length; k++) if (!(t[k] > 0)) k0 = k;
  if (k0 === t.length - 1) return 10 ** -k0;
  const pts: { t: number; l: number }[] = [];
  if (k0 >= 0) pts.push({ t: 0, l: -k0 });
  for (let k = k0 + 1; k < t.length; k++) {
    if (!pts.length || t[k] > pts[pts.length - 1].t + 1e-9) pts.push({ t: t[k], l: -k });
  }
  if (pts.length === 1) {
    const tvl = Math.max(pts[0].t, 1);
    return 10 ** (pts[0].l - (x - pts[0].t) / tvl);
  }
  let i = 0;
  while (i < pts.length - 2 && x > pts[i + 1].t) i++;
  const a = pts[i];
  const c = pts[i + 1];
  const pendiente = (c.l - a.l) / (c.t - a.t);
  return 10 ** (a.l + pendiente * (x - a.t));
}

/** Menor x ≥ 0 con Σ_g D_g(x + crédito_g) ≤ 1 (bisección). */
export function resolverCombinado(curvas: { t: number[]; credito: number }[]): number {
  const f = (x: number) => curvas.reduce((acc, c) => acc + dosisRelativaCurva(c.t, x + c.credito), 0);
  if (f(0) <= 1) return 0;
  let hi = Math.max(1, ...curvas.map((c) => c.t[c.t.length - 1] || 0));
  let n = 0;
  while (f(hi) > 1 && n++ < 40) hi *= 2;
  let lo = 0;
  for (let it = 0; it < 80; it++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 1) lo = mid; else hi = mid;
  }
  return hi;
}

interface GrupoBarrera {
  clave: string;
  fuentes: RadiationSource[];
  /** Espesor por material a P/T (fracción 1). */
  t0: Record<string, number>;
  /** Espesores por material a las fracciones de `FRACCIONES_CURVA` (sólo si ya se calcularon). */
  curva?: Record<string, number[]>;
}

function curvaGrupo(
  b: Barrier, g: GrupoBarrera, points: { x: number; y: number }[], scale: number, ct?: CTIsodosisProfile,
): Record<string, number[]> {
  if (g.curva) return g.curva;
  const porMaterial: Record<string, number[]> = {};
  FRACCIONES_CURVA.forEach((fr, k) => {
    const t = k === 0 ? g.t0 : evaluarGrupo({ ...b, designGoal_mSv_per_wk: b.designGoal_mSv_per_wk * fr }, g.fuentes, points, scale, ct).requiredThickness;
    for (const [m, v] of Object.entries(t)) (porMaterial[m] ??= [])[k] = v;
  });
  for (const m of Object.keys(porMaterial)) {
    const v = porMaterial[m];
    if (v.length !== FRACCIONES_CURVA.length || v.some((x) => !Number.isFinite(x))) delete porMaterial[m];
  }
  g.curva = porMaterial;
  return porMaterial;
}

interface Calculo {
  barrera: Barrier;
  linea: LineaMuestreo;
  grupos: GrupoBarrera[];
  points: { x: number; y: number }[];
}

function calcularUna(
  b: Barrier,
  sources: RadiationSource[],
  scale_m_per_pixel: number,
  ctIsodosisProfile?: CTIsodosisProfile,
): Calculo {
  const vacia: LineaMuestreo = { barrierId: b.id, points: [], maxKermaPoint: null, maxThicknessPoint: null };
  const points = generateSamplePoints(b, scale_m_per_pixel, sources);
  if (!points.length) return { barrera: b, linea: vacia, grupos: [], points };

  let minSourceDistance_m = Infinity;
  for (const p of points) {
    for (const s of sources) {
      const dx = (p.x - s.x) * scale_m_per_pixel;
      const dy = (p.y - s.y) * scale_m_per_pixel;
      const dz = desnivelPuntoProtegido_m(s); // Fase 13, paso 2: la misma convención que `distancia`
      minSourceDistance_m = Math.min(minSourceDistance_m, Math.sqrt(dx * dx + dy * dy + dz * dz));
    }
  }

  const gruposFuentes = agruparFuentesPorMetodo(sources);
  let requiredThickness: Record<string, number>;
  let maxKerma: number;
  let kermaPuntos: number[];
  let calculationTrace: ReturnType<typeof buildCalculationTrace>;
  let energyKey: string;
  const avisosExtra: CalculationInputWarning[] = [];
  let grupos: GrupoBarrera[];

  if (gruposFuentes.length === 1) {
    // Un solo método: exactamente el cálculo anterior (control «Guíame» bit a bit).
    const ev = evaluarGrupo(b, sources, points, scale_m_per_pixel, ctIsodosisProfile);
    requiredThickness = ev.requiredThickness;
    maxKerma = ev.maxKerma;
    kermaPuntos = ev.kermaPuntos;
    energyKey = ev.energyKey;
    calculationTrace = trazaGrupo(b, sources, ev, scale_m_per_pixel, points.length);
    grupos = ev.esCiclotron ? [] : [{ clave: gruposFuentes[0].clave, fuentes: sources, t0: ev.requiredThickness }];
  } else {
    const evs = gruposFuentes.map((g) => ({ g, ev: evaluarGrupo(b, g.fuentes, points, scale_m_per_pixel, ctIsodosisProfile) }));
    const combinables = evs.filter((x) => !x.ev.esCiclotron);
    grupos = combinables.map(({ g, ev }) => ({ clave: g.clave, fuentes: g.fuentes, t0: ev.requiredThickness }));
    requiredThickness = {};
    if (combinables.length === 1) {
      Object.assign(requiredThickness, combinables[0].ev.requiredThickness);
    } else if (combinables.length > 1) {
      const curvas = grupos.map((g) => curvaGrupo(b, g, points, scale_m_per_pixel, ctIsodosisProfile));
      const materiales = Object.keys(curvas[0]).filter((m) => curvas.every((c) => c[m]));
      for (const m of materiales) requiredThickness[m] = resolverCombinado(curvas.map((c) => ({ t: c[m], credito: 0 })));
    }
    maxKerma = combinables.reduce((acc, x) => acc + x.ev.maxKerma, 0);
    kermaPuntos = points.map((_, i) => combinables.reduce((acc, x) => acc + (x.ev.kermaPuntos[i] ?? 0), 0));
    const maxDe = (r: Record<string, number>) => Math.max(0, ...Object.values(r).filter(Number.isFinite));
    const principal = combinables.length
      ? combinables.reduce((m, x) => (maxDe(x.ev.requiredThickness) > maxDe(m.ev.requiredThickness) ? x : m))
      : evs[0];
    energyKey = principal.ev.energyKey;
    calculationTrace = trazaGrupo(b, principal.g.fuentes, { ...principal.ev, requiredThickness, maxKerma }, scale_m_per_pixel, points.length);
    calculationTrace.sourceCount = sources.length;
    const trazas = evs.map(({ g, ev }) => ({ g, ev, t: trazaGrupo(b, g.fuentes, ev, scale_m_per_pixel, points.length) }));
    calculationTrace.formulaId = 'COMBINACION_POR_FUENTE';
    calculationTrace.standard = trazas.filter((x) => !x.ev.esCiclotron).map((x) => String(x.t.standard)).join(' + ') || calculationTrace.standard;
    const vistas = new Set(calculationTrace.assumptions);
    calculationTrace.assumptions = [
      ...calculationTrace.assumptions,
      `Método por fuente: ${evs.length} grupos de método; cada uno con su norma y los grupos combinados por suma de transmisiones (Σ K_g·B_g(x) ≤ P/T, curva B_g(x) a P, P/10, P/100 y P/1000).`,
      ...trazas.map(({ g, ev, t }) => `Grupo «${g.clave}» (${g.fuentes.map((s) => s.name || s.id).join(', ')}): ${ev.esCiclotron ? 'ciclotrón, sin espesor del motor genérico (módulo KIUBE o Monte Carlo)' : `${t.standard}; por sí solo PB ${(ev.requiredThickness.PB ?? Number.NaN).toFixed(2)} mm / concreto ${(ev.requiredThickness.CONCRETE235 ?? Number.NaN).toFixed(1)} mm`}.`),
      ...trazas.filter((x) => !x.ev.esCiclotron).flatMap((x) => x.t.assumptions.filter((a) => !vistas.has(a) && (vistas.add(a), true))),
    ];
    if (evs.some((x) => x.ev.esCiclotron)) {
      avisosExtra.push({ field: 'sources', severity: 'warning', message: 'El ciclotrón no entra en el espesor del motor genérico: el resultado cubre sólo las demás fuentes; verifique la bóveda con el módulo KIUBE o Monte Carlo.' });
    }
  }

  const calculationWarnings = [...getCalculationAuditWarnings({
    barrier: b,
    sources,
    scale_m_per_pixel,
    maxKerma_mSv_per_wk: maxKerma,
    materialCount: Object.keys(requiredThickness).length,
    samplePointCount: points.length,
    materials: MATERIALS,
    energyKey,
    minSourceDistance_m,
  }), ...avisosExtra];
  const T = Number.isFinite(b.occupancyFactor) && b.occupancyFactor > 0 && b.occupancyFactor <= 1 ? b.occupancyFactor : 1;
  const metaEfectiva = b.designGoal_mSv_per_wk / T;
  // Códigos del importador CAD («concreto», «plomo»…) → catálogo (Fase 4).
  const codigo = codigoCatalogo(b.materialCode);
  const selectedMaterial = MATERIALS.find((mat) => mat.code === codigo) ?? MATERIALS[0];
  const selectedThickness = typeof requiredThickness[codigo] === 'number'
    ? requiredThickness[codigo]
    : Math.max(0, ...Object.values(requiredThickness).filter(Number.isFinite));
  const unitSnapshot = buildCalculationUnitSnapshot({
    barrier: b,
    sources,
    material: selectedMaterial,
    scale_m_per_pixel,
    maxKerma_mSv_per_wk: maxKerma,
    selectedThickness_mm: selectedThickness,
    minSourceDistance_m,
  });
  const calculationComparison = buildConservativeCalculationComparison({
    baseThickness_mm: selectedThickness,
    maxKerma_mSv_per_wk: maxKerma,
    designGoal_mSv_per_wk: metaEfectiva,
    material: selectedMaterial,
    energyKey,
  });
  const calculationUnitSnapshot = {
    scale_m_per_pixel: unitSnapshot.length.scale_m_per_pixel,
    barrierLength_m: unitSnapshot.length.barrierLength_m,
    sampleOffset_m: unitSnapshot.length.sampleOffset_m,
    minSourceDistance_m: unitSnapshot.length.minSourceDistance_m,
    maxKerma_mSv_per_wk: unitSnapshot.dose.maxKerma_mSv_per_wk,
    maxKerma_uSv_per_h_40h: unitSnapshot.dose.maxKerma_uSv_per_h_40h,
    selectedThickness_mm: unitSnapshot.material.selectedThickness_mm,
    selectedThickness_cm: unitSnapshot.material.selectedThickness_cm,
    density_g_cm3: unitSnapshot.material.density_g_cm3,
    density_kg_m3: unitSnapshot.material.density_kg_m3,
    mass_kg_per_m2: unitSnapshot.material.mass_kg_per_m2,
    cost_per_m2: unitSnapshot.material.cost_per_m2,
    structuralLoad_kPa: unitSnapshot.material.structuralLoad_kPa,
  };
  const calculationCacheKey = buildCalculationCacheKey({
    id: `calc-${b.id}`,
    name: 'calculation-barrier',
    imageUrl: '',
    width_pixels: 0,
    height_pixels: 0,
    scale_m_per_pixel,
    barriers: [b],
    sources,
    occupiedRegions: [],
    criticalPoints: [],
  });

  const barrera: Barrier = { ...b, maxKerma, requiredThickness_mm: requiredThickness, calculationTrace, calculationWarnings, calculationComparison, calculationUnitSnapshot, calculationCacheKey };

  // Línea de muestreo para el lienzo: kerma sin blindaje del motor de campo por punto; el espesor es el requerido de
  // la barrera (el motor normativo resuelve el peor punto, no un espesor por punto).
  const pts: PuntoLinea[] = points.map((p, i) => ({ x: p.x, y: p.y, kermaRate: kermaPuntos[i], barrierThickness_mm: selectedThickness, material: codigo }));
  const maxKermaPoint = pts.reduce<PuntoLinea | null>((m, p) => (m === null || p.kermaRate > m.kermaRate ? p : m), null);
  return { barrera, linea: { barrierId: b.id, points: pts, maxKermaPoint, maxThicknessPoint: maxKermaPoint }, grupos, points };
}

// ─── Muros en serie (hallazgo 4: laberinto y muros dobles) ─────────────────────────────────────────────────────
// Antes cada barrera se resolvía sola: los dos muros de un laberinto pedían cada uno el espesor total. Ahora, si
// otras barreras cortan TODOS los rayos fuente → punto de muestreo de un grupo, su espesor (instalado si existe; si
// no, el requerido ya resuelto) se descuenta como crédito, convertido al material de la barrera por la razón de
// espesores requeridos del propio grupo. El crédito es el mínimo sobre los rayos (conservador): un muro que sólo
// tapa parte de la barrera no da crédito (pártala en el lienzo). No sustituye el cálculo de laberinto, puerta ni
// fotoneutrones de NCRP 151 §2.4.

function cruce(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number): { t: number; u: number } | null {
  const rx = bx - ax, ry = by - ay, sx = dx - cx, sy = dy - cy;
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-12) return null;
  const qx = cx - ax, qy = cy - ay;
  return { t: (qx * sy - qy * sx) / den, u: (qx * ry - qy * rx) / den };
}

/** Barreras que corta el rayo fuente → punto antes de cruzar la barrera `b`. */
export function barrerasEntre(b: Barrier, todas: Barrier[], fuente: { x: number; y: number }, punto: { x: number; y: number }): Barrier[] {
  const propio = cruce(fuente.x, fuente.y, punto.x, punto.y, b.x1, b.y1, b.x2, b.y2);
  const tB = propio ? propio.t : 1;
  const eps = 1e-6;
  return todas.filter((o) => {
    if (o.id === b.id) return false;
    const c = cruce(fuente.x, fuente.y, punto.x, punto.y, o.x1, o.y1, o.x2, o.y2);
    return c !== null && c.t > eps && c.t < tB - eps && c.u > eps && c.u < 1 - eps;
  });
}

function espesorSeleccionado(b: Barrier): { mm: number; material: string } | null {
  const material = codigoCatalogo(b.materialCode);
  if (Number.isFinite(b.thickness_mm) && (b.thickness_mm as number) > 0) return { mm: b.thickness_mm as number, material };
  const r = b.requiredThickness_mm;
  if (r && typeof r === 'object' && Number.isFinite(r[material])) return { mm: r[material], material };
  return null;
}

function aplicarMurosEnSerie(calculos: Calculo[], scale_m_per_pixel: number, ct?: CTIsodosisProfile): Calculo[] {
  const porId = new Map(calculos.map((c) => [c.barrera.id, c]));
  const barreras = calculos.map((c) => c.barrera);
  const finales = new Map<string, Calculo>();
  const enCurso = new Set<string>();

  const resolver = (c: Calculo): Calculo => {
    const id = c.barrera.id;
    const hecho = finales.get(id);
    if (hecho) return hecho;
    if (enCurso.has(id) || !c.grupos.length || !c.points.length) return c;
    enCurso.add(id);
    // Por grupo: las barreras intermedias de cada rayo (fuente del grupo → punto de muestreo).
    const intermediasPorGrupo = c.grupos.map((g) => g.fuentes.flatMap((s) => c.points.map((p) => barrerasEntre(c.barrera, barreras, s, p))));
    const conCredito = intermediasPorGrupo.some((rayos) => rayos.length > 0 && rayos.every((r) => r.length > 0));
    if (!conCredito) { enCurso.delete(id); finales.set(id, c); return c; }

    const espesorDe = new Map<string, { mm: number; material: string; nombre: string }>();
    for (const rayos of intermediasPorGrupo) {
      if (!rayos.every((r) => r.length > 0)) continue;
      for (const r of rayos) for (const o of r) {
        if (espesorDe.has(o.id)) continue;
        const oc = porId.get(o.id);
        const e = espesorSeleccionado(oc ? resolver(oc).barrera : o);
        if (e && e.mm > 0) espesorDe.set(o.id, { ...e, nombre: o.name || o.id });
      }
    }
    enCurso.delete(id);

    const b = c.barrera;
    const materiales = Object.keys(c.grupos[0].t0).filter((m) => c.grupos.every((g) => Number.isFinite(g.t0[m])));
    const credito = (gi: number, m: string): number => {
      const g = c.grupos[gi];
      const rayos = intermediasPorGrupo[gi];
      if (!rayos.length || !rayos.every((r) => r.length > 0)) return 0;
      let min = Infinity;
      for (const rayo of rayos) {
        let suma = 0;
        for (const o of rayo) {
          const e = espesorDe.get(o.id);
          if (!e) continue;
          if (e.material === m) { suma += e.mm; continue; }
          const tm = g.t0[m], te = g.t0[e.material];
          if (tm > 0 && te > 0) suma += e.mm * (tm / te);
        }
        min = Math.min(min, suma);
      }
      return Number.isFinite(min) ? min : 0;
    };
    const original = (b.requiredThickness_mm && typeof b.requiredThickness_mm === 'object' ? b.requiredThickness_mm : {}) as Record<string, number>;
    const nuevo: Record<string, number> = { ...original };
    const cambios: string[] = [];
    for (const m of materiales) {
      const cr = c.grupos.map((_, gi) => credito(gi, m));
      if (cr.every((x) => x <= 0)) continue;
      if (c.grupos.length === 1) {
        nuevo[m] = Math.max(0, c.grupos[0].t0[m] - cr[0]);
      } else {
        const curvas = c.grupos.map((g) => curvaGrupo(b, g, c.points, scale_m_per_pixel, ct));
        if (!curvas.every((cv) => cv[m])) continue;
        nuevo[m] = resolverCombinado(curvas.map((cv, gi) => ({ t: cv[m], credito: cr[gi] })));
      }
      if (m === 'PB' || m === 'CONCRETE235' || m === codigoCatalogo(b.materialCode)) {
        cambios.push(`${m}: ${Number.isFinite(original[m]) ? original[m].toFixed(2) : '—'} → ${nuevo[m].toFixed(2)} mm`);
      }
    }
    const nombres = [...espesorDe.values()].map((e) => `${e.nombre} (${e.mm.toFixed(1)} mm ${e.material})`);
    const trace = b.calculationTrace
      ? { ...b.calculationTrace, assumptions: [...b.calculationTrace.assumptions, `Muros en serie: entre la fuente y el punto está(n) ${nombres.join(', ')}; su espesor se descuenta del total (crédito mínimo sobre los rayos). ${cambios.join('; ')}.`] }
      : b.calculationTrace;
    const codigo = codigoCatalogo(b.materialCode);
    const sel = typeof nuevo[codigo] === 'number' ? nuevo[codigo] : Math.max(0, ...Object.values(nuevo).filter(Number.isFinite));
    const barrera: Barrier = { ...b, requiredThickness_mm: nuevo, calculationTrace: trace };
    const pts = c.linea.points.map((p) => ({ ...p, barrierThickness_mm: sel }));
    const maxKermaPoint = pts.reduce<PuntoLinea | null>((mx, p) => (mx === null || p.kermaRate > mx.kermaRate ? p : mx), null);
    const out: Calculo = { ...c, barrera, linea: { ...c.linea, points: pts, maxKermaPoint, maxThicknessPoint: maxKermaPoint } };
    finales.set(id, out);
    return out;
  };
  return calculos.map(resolver);
}

export interface OpcionesMotor {
  /** Descontar muros en serie (laberinto, muros dobles). Por omisión true. */
  murosEnSerie?: boolean;
}

/** Motor validado por barrera (antes `useShieldingEngine().calculateAllBarriers`). */
export function calcularBarrerasValidadas(
  barriers: Barrier[],
  sources: RadiationSource[],
  scale_m_per_pixel: number,
  ctIsodosisProfile?: CTIsodosisProfile,
  opciones: OpcionesMotor = {},
): Barrier[] {
  if (!sources.length) return barriers;
  const calculos = barriers.map((b) => calcularUna(b, sources, scale_m_per_pixel, ctIsodosisProfile));
  return (opciones.murosEnSerie === false ? calculos : aplicarMurosEnSerie(calculos, scale_m_per_pixel, ctIsodosisProfile)).map((c) => c.barrera);
}

/** Resultado por barrera derivado de la barrera ya calculada (sin recalcular). */
export function resultadoDeBarrera(b: Barrier): ResultadoBarrera {
  const r = (b.requiredThickness_mm && typeof b.requiredThickness_mm === 'object' ? b.requiredThickness_mm : {}) as Record<string, number>;
  const codigo = codigoCatalogo(b.materialCode);
  const valores = Object.values(r).filter(Number.isFinite);
  const seleccionado = typeof r[codigo] === 'number' ? r[codigo] : Math.max(0, ...valores);
  const v = verificarBarrera(b);
  return {
    barrierId: b.id,
    barrierName: b.name,
    maxKermaRate_mGy_per_wk: b.maxKerma ?? 0,
    maxBarrierThickness_mm: seleccionado,
    thicknessLead_mm: r.PB ?? 0,
    thicknessConcrete_mm: r.CONCRETE235 ?? 0,
    material: codigo,
    location: b.calculationTrace?.standard ? String(b.calculationTrace.standard) : 'Motor normativo',
    estado: v.estado,
    pass: v.estado === 'CUMPLE',
    designGoal: b.designGoal_mSv_per_wk,
    motor: MOTOR_PROYECTO,
  };
}

export interface ResultadoProyecto {
  barriers: Barrier[];
  barrierResults: ResultadoBarrera[];
  sampleLines: LineaMuestreo[];
  resumen: ReturnType<typeof verificarPlano>['resumen'];
}

function armar(plan: FloorPlan, pares: { barrera: Barrier; linea: LineaMuestreo }[]): ResultadoProyecto {
  const barriers = pares.map((p) => p.barrera);
  return {
    barriers,
    barrierResults: barriers.map(resultadoDeBarrera),
    sampleLines: pares.map((p) => p.linea),
    resumen: verificarPlano({ ...plan, barriers }).resumen,
  };
}

/** Cálculo completo del proyecto (síncrono). */
export function calcularProyecto(plan: FloorPlan, ctIsodosisProfile?: CTIsodosisProfile, opciones: OpcionesMotor = {}): ResultadoProyecto {
  if (!plan.sources.length) return armar(plan, plan.barriers.map((b) => ({ barrera: b, linea: { barrierId: b.id, points: [], maxKermaPoint: null, maxThicknessPoint: null } })));
  const calculos = plan.barriers.map((b) => calcularUna(b, plan.sources, plan.scale_m_per_pixel, ctIsodosisProfile));
  return armar(plan, opciones.murosEnSerie === false ? calculos : aplicarMurosEnSerie(calculos, plan.scale_m_per_pixel, ctIsodosisProfile));
}

/**
 * Misma función por barrera que `calcularProyecto`, cediendo el hilo entre barreras para que la interfaz responda y
 * avisando del progreso (0–100). `signal` permite cancelar.
 */
export async function calcularProyectoAsync(
  plan: FloorPlan,
  opciones: { ctIsodosisProfile?: CTIsodosisProfile; onProgress?: (pct: number) => void; signal?: AbortSignal } & OpcionesMotor = {},
): Promise<ResultadoProyecto> {
  if (!plan.sources.length) return calcularProyecto(plan, opciones.ctIsodosisProfile, opciones);
  const pares: Calculo[] = [];
  for (let i = 0; i < plan.barriers.length; i++) {
    if (opciones.signal?.aborted) throw new Error('Cálculo cancelado');
    pares.push(calcularUna(plan.barriers[i], plan.sources, plan.scale_m_per_pixel, opciones.ctIsodosisProfile));
    opciones.onProgress?.(Math.round(((i + 1) / plan.barriers.length) * 100));
    if (i < plan.barriers.length - 1) await new Promise<void>((r) => setTimeout(r, 0));
  }
  return armar(plan, opciones.murosEnSerie === false ? pares : aplicarMurosEnSerie(pares, plan.scale_m_per_pixel, opciones.ctIsodosisProfile));
}
