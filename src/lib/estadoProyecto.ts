/**
 * Fase 9 — estado real del proyecto para los diálogos que en la Fase 8c sólo se rotularon como «datos de ejemplo»
 * (tableros, bitácoras, análisis requerido-instalado, envío CNSNS y comparadores de escenarios).
 *
 * Todo sale del `FloorPlan` que capturó el usuario: barreras, fuentes, metadatos de importación y el espesor requerido
 * que calculó el motor normativo (`requiredThickness_mm` + `calculationTrace`, NCRP 147/151 o TG-108). La verificación
 * es la de `verificarBarrera` (cumple sólo si instalado ≥ requerido). Lo que el proyecto no registra no se inventa: se
 * devuelve vacío o «Por completar».
 */
import type { Barrier, FloorPlan, ModalityCategory } from '@/types/radshield';
import { verificarBarrera, verificarPlano, type EstadoVerificacion, type FilaVerificacion } from './verificacionBlindaje';

// ─────────────────────────────────────────────────────────────────────────────
// Bitácora derivada del plano (sin servidor no hay registro de usuarios ni sesiones).
// ─────────────────────────────────────────────────────────────────────────────

export type TipoEventoPlano = 'import' | 'validate' | 'calc' | 'warning';

export interface EventoPlano {
  id: string;
  /** ISO 8601, tal como lo guardó el plano. */
  fecha: string;
  tipo: TipoEventoPlano;
  accion: string;
  detalle: string;
}

