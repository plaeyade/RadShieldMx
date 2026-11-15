/**
 * Fase 12, paso 4 — tipos del mapeo de capas (sin dependencias del DOM ni del lector DXF), para que `FloorPlan` los
 * pueda referenciar desde `@/types/radshield` sin arrastrar el lector y su dibujo en canvas a los tsconfig de servidor.
 */

/** Rol de una capa (mismo conjunto que `F213DxfLayerRole`; `asistenteCapas.ts` comprueba la equivalencia). */
export type RolCapa = 'barrier' | 'equipment' | 'zone' | 'dimension' | 'reference' | 'text' | 'unmapped';

/** Decisión del usuario (o propuesta aceptada) para una capa. */
export interface DecisionCapa {
  rol: RolCapa;
  /** Código de material del importador («concreto», «plomo»…) o del catálogo («NIPOL500»). */
  material: string;
  /** Espesor instalado declarado (mm); null = sin espesor declarado (se calcula el requerido). */
  espesor_mm: number | null;
  /** La capa no se importa (ni como barrera ni como referencia). */
  ignorada: boolean;
}

/** Mapeo de capas guardado (por archivo), reutilizable por nombre de capa en otros planos. */
export interface MapeoCapas {
  id: string;
  archivo: string;
  actualizado: string;
  capas: Record<string, DecisionCapa>;
}
