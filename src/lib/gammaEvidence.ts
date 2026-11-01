/**
 * Consumidor del contrato `gamma/evidencia@1` (ADR-0034 de GAMMA-AI).
 *
 * GAMMA devuelve citas de documentos fuente (fichas IBA, NOM, NCRP, estudios de obra). Cada cita
 * trae el SHA-256 del documento y del texto citado, así que aquí se recalcula ese hash: una cita
 * cuyo texto se alteró después de salir de GAMMA queda marcada como NO verificada. La evidencia
 * siempre es experimental y no apta para firma; si el archivo dice lo contrario, se rechaza.
 */

export const CONTRATO_EVIDENCIA = 'gamma/evidencia@1';
export const ESTADO_EVIDENCIA = 'experimental_sin_validacion_clinica';
export const MAX_TEXTO_CITA = 1200;

export interface GammaCita {
  source_id: string;
  sha256_documento: string;
  pagina: number | null;
  fragmento_sha256: string;
  texto: string;
  puntaje?: number | null;
}

export interface GammaEvidencia {
  contrato: typeof CONTRATO_EVIDENCIA;
  consulta: string;
  perfil: string;
  generado_utc: string;
  estado: typeof ESTADO_EVIDENCIA;
  no_apto_para_firma: true;
  citas: GammaCita[];
}

export interface CitaVerificada extends GammaCita {
  verificada: boolean;
  motivo?: string;
}

export interface ResultadoEvidencia {
  valida: boolean;
  errores: string[];
  evidencia?: GammaEvidencia;
  citas: CitaVerificada[];
}

const SHA256 = /^[0-9a-f]{64}$/;

export async function sha256Hex(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(texto);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function sourceIdPara(sha256Documento: string): string {
  return `source_${sha256Documento.slice(0, 32)}`;
}

const esTexto = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/** Valida estructura y política; luego verifica cada cita contra su hash. Nunca lanza. */
export async function verificarEvidenciaGamma(datos: unknown): Promise<ResultadoEvidencia> {
  const errores: string[] = [];
  if (typeof datos !== 'object' || datos === null) {
    return { valida: false, errores: ['El archivo no es un objeto JSON.'], citas: [] };
  }
  const d = datos as Record<string, unknown>;
  if (d.contrato !== CONTRATO_EVIDENCIA) errores.push(`contrato debe ser ${CONTRATO_EVIDENCIA}`);
  if (!esTexto(d.consulta)) errores.push('consulta es obligatoria');
  if (!esTexto(d.perfil)) errores.push('perfil es obligatorio');
  if (!esTexto(d.generado_utc) || Number.isNaN(Date.parse(String(d.generado_utc)))) {
    errores.push('generado_utc debe ser una fecha ISO 8601');
  }
  if (d.estado !== ESTADO_EVIDENCIA) errores.push('la evidencia de GAMMA no puede declararse validada');
  if (d.no_apto_para_firma !== true) errores.push('no_apto_para_firma debe ser true');
  if (!Array.isArray(d.citas)) errores.push('citas debe ser una lista');

  const citas: CitaVerificada[] = [];
  for (const [i, bruto] of (Array.isArray(d.citas) ? d.citas : []).entries()) {
    const c = (typeof bruto === 'object' && bruto !== null ? bruto : {}) as Record<string, unknown>;
    const cita: CitaVerificada = {
      source_id: String(c.source_id ?? ''),
      sha256_documento: String(c.sha256_documento ?? ''),
      pagina: typeof c.pagina === 'number' ? c.pagina : null,
      fragmento_sha256: String(c.fragmento_sha256 ?? ''),
      texto: String(c.texto ?? ''),
      puntaje: typeof c.puntaje === 'number' ? c.puntaje : null,
      verificada: false,
    };
    if (!SHA256.test(cita.sha256_documento)) cita.motivo = 'sha256_documento inválido';
    else if (cita.source_id !== sourceIdPara(cita.sha256_documento)) cita.motivo = 'source_id no corresponde al documento';
    else if (!esTexto(cita.texto) || cita.texto.length > MAX_TEXTO_CITA) cita.motivo = 'texto vacío o demasiado largo';
    else if (c.pagina !== null && c.pagina !== undefined && !(Number.isInteger(c.pagina) && Number(c.pagina) >= 1)) {
      cita.motivo = 'página inválida';
    } else if ((await sha256Hex(cita.texto)) !== cita.fragmento_sha256) {
      cita.motivo = 'el texto no coincide con su hash: fue alterado después de salir de GAMMA';
    } else cita.verificada = true;
    if (!cita.verificada) errores.push(`cita ${i + 1}: ${cita.motivo}`);
    citas.push(cita);
  }
  const valida = errores.length === 0;
  return { valida, errores, evidencia: valida ? (d as unknown as GammaEvidencia) : undefined, citas };
}

/** Referencia para memorias: cita breve con el identificador verificable de la fuente. */
export function formatearCitaParaMemoria(c: GammaCita): string {
  const pagina = c.pagina ? `, p. ${c.pagina}` : '';
  return `«${c.texto}» [GAMMA ${c.source_id}${pagina}; SHA-256 ${c.fragmento_sha256.slice(0, 12)}…; evidencia experimental, no apta para firma]`;
}