/** Eventos con fecha que guarda el propio plano (`importMetadata`): importación, confirmación y último cálculo. */
export function eventosDelPlano(plano: FloorPlan): EventoPlano[] {
  const m = plano.importMetadata;
  if (!m) return [];
  const ev: EventoPlano[] = [];
  if (m.importedAt) {
    ev.push({
      id: 'import', fecha: m.importedAt, tipo: 'import', accion: 'Plano importado',
      detalle: [m.fileName, m.source?.toUpperCase(), m.mappedBarriers !== undefined ? `${m.mappedBarriers} barreras mapeadas` : null]
        .filter(Boolean).join(' · ') || 'Importación sin nombre de archivo',
    });
  }
  if (m.confirmedAt) ev.push({ id: 'confirm', fecha: m.confirmedAt, tipo: 'validate', accion: 'Importación confirmada', detalle: m.status === 'final' ? 'Estado final' : 'Estado preliminar' });
  if (m.calculatedAt) {
    ev.push({
      id: 'calc', fecha: m.calculatedAt, tipo: 'calc', accion: 'Cálculo de blindaje',
      detalle: [m.calculatedBarriers !== undefined ? `${m.calculatedBarriers} barreras calculadas` : null, m.calculationStatus, m.calculationMessage]
        .filter(Boolean).join(' · '),
    });
  }
  (m.warnings ?? []).forEach((w, i) => ev.push({ id: `warn-${i}`, fecha: m.importedAt ?? m.calculatedAt ?? '', tipo: 'warning', accion: 'Advertencia de importación', detalle: w }));
  return ev.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// ─────────────────────────────────────────────────────────────────────────────
// Tablero: barreras agrupadas por la modalidad con la que las calculó el motor.
// ─────────────────────────────────────────────────────────────────────────────

export const ETIQUETA_CATEGORIA: Record<ModalityCategory | 'unknown' | 'sin_calculo', string> = {
  diagnostic: 'Diagnóstico (NCRP 147)',
  therapy: 'Teleterapia / braquiterapia (NCRP 151)',
  nuclear: 'Medicina nuclear (TG-108)',
  cyclotron: 'Ciclotrón',
  other: 'Otra modalidad',
  unknown: 'Modalidad no identificada',
  sin_calculo: 'Sin cálculo del motor',
};

export interface ModuloProyecto {
  clave: keyof typeof ETIQUETA_CATEGORIA;
  nombre: string;
  barreras: number;
  cumplen: number;
  noCumplen: number;
  pendientes: number;
  requeridoMax_mm: number | null;
  normas: string[];
}

function claveModulo(b: Barrier): ModuloProyecto['clave'] {
  if (!b.calculationTrace) return 'sin_calculo';
  return b.calculationTrace.modalityCategory ?? 'unknown';
}

export function modulosDelPlano(plano: FloorPlan): ModuloProyecto[] {
  const grupos = new Map<ModuloProyecto['clave'], { b: Barrier; v: FilaVerificacion }[]>();
  for (const b of plano.barriers) {
    const k = claveModulo(b);
    grupos.set(k, [...(grupos.get(k) ?? []), { b, v: verificarBarrera(b) }]);
  }
  return Array.from(grupos.entries()).map(([clave, filas]) => {
    const req = filas.map((f) => f.v.requerido_mm).filter((x): x is number => x !== null);
    const cuenta = (e: EstadoVerificacion) => filas.filter((f) => f.v.estado === e).length;
    return {
      clave,
      nombre: ETIQUETA_CATEGORIA[clave],
      barreras: filas.length,
      cumplen: cuenta('CUMPLE'),
      noCumplen: cuenta('NO_CUMPLE'),
      pendientes: filas.length - cuenta('CUMPLE') - cuenta('NO_CUMPLE'),
      requeridoMax_mm: req.length ? Math.max(...req) : null,
      normas: Array.from(new Set(filas.map((f) => f.b.calculationTrace?.standard).filter((s): s is string => !!s))),
    };
  });
}

export interface ResumenProyecto {
  fuentes: number;
  barreras: number;
  calculadas: number;
  cumplen: number;
  noCumplen: number;
  pendientes: number;
  /** % de barreras que cumplen sobre el total (0 sin barreras). */
  cumplimiento: number;
  objetivoMax_mSv_semana: number | null;
  requeridoMax_mm: number | null;
}

export function resumenProyecto(plano: FloorPlan): ResumenProyecto {
  const v = verificarPlano(plano);
  const req = v.filas.map((f) => f.requerido_mm).filter((x): x is number => x !== null);
  const objetivos = plano.barriers.map((b) => b.designGoal_mSv_per_wk).filter((x) => Number.isFinite(x) && x > 0);
  return {
    fuentes: plano.sources.length,
    barreras: v.resumen.total,
    calculadas: req.length,
    cumplen: v.resumen.cumple,
    noCumplen: v.resumen.noCumple,
    pendientes: v.resumen.pendientes,
    cumplimiento: v.resumen.total ? Math.round((v.resumen.cumple / v.resumen.total) * 100) : 0,
    objetivoMax_mSv_semana: objetivos.length ? Math.max(...objetivos) : null,
    requeridoMax_mm: req.length ? Math.max(...req) : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Requerido (motor) contra instalado (declarado): sustituye al «log planificado vs entregado» ficticio.
// ─────────────────────────────────────────────────────────────────────────────

export interface FilaRequeridoInstalado extends FilaVerificacion {
  /** (instalado − requerido) / requerido × 100; null si falta alguno de los dos. */
  diferencia_pct: number | null;
}

export function requeridoContraInstalado(plano: FloorPlan): FilaRequeridoInstalado[] {
  return verificarPlano(plano).filas.map((f) => ({
    ...f,
    diferencia_pct: f.margen_mm !== null && f.requerido_mm ? (f.margen_mm / f.requerido_mm) * 100 : null,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Formulario de envío CNSNS prellenado desde el plano.
// ─────────────────────────────────────────────────────────────────────────────

export type EstadoCampo = 'complete' | 'pending' | 'error';
export interface CampoFormulario { label: string; value: string; status: EstadoCampo }
export interface SeccionFormulario { title: string; fields: CampoFormulario[] }

const POR_COMPLETAR = 'Por completar';
const mm = (v: number | null) => (v === null ? '—' : `${v.toFixed(0)} mm`);

export function formularioCNSNS(plano: FloorPlan): SeccionFormulario[] {
  const pendiente = (label: string): CampoFormulario => ({ label, value: POR_COMPLETAR, status: 'pending' });
  const fuentes: CampoFormulario[] = plano.sources.length
    ? plano.sources.map((s) => ({
      label: s.name || 'Fuente',
      value: [s.modality?.name ?? s.modality?.id, s.modality?.energyLabel, `${s.workloadValue} ${s.workloadUnit}`].filter(Boolean).join(' · '),
      status: 'complete' as const,
    }))
    : [{ label: 'Fuentes', value: 'Sin fuentes en el plano', status: 'error' }];
  const barreras: CampoFormulario[] = plano.barriers.length
    ? plano.barriers.map((b) => {
      const v = verificarBarrera(b);
      const status: EstadoCampo = v.estado === 'CUMPLE' ? 'complete' : v.estado === 'NO_CUMPLE' ? 'error' : 'pending';
      return { label: b.name || b.id, value: `${b.materialCode} · requerido ${mm(v.requerido_mm)} · instalado ${mm(v.instalado_mm)} · ${v.estado.replace('_', ' ')}`, status };
    })
    : [{ label: 'Barreras', value: 'Sin barreras en el plano', status: 'error' }];
  const normas = Array.from(new Set(plano.barriers.map((b) => b.calculationTrace?.standard).filter((s): s is string => !!s)));
  const objetivos = Array.from(new Set(plano.barriers.map((b) => b.designGoal_mSv_per_wk).filter((x) => x > 0)));
  const ocupacion = Array.from(new Set(plano.barriers.map((b) => b.occupancyFactor).filter((x) => x > 0)));
  const lista = (xs: (string | number)[], sufijo = '') => (xs.length ? xs.join(' / ') + sufijo : POR_COMPLETAR);
  return [
    { title: 'I. Datos generales', fields: [
      { label: 'Proyecto', value: plano.name || POR_COMPLETAR, status: plano.name ? 'complete' : 'pending' },
      pendiente('Nombre de la instalación'), pendiente('Dirección'), pendiente('Licencia CNSNS'), pendiente('Responsable'),
    ] },
    { title: 'II. Fuentes', fields: fuentes },
    { title: 'III. Blindaje', fields: barreras },
    { title: 'IV. Cálculos', fields: [
      { label: 'Metodología', value: lista(normas), status: normas.length ? 'complete' : 'pending' },
      { label: 'Factores de ocupación (T)', value: lista(ocupacion), status: ocupacion.length ? 'complete' : 'pending' },
      { label: 'Objetivos de diseño (P)', value: lista(objetivos, ' mSv/semana'), status: objetivos.length ? 'complete' : 'pending' },
    ] },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparación de dos estados del proyecto (escenario guardado contra el actual u otro guardado).
// ─────────────────────────────────────────────────────────────────────────────

export interface FilaComparacion {
  barrera: string;
  a: FilaVerificacion | null;
  b: FilaVerificacion | null;
  /** requerido_B − requerido_A (mm). */
  deltaRequerido_mm: number | null;
  /** instalado_B − instalado_A (mm). */
  deltaInstalado_mm: number | null;
}

export interface ComparacionPlanos {
  filas: FilaComparacion[];
  resumenA: ResumenProyecto;
  resumenB: ResumenProyecto;
}

/** Empareja las barreras por id (y, si no coincide, por nombre) y compara requerido, instalado y verificación. */
export function compararPlanos(a: FloorPlan, b: FloorPlan): ComparacionPlanos {
  const va = verificarPlano(a).filas, vb = verificarPlano(b).filas;
  const usadas = new Set<FilaVerificacion>();
  const filas: FilaComparacion[] = va.map((fa) => {
    const fb = vb.find((x) => !usadas.has(x) && x.barreraId === fa.barreraId) ?? vb.find((x) => !usadas.has(x) && x.barrera === fa.barrera) ?? null;
    if (fb) usadas.add(fb);
    return { barrera: fa.barrera, a: fa, b: fb, deltaRequerido_mm: dif(fa.requerido_mm, fb?.requerido_mm), deltaInstalado_mm: dif(fa.instalado_mm, fb?.instalado_mm) };
  });
  for (const fb of vb) if (!usadas.has(fb)) filas.push({ barrera: fb.barrera, a: null, b: fb, deltaRequerido_mm: null, deltaInstalado_mm: null });
  return { filas, resumenA: resumenProyecto(a), resumenB: resumenProyecto(b) };
}

function dif(a: number | null | undefined, b: number | null | undefined): number | null {
  return typeof a === 'number' && typeof b === 'number' ? b - a : null;
}

export const mmEntero = (v: number | null | undefined) => (typeof v === 'number' ? v.toFixed(0) : '—');
export const deltaMm = (v: number | null) => (v === null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(0)}`);

export function comparacionCSV(c: ComparacionPlanos, nombreA: string, nombreB: string): string {
  const h = ['Barrera', `Requerido_${nombreA}_mm`, `Requerido_${nombreB}_mm`, 'Delta_requerido_mm', `Instalado_${nombreA}_mm`, `Instalado_${nombreB}_mm`, 'Delta_instalado_mm', `Estado_${nombreA}`, `Estado_${nombreB}`];
  const filas = c.filas.map((f) => [f.barrera, mmEntero(f.a?.requerido_mm), mmEntero(f.b?.requerido_mm), deltaMm(f.deltaRequerido_mm), mmEntero(f.a?.instalado_mm), mmEntero(f.b?.instalado_mm), deltaMm(f.deltaInstalado_mm), f.a?.estado ?? '', f.b?.estado ?? '']);
  return [h, ...filas].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
}
