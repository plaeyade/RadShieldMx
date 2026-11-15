/**
 * Flujo único de memoria analítica y CNSNS (Fase 12, paso 3).
 *
 * Antes había seis rutas que producían «la memoria» por su cuenta: el asistente «Memoria IA» (texto con valores típicos
 * de una tabla interna, en HTML/TXT), el asistente paso a paso `memoriaWizard`, el diálogo CNSNS (.docx de
 * `useCNSNSReport`), «Exportar PDF» (`usePDFGenerator`), el reporte CNSNS en HTML (`reporteCNSNSHtml`), el reporte
 * regulatorio y el exportador «batch». Ahora todas las entradas abren el mismo diálogo (`memoria`) y cada documento
 * —DOCX, PDF y JSON— se genera del MISMO objeto `radshield/memoria@1` que arma `construirMemoria` (o del JSON
 * importado, validado contra `memoriaEsquema`).
 */
import type { FloorPlan } from '@/types/radshield';
import { verificarBarrera } from '@/lib/verificacionBlindaje';
import { leerMemoriaJSON, memoriaAJSON, POR_COMPLETAR, verificarSelloMemoria, type MemoriaAnalitica } from '@/lib/memoriaAnalitica';
import { erroresEsquemaMemoria } from '@/lib/memoriaEsquema';

export type FormatoMemoria = 'docx' | 'pdf' | 'json';

export const MIME_MEMORIA: Record<FormatoMemoria, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  json: 'application/json',
};

/** Barreras calculadas por el motor (con traza); el requerido que trae un DXF desde la capa no cuenta. */
export function barrerasCalculadas(plano: FloorPlan) {
  return plano.barriers.filter((b) => b.calculationTrace && verificarBarrera(b).estado !== 'SIN_CALCULO');
}

/** Nombre de archivo de la memoria: proyecto y fecha del propio documento (`origen.fecha`). */
export function nombreArchivoMemoria(m: MemoriaAnalitica, formato: FormatoMemoria): string {
  const proyecto = (m.origen.proyecto || 'proyecto').replace(/[^\w-]+/g, '_');
  return `Memoria_analitica_${proyecto}_${m.origen.fecha.slice(0, 10)}.${formato}`;
}

/** Única salida de la memoria: los tres formatos salen del mismo objeto (docx y jsPDF se cargan al pedirlos). */
export async function salidaMemoria(m: MemoriaAnalitica, formato: FormatoMemoria): Promise<Blob> {
  if (formato === 'json') return new Blob([memoriaAJSON(m)], { type: MIME_MEMORIA.json });
  const x = await import('@/lib/memoriaAnaliticaExport');
  return formato === 'docx' ? x.memoriaADocxBlob(m) : x.memoriaAPdfBlob(m);
}

export interface MemoriaImportada {
  memoria: MemoriaAnalitica;
  selloValido: boolean;
}

/** Lee un JSON `radshield/memoria@1`: contrato, esquema y sello. Lanza un error legible si no es válido. */
export function importarMemoriaJSON(texto: string): MemoriaImportada {
  const memoria = leerMemoriaJSON(texto);
  const errores = erroresEsquemaMemoria(memoria);
  if (errores.length) throw new Error(`No cumple el esquema radshield/memoria@1: ${errores.slice(0, 3).join('; ')}${errores.length > 3 ? ` (+${errores.length - 3})` : ''}`);
  return { memoria, selloValido: verificarSelloMemoria(memoria) };
}

/** Datos de la instalación que siguen «Por completar» (los pide el asistente antes de exportar). */
export function camposPorCompletar(m: MemoriaAnalitica): string[] {
  const etiquetas: Record<string, string> = {
    nombre: 'Nombre de la instalación', razonSocial: 'Razón social', domicilio: 'Domicilio', responsableSR: 'Encargado de seguridad radiológica',
    elaboro: 'Elaboró', tipoInstalacion: 'Tipo de instalación', clasificacionNOM003: 'Clasificación NOM-003', nivel: 'Nivel o planta',
  };
  return Object.entries(etiquetas).filter(([k]) => (m.instalacion as unknown as Record<string, unknown>)[k] === POR_COMPLETAR).map(([, v]) => v);
}
