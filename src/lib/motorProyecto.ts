/**
 * Fase 11 — motor único de cálculo del proyecto.
 *
 * Toda ruta de cálculo del diseñador (barra superior «Calcular Blindaje», asistente «Guíame», «Calc» de la barra
 * lateral, tecla F5, botones «Calcular» del lienzo, cálculo preliminar de un DXF confirmado, cálculo por lotes) pasa
 * por `calcularBarrerasValidadas`: puntos de muestreo de `shieldingMath`, kerma sin blindaje del motor de campo
 * (`doseFieldEngine`, TG-108 para PET), espesores de `normativeBarrierEngine` (NCRP 147 diagnóstico y TC, NCRP 151
 * teleterapia; PET con la curva de banda ancha de TG-108 a 511 keV, `espesorPET511`) y trazas de auditoría. El estado de cumplimiento es el de `verificarBarrera` (instalado ≥ requerido,
 * sólo con traza del motor).
 *
 * Sustituye a `AsyncShieldingEngine` (Fase 10, hallazgo crítico): aquel worker serializaba sólo posición, carga y
 * factor de uso, y aplicaba un TVL fijo de plomo de 16.6 mm sin modalidad, energía ni TG-108. La asincronía que
 * aportaba (no bloquear la interfaz y avisar del progreso) la da aquí `calcularProyectoAsync`, que cede el hilo entre
 * barreras y ejecuta exactamente la misma función por barrera.
 */
import { MATERIALS, type Barrier, type FloorPlan, type RadiationSource } from '@/types/radshield';
import type { CTIsodosisProfile } from '@/types/ctIsodosis';
import {
  inverseArcher,
  tvlThickness,
  exponentialThickness,
  generateSamplePoints,
  buildCalculationTrace,
  buildCalculationUnitSnapshot,
  buildConservativeCalculationComparison,
  getCalculationAuditWarnings,
  getShieldingEnergyKey,
} from '@/lib/shieldingMath';
import { buildCalculationCacheKey } from '@/lib/calculationCacheKey';
import { espesorPET511 } from '@/lib/transmisionTG108';
import { calcularBarreraNormativa } from '@/lib/normativeBarrierEngine';
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

