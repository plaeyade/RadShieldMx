/**
 * Consulta directa a GAMMA-AI, el motor científico del ecosistema.
 *
 * Hay dos caminos y ambos devuelven evidencia `gamma/evidencia@1` verificada aquí, recalculando el
 * SHA-256 de cada fragmento (src/lib/gammaEvidence.ts):
 * - En vivo: `gamma ecosistema servir` expone `GET /v1/ecosistema/evidencia`. La URL viene de
 *   `VITE_GAMMA_URL`, por ejemplo http://127.0.0.1:8765.
 * - Sin servicio: un paquete `gamma/paquete_evidencia@1` generado por GAMMA y versionado en
 *   `src/data/gamma-evidencia-memoria.json`. Incluye la evidencia por sección de la memoria y el
 *   catálogo de fuentes (título y emisor).
 *
 * Toda evidencia de GAMMA es experimental y no apta para firma. La memoria la presenta como
 * respaldo documental verificable, no como validación del cálculo.
 */
import {
  formatearCitaParaMemoria,
  verificarEvidenciaGamma,
  type CitaVerificada,
  type ResultadoEvidencia,
} from '@/lib/gammaEvidence';

export const CONTRATO_PAQUETE = 'gamma/paquete_evidencia@1';

export interface FuenteGamma {
  titulo: string;
  emisor?: string;
  sha256?: string;
}

export interface ConsultaVerificada {
  id: string;
  seccion: string;
  consulta: string;
  resultado: ResultadoEvidencia;
}

export interface PaqueteVerificado {
  valido: boolean;
  errores: string[];
  generado_utc?: string;
  incluyeEnRevision: boolean;
  consultas: ConsultaVerificada[];
  fuentes: Record<string, FuenteGamma>;
}

/** Valida el paquete y verifica cada evidencia. Nunca lanza. */
export async function verificarPaqueteGamma(datos: unknown): Promise<PaqueteVerificado> {
  const vacio: PaqueteVerificado = { valido: false, errores: [], incluyeEnRevision: false, consultas: [], fuentes: {} };
  if (typeof datos !== 'object' || datos === null) return { ...vacio, errores: ['El paquete no es un objeto JSON.'] };
  const d = datos as Record<string, unknown>;
  const errores: string[] = [];
  if (d.contrato !== CONTRATO_PAQUETE) errores.push(`contrato debe ser ${CONTRATO_PAQUETE}`);
  if (!Array.isArray(d.consultas)) errores.push('consultas debe ser una lista');
  const fuentes = (typeof d.fuentes === 'object' && d.fuentes !== null ? d.fuentes : {}) as Record<string, FuenteGamma>;
  const consultas: ConsultaVerificada[] = [];
  for (const [i, bruto] of (Array.isArray(d.consultas) ? d.consultas : []).entries()) {
    const c = (typeof bruto === 'object' && bruto !== null ? bruto : {}) as Record<string, unknown>;
    const resultado = await verificarEvidenciaGamma(c.evidencia);
    if (!resultado.valida) errores.push(`consulta ${String(c.id ?? i + 1)}: ${resultado.errores.join('; ')}`);
    consultas.push({
      id: String(c.id ?? i + 1),
      seccion: String(c.seccion ?? ''),
      consulta: String(resultado.evidencia?.consulta ?? (c.evidencia as { consulta?: string } | undefined)?.consulta ?? ''),
      resultado,
    });
  }
  return {
    valido: errores.length === 0,
    errores,
    generado_utc: typeof d.generado_utc === 'string' ? d.generado_utc : undefined,
    incluyeEnRevision: d.incluye_en_revision === true,
    consultas,
    fuentes,
  };
}

export interface OpcionesConsulta {
  url?: string;
  k?: number;
  /** Incluye documentos aún en revisión en GAMMA (lo declara el perfil de la evidencia). */
  revision?: boolean;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

export function urlGamma(): string | undefined {
  const url = import.meta.env.VITE_GAMMA_URL as string | undefined;
  return url && url.trim() ? url.trim().replace(/\/+$/, '') : undefined;
}

/** Consulta en vivo al servicio de GAMMA. Si no hay URL o falla, lo dice en `errores`. */
export async function consultarGamma(consulta: string, op: OpcionesConsulta = {}): Promise<ResultadoEvidencia> {
  const base = (op.url ?? urlGamma())?.replace(/\/+$/, '');
  if (!base) return { valida: false, errores: ['GAMMA no configurado (VITE_GAMMA_URL)'], citas: [] };
  const params = new URLSearchParams({ q: consulta, k: String(op.k ?? 5), revision: op.revision ? '1' : '0' });
  const control = new AbortController();
  const t = setTimeout(() => control.abort(), op.timeoutMs ?? 8000);
  try {
    const r = await (op.fetchFn ?? fetch)(`${base}/v1/ecosistema/evidencia?${params}`, { signal: control.signal });
    if (!r.ok) return { valida: false, errores: [`GAMMA respondió ${r.status}`], citas: [] };
    return await verificarEvidenciaGamma(await r.json());
  } catch (e) {
    return { valida: false, errores: [`GAMMA no disponible: ${(e as Error).message}`], citas: [] };
  } finally {
    clearTimeout(t);
  }
}

/** Referencia legible: «fuente (emisor), p. N» + la cita verificable de GAMMA. */
export function referenciaDocumental(c: CitaVerificada, fuentes: Record<string, FuenteGamma>): string {
  const f = fuentes[c.source_id];
  const nombre = f ? `${f.titulo}${f.emisor ? ` (${f.emisor})` : ''}` : c.source_id;
  return `${nombre}${c.pagina ? `, p. ${c.pagina}` : ''}: ${formatearCitaParaMemoria(c)}`;
}

/**
 * Texto de la sección de evidencia de la memoria, agrupado por sección del documento.
 * Sólo usa citas verificadas; una consulta sin evidencia se declara como pendiente.
 */
export function seccionEvidenciaMemoria(p: PaqueteVerificado, maxCitas = 2): string[] {
  const lineas: string[] = [];
  if (!p.valido) lineas.push(`Paquete de evidencia con errores: ${p.errores.join(' | ')}`);
  if (p.incluyeEnRevision) {
    lineas.push('Incluye documentos que en GAMMA están EN REVISIÓN (indexado aún no aprobado).');
  }
  const porSeccion = new Map<string, ConsultaVerificada[]>();
  for (const c of p.consultas) porSeccion.set(c.seccion, [...(porSeccion.get(c.seccion) ?? []), c]);
  for (const [seccion, cs] of porSeccion) {
    lineas.push(`Sección ${seccion || 'general'}`);
    for (const c of cs) {
      const citas = c.resultado.citas.filter((x) => x.verificada).slice(0, maxCitas);
      if (!citas.length) {
        lineas.push(`• ${c.consulta}: sin evidencia en GAMMA (pendiente).`);
        continue;
      }
      for (const cita of citas) lineas.push(`• ${referenciaDocumental(cita, p.fuentes)}`);
    }
  }
  return lineas;
}
