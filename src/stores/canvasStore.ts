/**
 * Canvas Store — alias del almacén único del proyecto (Fase 12, paso 1).
 *
 * Antes era un segundo almacén con su propio `floorPlan` e historial que ShieldingDesigner sincronizaba en ambos
 * sentidos con efectos. Ahora `useCanvasStore === useProyectoStore`: los diálogos que lo importan leen y escriben
 * el mismo plano que el lienzo, sin eco ni copias.
 */
export { useProyectoStore as useCanvasStore, type ProyectoState as CanvasState } from './proyecto';