function calcularUna(
  b: Barrier,
  sources: RadiationSource[],
  scale_m_per_pixel: number,
  ctIsodosisProfile?: CTIsodosisProfile,
): { barrera: Barrier; linea: LineaMuestreo } {
  const vacia: LineaMuestreo = { barrierId: b.id, points: [], maxKermaPoint: null, maxThicknessPoint: null };
  const points = generateSamplePoints(b, scale_m_per_pixel, sources);
  if (!points.length) return { barrera: b, linea: vacia };

  let maxKerma = 0;
  let minSourceDistance_m = Infinity;
  const kermaPuntos: number[] = [];
  for (const p of points) {
    for (const s of sources) {
      const dx = (p.x - s.x) * scale_m_per_pixel;
      const dy = (p.y - s.y) * scale_m_per_pixel;
      const dz = s.isocenterHeight_m || 0;
      minSourceDistance_m = Math.min(minSourceDistance_m, Math.sqrt(dx * dx + dy * dy + dz * dz));
    }
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
  for (const mat of esCiclotron ? [] : MATERIALS) {
    let thickness = 0;
    if (sources[0]?.modality.category === 'diagnostic') {
      const B = Math.max(1e-10, metaEfectiva / (maxKerma || 1));
      thickness = inverseArcher(B, mat);
    } else if (sources[0]?.modality.category === 'therapy') {
      thickness = tvlThickness(maxKerma, metaEfectiva, mat, energyKey);
    } else if (energyKey === '511keV') {
      // PET: curva de banda ancha de AAPM TG-108 (Tabla V) invertida numéricamente, no un TVL único (Fase 11, etapa 8).
      thickness = espesorPET511(maxKerma, metaEfectiva, mat);
    } else {
      thickness = exponentialThickness(maxKerma, metaEfectiva, mat, energyKey);
    }
    if (thickness > 0) requiredThickness[mat.code] = thickness;
  }
  // NCRP 147 (diagnóstico) y NCRP 151 (teleterapia MV) sustituyen al punto-kernel cuando aplican.
  const normativo = esCiclotron ? null : calcularBarreraNormativa(b, sources, points, scale_m_per_pixel, MATERIALS, ctIsodosisProfile);
  if (normativo) {
    for (const k of Object.keys(requiredThickness)) delete requiredThickness[k];
    Object.assign(requiredThickness, normativo.espesores_mm);
    maxKerma = normativo.kermaMax_mSv_semana;
  }

  const calculationTrace = buildCalculationTrace({
    barrier: b,
    sources,
    scale_m_per_pixel,
    maxKerma_mSv_per_wk: maxKerma,
    requiredThickness_mm: requiredThickness,
    samplePointCount: points.length,
  });
  if (normativo) {
    calculationTrace.formulaId = normativo.metodo === 'NCRP147' ? 'NCRP147_TABLES_4.5_4.7_B1_C1' : 'NCRP151_PRIMARY_LEAKAGE_SCATTER';
    calculationTrace.standard = normativo.metodo;
    calculationTrace.assumptions = [...calculationTrace.assumptions, ...normativo.notas];
  }
  const calculationWarnings = getCalculationAuditWarnings({
    barrier: b,
    sources,
    scale_m_per_pixel,
    maxKerma_mSv_per_wk: maxKerma,
    materialCount: Object.keys(requiredThickness).length,
    samplePointCount: points.length,
    materials: MATERIALS,
    energyKey,
    minSourceDistance_m,
  });
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
  return { barrera, linea: { barrierId: b.id, points: pts, maxKermaPoint, maxThicknessPoint: maxKermaPoint } };
}

/** Motor validado por barrera (antes `useShieldingEngine().calculateAllBarriers`). */
export function calcularBarrerasValidadas(
  barriers: Barrier[],
  sources: RadiationSource[],
  scale_m_per_pixel: number,
  ctIsodosisProfile?: CTIsodosisProfile,
): Barrier[] {
  if (!sources.length) return barriers;
  return barriers.map((b) => calcularUna(b, sources, scale_m_per_pixel, ctIsodosisProfile).barrera);
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
export function calcularProyecto(plan: FloorPlan, ctIsodosisProfile?: CTIsodosisProfile): ResultadoProyecto {
  if (!plan.sources.length) return armar(plan, plan.barriers.map((b) => ({ barrera: b, linea: { barrierId: b.id, points: [], maxKermaPoint: null, maxThicknessPoint: null } })));
  return armar(plan, plan.barriers.map((b) => calcularUna(b, plan.sources, plan.scale_m_per_pixel, ctIsodosisProfile)));
}

/**
 * Misma función por barrera que `calcularProyecto`, cediendo el hilo entre barreras para que la interfaz responda y
 * avisando del progreso (0–100). `signal` permite cancelar.
 */
export async function calcularProyectoAsync(
  plan: FloorPlan,
  opciones: { ctIsodosisProfile?: CTIsodosisProfile; onProgress?: (pct: number) => void; signal?: AbortSignal } = {},
): Promise<ResultadoProyecto> {
  if (!plan.sources.length) return calcularProyecto(plan, opciones.ctIsodosisProfile);
  const pares: { barrera: Barrier; linea: LineaMuestreo }[] = [];
  for (let i = 0; i < plan.barriers.length; i++) {
    if (opciones.signal?.aborted) throw new Error('Cálculo cancelado');
    pares.push(calcularUna(plan.barriers[i], plan.sources, plan.scale_m_per_pixel, opciones.ctIsodosisProfile));
    opciones.onProgress?.(Math.round(((i + 1) / plan.barriers.length) * 100));
    if (i < plan.barriers.length - 1) await new Promise<void>((r) => setTimeout(r, 0));
  }
  return armar(plan, pares);
}
