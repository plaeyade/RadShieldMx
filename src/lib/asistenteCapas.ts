/**
 * Fase 12, paso 4 — asistente de capas DWG/DXF.
 *
 * Al importar un plano, cada capa recibe una PROPUESTA (rol, material y espesor) por las reglas explícitas de
 * `cadBimBridge` (`inferDxfLayerRole`, `REGLAS_MATERIAL_CAPA`, `espesorDeclaradoCapa`) o, si la capa ya se decidió
 * antes, por el mapeo guardado en el proyecto. El usuario confirma o edita capa por capa (también «ignorar capa»)
 * y el resultado se traduce a las opciones del importador. El mapeo se guarda en el almacén único del proyecto
 * (`useProyectoStore().mapeosCapas`) y en `floorPlan.importMetadata.mapeoCapas`, para reutilizarlo en otro plano.
 */
import type { DXFParsed } from '@/lib/dxfParser';
import { espesorDeclaradoCapa, inferirMaterialCapa, nombreLocalCapa, REGLAS_MATERIAL_CAPA } from '@/lib/medical3D/cadBimBridge';
import { inferDxfLayerRole, type F213DxfLayerRole } from '@/lib/f213DxfLayerMappingQa';
import type { DecisionCapa, MapeoCapas, RolCapa } from './asistenteCapasTipos';

export type { DecisionCapa, MapeoCapas, RolCapa } from './asistenteCapasTipos';

// Los dos conjuntos de roles deben coincidir (error de compilación si divergen).
type Igual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const ROLES_EQUIVALENTES: Igual<RolCapa, F213DxfLayerRole> = true;
void ROLES_EQUIVALENTES;

export type OrigenPropuesta = 'regla' | 'omision' | 'guardado' | 'usuario';

export interface FilaCapa extends DecisionCapa {
  nombre: string;
  color: number;
  entidades: number;
  /** LINE + LWPOLYLINE: lo que se convierte en barrera. */
  lineales: number;
  /** Conteo por tipo de entidad («LINE»: 4, «TEXT»: 2…). */
  porTipo: Record<string, number>;
  origen: OrigenPropuesta;
  /** Id de la regla de material que coincidió («plomo», «pb-espesor»…) u «omision». */
  regla: string;
  /** Propuesta original por reglas (para «restablecer»). */
  propuesta: DecisionCapa;
}

export const MATERIALES_CAPA: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'concreto', label: 'Concreto' },
  { value: 'concreto_baritado', label: 'Concreto baritado' },
  { value: 'plomo', label: 'Plomo' },
  { value: 'vidrio_plomo', label: 'Vidrio plomado' },
  { value: 'acero', label: 'Acero' },
  { value: 'tungsteno', label: 'Tungsteno' },
  { value: 'NIPOL350', label: 'NIPOL 3.5' },
  { value: 'NIPOL400', label: 'NIPOL 4.0' },
  { value: 'NIPOL500', label: 'NIPOL 5.0' },
];

export const ROLES_CAPA: ReadonlyArray<{ value: F213DxfLayerRole; label: string }> = [
  { value: 'barrier', label: 'Muro' },
  { value: 'equipment', label: 'Equipo' },
  { value: 'zone', label: 'Zona' },
  { value: 'dimension', label: 'Cota' },
  { value: 'reference', label: 'Ref' },
  { value: 'text', label: 'Texto' },
  { value: 'unmapped', label: 'Sin rol' },
];

export const descripcionRegla = (id: string): string =>
  REGLAS_MATERIAL_CAPA.find((r) => r.id === id)?.descripcion ?? 'sin regla: concreto por omisión';

/** Propuesta por reglas, sin mapeos previos. */
export function propuestaPorReglas(nombre: string): DecisionCapa & { regla: string; declarado: boolean } {
  const mat = inferirMaterialCapa(nombre);
  const rol = inferDxfLayerRole(nombre);
  return {
    // Una capa sin rol cuyo nombre declara un material de blindaje («VENTANA_VIDRIO_PLOMADO») se propone como muro.
    rol: rol === 'unmapped' && mat.declarado ? 'barrier' : rol,
    material: mat.material,
    espesor_mm: espesorDeclaradoCapa(nombreLocalCapa(nombre)),
    ignorada: false,
    regla: mat.regla,
    declarado: mat.declarado,
  };
}

