// @vitest-environment node
/**
 * Hallazgo 11 (auditoría independiente 2026-11): importación DWG directa en el navegador con LibreDWG-wasm (carga diferida).
 * Sin DWG de cliente en el repositorio: el convertidor se sustituye por un doble; con
 * `RADSHIELD_DWG_FIXTURE_PATH` apuntando a un DWG local se prueba también la conversión real.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { _fijarCargadorLibreDwg, convertirDWGaDXF, decodificarDXF, LIBREDWG_WEB_VERSION } from '@/lib/dwgImport';
import { parseDXF } from '@/lib/dxfParser';

const firmaDWG = () => {
  const u = new Uint8Array(64);
  u.set([...'AC1032'].map((c) => c.charCodeAt(0)));
  return u.buffer;
};
const DXF_MINIMO = '0\nSECTION\n2\nENTITIES\n0\nLINE\n8\nMUROS\n10\n0\n20\n0\n11\n5\n21\n0\n0\nENDSEC\n0\nEOF\n';

afterEach(() => _fijarCargadorLibreDwg(null));

describe('convertirDWGaDXF', () => {
  it('la versión fija coincide con package.json', () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    expect(pkg.dependencies['@mlightcad/libredwg-web']).toBe(LIBREDWG_WEB_VERSION);
  });

  it('rechaza un archivo sin firma DWG sin cargar el convertidor', async () => {
    let cargas = 0;
    _fijarCargadorLibreDwg(async () => { cargas++; return { dwg_write_dxf: () => null }; });
    await expect(convertirDWGaDXF(new Uint8Array([1, 2, 3, 4, 5, 6]).buffer)).rejects.toThrow(/firma/);
    expect(cargas).toBe(0);
  });

  it('carga el convertidor una sola vez y devuelve un DXF que el parser lee', async () => {
    let cargas = 0;
    _fijarCargadorLibreDwg(async () => { cargas++; return { dwg_write_dxf: () => new TextEncoder().encode(DXF_MINIMO) }; });
    const a = await convertirDWGaDXF(firmaDWG());
    await convertirDWGaDXF(firmaDWG());
    expect(cargas).toBe(1);
    expect(a.convertidor).toBe(`libredwg-web@${LIBREDWG_WEB_VERSION}`);
    expect(parseDXF(a.dxf).entities).toHaveLength(1);
  });

  it('error de conversión y error de carga con mensaje claro (y se reintenta la carga)', async () => {
    _fijarCargadorLibreDwg(async () => ({ dwg_write_dxf: () => null }));
    await expect(convertirDWGaDXF(firmaDWG())).rejects.toThrow(/no pudo convertir/);
    let intentos = 0;
    _fijarCargadorLibreDwg(async () => { intentos++; throw new Error('wasm 404'); });
    await expect(convertirDWGaDXF(firmaDWG())).rejects.toThrow(/No se pudo cargar el convertidor DWG.*wasm 404/);
    await expect(convertirDWGaDXF(firmaDWG())).rejects.toThrow(/wasm 404/);
    expect(intentos).toBe(2);
  });

  it('decodifica UTF-8 y, si no es válido, windows-1252', () => {
    expect(decodificarDXF(new TextEncoder().encode('PROTECCIÓN'))).toBe('PROTECCIÓN');
    expect(decodificarDXF(new Uint8Array([0x50, 0xd3]))).toBe('PÓ');
  });

  const FIXTURE = process.env.RADSHIELD_DWG_FIXTURE_PATH;
  it.skipIf(!FIXTURE || !existsSync(FIXTURE))('conversión real con LibreDWG-wasm (DWG local, fuera del repositorio)', async () => {
    const raiz = join(process.cwd(), 'node_modules', '@mlightcad', 'libredwg-web');
    // `src/test/setup.ts` sustituye WebAssembly por un doble: se usa el real de otro contexto de V8.
    const { runInNewContext } = await import('node:vm');
    const doble = globalThis.WebAssembly;
    globalThis.WebAssembly = runInNewContext('WebAssembly');
    _fijarCargadorLibreDwg(async () => {
      const mod = await import('@mlightcad/libredwg-web');
      return mod.LibreDwg.create(join(raiz, 'wasm')) as never;
    });
    const buf = readFileSync(FIXTURE!);
    const r = await convertirDWGaDXF(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    globalThis.WebAssembly = doble;
    const p = parseDXF(r.dxf);
    expect(p.entities.length).toBeGreaterThan(0);
  }, 120_000);
});
