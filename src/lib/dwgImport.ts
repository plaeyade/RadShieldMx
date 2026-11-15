/**
 * Importación DWG directa en el navegador (hallazgo 11 de la auditoría independiente 2026-11).
 *
 * El DWG se convierte a DXF dentro de la página con LibreDWG compilado a WebAssembly
 * (`@mlightcad/libredwg-web`, versión fija en `package.json`). El módulo y su `.wasm` (~11 MB) se cargan de forma
 * diferida, sólo cuando el usuario abre un DWG: no pesan en el arranque. El plano no sale del navegador.
 *
 * Licencia: LibreDWG y su enlace web son GPL-3.0; se distribuyen como un fragmento aparte que la app sólo pide al
 * importar un DWG.
 */
import { isDWGFile } from '@/lib/dxfParser';

/** Versión fija del convertidor (debe coincidir con `package.json`). */
export const LIBREDWG_WEB_VERSION = '0.8.2';

export interface ConversionDWG {
  dxf: string;
  ms: number;
  bytesDwg: number;
  bytesDxf: number;
  convertidor: string;
}

interface LibreDwgLike {
  dwg_write_dxf(fileContent: ArrayBuffer): Uint8Array | null;
}

type CargadorLibreDwg = () => Promise<LibreDwgLike>;

let instancia: Promise<LibreDwgLike> | null = null;

/** Carga diferida del módulo WebAssembly (una sola vez por sesión). */
const cargarPorOmision: CargadorLibreDwg = async () => {
  const mod = await import('@mlightcad/libredwg-web');
  return mod.LibreDwg.create() as unknown as Promise<LibreDwgLike>;
};

let cargador: CargadorLibreDwg = cargarPorOmision;

/** Sólo para pruebas: sustituye el cargador del convertidor. */
export function _fijarCargadorLibreDwg(c: CargadorLibreDwg | null) {
  cargador = c ?? cargarPorOmision;
  instancia = null;
}

/**
 * Decodifica el DXF que escribe LibreDWG. Los DXF R2007+ son UTF-8; los anteriores usan la página de códigos del
 * dibujo (casi siempre ANSI_1252 en México): si el UTF-8 no es válido se cae a windows-1252.
 */
export function decodificarDXF(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

export async function convertirDWGaDXF(buffer: ArrayBuffer): Promise<ConversionDWG> {
  if (!isDWGFile(buffer)) throw new Error('El archivo no tiene la firma de un DWG («AC10xx»).');
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  instancia ??= cargador();
  let lib: LibreDwgLike;
  try {
    lib = await instancia;
  } catch (e) {
    instancia = null;
    throw new Error(`No se pudo cargar el convertidor DWG (LibreDWG ${LIBREDWG_WEB_VERSION}): ${(e as Error).message}`);
  }
  const out = lib.dwg_write_dxf(buffer);
  if (!out || !out.length) throw new Error('LibreDWG no pudo convertir el DWG (versión no soportada o archivo dañado). Exporte el plano como DXF desde el CAD.');
  const dxf = decodificarDXF(out);
  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return { dxf, ms: t1 - t0, bytesDwg: buffer.byteLength, bytesDxf: out.length, convertidor: `libredwg-web@${LIBREDWG_WEB_VERSION}` };
}
