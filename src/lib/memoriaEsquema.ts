/**
 * Esquema del contrato `radshield/memoria@1` (Fase 12, paso 3).
 *
 * La memoria analítica es la fuente única de los documentos de memoria y CNSNS: DOCX, PDF y JSON se generan del mismo
 * objeto (`construirMemoria`) y un JSON importado se valida con este esquema antes de volver a exportarlo. Los objetos
 * son estrictos: un campo de más o de menos rechaza el documento. `docs/esquemas/radshield-memoria-1.schema.json` es
 * su versión JSON Schema (draft 2020-12), generada con `z.toJSONSchema` y comprobada en las pruebas.
 *
 * Sin dependencias de la app (sólo zod): la importan la prueba E2E y el diálogo de memoria.
 */
import { z } from 'zod';

const num = z.number();
const numNulo = z.number().nullable();
const texto = z.string();
const estado = z.enum(['CUMPLE', 'NO_CUMPLE', 'SIN_CALCULO', 'SIN_ESPESOR', 'REVISAR_MATERIAL']);
const zona = z.enum(['controlada', 'no controlada']);

export const EsquemaFuenteMemoria = z.strictObject({
  id: texto,
  nombre: texto,
  modalidad: texto.optional(),
  modalidadId: texto.optional(),
  categoria: texto,
  metodo: texto,
  posicion_m: z.strictObject({ x: num, y: num }),
  alturaFuente_m: num,
  carga: texto,
  detalleCarga: z.record(texto, z.union([num, texto])),
});

export const EsquemaOcupacionMemoria = z.strictObject({
  id: texto,
  area: texto,
  tipo: z.enum(['barrera', 'region']),
  zona,
  T: num,
  P_mSv_semana: num,
  P_T_mSv_semana: numNulo,
  limiteDerivado_uSv_h: numNulo,
});

export const EsquemaBarreraMemoria = z.strictObject({
  id: texto,
  punto: texto,
  area: texto,
  nombre: texto,
  tipo: z.enum(['primary', 'secondary', 'leakage', 'scatter', 'nuclear']),
  material: texto,
  U: num,
  T: num,
  P_mSv_semana: num,
  zona,
  kermaSinBlindaje_mSv_semana: numNulo,
  requerido_mm: numNulo,
  requeridoPb_mm: numNulo,
  requeridoConcreto_mm: numNulo,
  instalado_mm: numNulo,
  margen_mm: numNulo,
  estado,
  nota: texto,
  norma: texto,
  formula: texto,
  hipotesis: z.array(texto),
  avisos: z.array(texto),
});

export const EsquemaMemoria = z.strictObject({
  contrato: z.literal('radshield/memoria@1'),
  id: texto,
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  origen: z.strictObject({ proyecto: texto, app: texto, fecha: z.iso.datetime(), motor: texto }),
  preliminar: z.literal(true),
  instalacion: z.strictObject({
    nombre: texto,
    razonSocial: texto,
    domicilio: texto,
    responsableSR: texto,
    elaboro: texto,
    revision: texto,
    tipoInstalacion: texto,
    clasificacionNOM003: texto,
    nivel: texto,
    actividades: z.array(texto),
    colindancias: z.array(z.strictObject({ orientacion: texto, descripcion: texto })),
    escala_m_px: num,
  }),
  objetivo: texto,
  alcance: texto,
  marcoNormativo: z.array(z.strictObject({ id: texto, titulo: texto, aplica: texto })),
  fuentes: z.array(EsquemaFuenteMemoria),
  ocupaciones: z.array(EsquemaOcupacionMemoria),
  criterios: z.array(z.strictObject({ id: texto, texto })),
  metodo: z.strictObject({
    normas: z.array(texto),
    descripcion: z.array(texto),
    formulas: z.array(z.strictObject({ id: texto, expresion: texto, donde: texto })),
  }),
  barreras: z.array(EsquemaBarreraMemoria),
  resultadosPorArea: z.array(z.strictObject({ area: texto, barreras: z.array(texto), cumplen: num, total: num, conclusion: texto })),
  conclusiones: z.strictObject({ cumplen: num, total: num, sinCalculo: num, sinEspesor: num, noCumplen: num, textos: z.array(texto) }),
  referencias: z.array(z.strictObject({ id: texto, cita: texto })),
  advertencias: z.array(texto),
});

export type MemoriaSegunEsquema = z.infer<typeof EsquemaMemoria>;

/** Errores del documento frente al esquema (`[]` si es válido), con la ruta de cada campo. */
export function erroresEsquemaMemoria(doc: unknown): string[] {
  const r = EsquemaMemoria.safeParse(doc);
  if (r.success) return [];
  return r.error.issues.map((i) => `${i.path.join('.') || '(raíz)'}: ${i.message}`);
}

/** JSON Schema (draft 2020-12) del contrato, para validadores externos. */
export function jsonSchemaMemoria(): Record<string, unknown> {
  return {
    $id: 'https://github.com/plaeyade/RadShieldMx/docs/esquemas/radshield-memoria-1.schema.json',
    title: 'radshield/memoria@1',
    description: 'Memoria analítica de blindaje (NOM-040-NUCL-2016 §4.8) generada por RadShield-MX; DOCX y PDF se generan de este objeto.',
    ...z.toJSONSchema(EsquemaMemoria),
  };
}