/**
 * Filas del asistente: una por capa del plano, con su conteo de entidades y la propuesta. Una capa con el mismo
 * nombre en un mapeo previo (el más reciente primero) toma esa decisión y queda marcada como «guardado».
 */
export function proponerCapas(parsed: DXFParsed, previos: ReadonlyArray<MapeoCapas> = []): FilaCapa[] {
  return Array.from(parsed.layers.values()).map((capa) => {
    const porTipo: Record<string, number> = {};
    for (const e of capa.entities) porTipo[e.type] = (porTipo[e.type] ?? 0) + 1;
    const p = propuestaPorReglas(capa.name);
    const propuesta: DecisionCapa = { rol: p.rol, material: p.material, espesor_mm: p.espesor_mm, ignorada: false };
    const guardada = previos.find((m) => m.capas[capa.name])?.capas[capa.name];
    const base = {
      nombre: capa.name,
      color: capa.color,
      entidades: capa.entities.length,
      lineales: (porTipo.LINE ?? 0) + (porTipo.LWPOLYLINE ?? 0),
      porTipo,
      regla: p.regla,
      propuesta,
    };
    return guardada
      ? { ...base, ...guardada, origen: 'guardado' as const }
      : { ...base, ...propuesta, origen: p.declarado ? 'regla' as const : 'omision' as const };
  });
}

/** Rol efectivo (una capa ignorada no tiene rol). */
export const rolEfectivo = (d: Pick<DecisionCapa, 'rol' | 'ignorada'>): F213DxfLayerRole => (d.ignorada ? 'unmapped' : d.rol);

/** Edita una fila; la marca como decisión del usuario. */
export function editarFila(filas: FilaCapa[], nombre: string, cambio: Partial<DecisionCapa>): FilaCapa[] {
  return filas.map((f) => (f.nombre === nombre ? { ...f, ...cambio, origen: 'usuario' } : f));
}

/** Vuelve a la propuesta por reglas. */
export function restablecerFila(filas: FilaCapa[], nombre: string): FilaCapa[] {
  return filas.map((f) => (f.nombre === nombre ? { ...f, ...f.propuesta, origen: propuestaPorReglas(f.nombre).declarado ? 'regla' : 'omision' } : f));
}

/** Opciones del importador (`importParsedDXFToFloorPlan`) a partir de las decisiones. */
export function opcionesImportacion(filas: ReadonlyArray<FilaCapa>) {
  const layerRoleOverrides: Record<string, F213DxfLayerRole> = {};
  const layerMaterialOverrides: Record<string, string> = {};
  const layerThicknessOverrides: Record<string, number | null> = {};
  for (const f of filas) {
    layerRoleOverrides[f.nombre] = rolEfectivo(f);
    if (rolEfectivo(f) !== 'barrier') continue;
    layerMaterialOverrides[f.nombre] = f.material;
    layerThicknessOverrides[f.nombre] = f.espesor_mm;
  }
  return { layerRoleOverrides, layerMaterialOverrides, layerThicknessOverrides };
}

/** Mapeo guardable (sólo la decisión, sin conteos). */
export function mapeoDesdeFilas(archivo: string, filas: ReadonlyArray<FilaCapa>, ahora = new Date()): MapeoCapas {
  return {
    id: `mapeo-${archivo}`,
    archivo,
    actualizado: ahora.toISOString(),
    capas: Object.fromEntries(filas.map((f) => [f.nombre, { rol: f.rol, material: f.material, espesor_mm: f.espesor_mm, ignorada: f.ignorada }])),
  };
}

/** Resumen para la cabecera del asistente. */
export function resumenCapas(filas: ReadonlyArray<FilaCapa>) {
  const muros = filas.filter((f) => rolEfectivo(f) === 'barrier');
  return {
    capas: filas.length,
    muros: muros.length,
    ignoradas: filas.filter((f) => f.ignorada).length,
    porRevisar: muros.filter((f) => f.origen === 'omision').length,
    segmentosMuro: muros.reduce((s, f) => s + f.lineales, 0),
  };
}

/** Espesor escrito por el usuario → mm (vacío, 0 o inválido = null). */
export function leerEspesor(texto: string): number | null {
  const v = Number(String(texto).replace(',', '.'));
  return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
}
