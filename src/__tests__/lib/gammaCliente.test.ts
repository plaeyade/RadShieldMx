import { describe, expect, it, vi } from 'vitest';
import paquete from '@/data/gamma-evidencia-memoria.json';
import evidenciaFixture from '../fixtures/gamma-evidencia.json';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  borrarTokenGamma,
  consultarGamma,
  destinoSeguroParaToken,
  establecerTokenGamma,
  hayTokenGamma,
  referenciaDocumental,
  seccionEvidenciaMemoria,
  verificarPaqueteGamma,
} from '@/lib/gammaCliente';

const TOKEN = 't'.repeat(40);

describe('paquete gamma/paquete_evidencia@1 versionado para la memoria', () => {
  it('todas las citas se verifican contra su SHA-256 y traen página', async () => {
    const p = await verificarPaqueteGamma(paquete);
    expect(p.errores).toEqual([]);
    expect(p.valido).toBe(true);
    expect(p.consultas.length).toBeGreaterThanOrEqual(8);
    for (const c of p.consultas) {
      expect(c.resultado.citas.length).toBeGreaterThan(0);
      expect(c.resultado.citas.every((x) => x.verificada && x.pagina !== null)).toBe(true);
    }
  });

  it('una cita alterada invalida el paquete', async () => {
    const copia = structuredClone(paquete) as typeof paquete;
    copia.consultas[0].evidencia.citas[0].texto += ' (editado)';
    const p = await verificarPaqueteGamma(copia);
    expect(p.valido).toBe(false);
    expect(p.errores[0]).toMatch(/alterado/);
  });

  it('la sección de la memoria agrupa por sección y nombra fuente y página', async () => {
    const lineas = seccionEvidenciaMemoria(await verificarPaqueteGamma(paquete));
    expect(lineas).toContain('Sección 5.2');
    expect(lineas.some((l) => /, p\. \d+: «/.test(l) && l.includes('no apta para firma'))).toBe(true);
    expect(lineas.some((l) => l.includes('EN REVISIÓN'))).toBe(true);
  });
});

describe('consulta en vivo a GAMMA', () => {
  it('sin URL no consulta y lo declara', async () => {
    const r = await consultarGamma('use factor', { url: '' });
    expect(r.valida).toBe(false);
    expect(r.errores[0]).toMatch(/VITE_GAMMA_URL/);
  });

  it('verifica la respuesta del servicio', async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify(evidenciaFixture), { status: 200 }));
    const r = await consultarGamma('dosis', { url: 'http://127.0.0.1:8765/', k: 3, revision: true, fetchFn, token: TOKEN });
    expect(fetchFn).toHaveBeenCalledWith(
      'http://127.0.0.1:8765/v1/ecosistema/evidencia?q=dosis&k=3&revision=1',
      expect.objectContaining({ headers: { Authorization: `Bearer ${TOKEN}` }, cache: 'no-store', credentials: 'omit' }),
    );
    expect(r.valida).toBe(true);
    expect(referenciaDocumental(r.citas[0], {})).toContain(r.citas[0].source_id);
  });

  it('errores HTTP o de red no lanzan', async () => {
    const caido = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    expect((await consultarGamma('x', { url: 'http://localhost:8765', fetchFn: caido, token: TOKEN })).errores[0]).toMatch(/no disponible/);
    const r500 = vi.fn(async () => new Response('{}', { status: 500 }));
    expect((await consultarGamma('x', { url: 'http://localhost:8765', fetchFn: r500, token: TOKEN })).errores[0]).toMatch(/500/);
  });
});

describe('token Bearer del servicio de evidencia (GAMMA-AI #80)', () => {
  const ok = () => vi.fn(async () => new Response(JSON.stringify(evidenciaFixture), { status: 200 }));

  it('sin token no llama al servicio y explica dónde escribirlo', async () => {
    borrarTokenGamma();
    const fetchFn = ok();
    const r = await consultarGamma('x', { url: 'http://127.0.0.1:8765', fetchFn });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(r.errores[0]).toMatch(/requiere un token/);
  });

  it('token corto (< 32) no se envía', async () => {
    const fetchFn = ok();
    const r = await consultarGamma('x', { url: 'http://127.0.0.1:8765', fetchFn, token: 'corto' });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(r.errores[0]).toMatch(/demasiado corto/);
  });

  it('no envía el token en claro a un host que no sea loopback', async () => {
    const fetchFn = ok();
    const r = await consultarGamma('x', { url: 'http://192.168.1.20:8765', fetchFn, token: TOKEN });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(r.errores[0]).toMatch(/en claro/);
    expect(destinoSeguroParaToken('http://127.0.0.1:8765')).toBe(true);
    expect(destinoSeguroParaToken('http://[::1]:8765')).toBe(true);
    expect(destinoSeguroParaToken('http://localhost:8765')).toBe(true);
    expect(destinoSeguroParaToken('https://gamma.ejemplo.mx')).toBe(true);
    expect(destinoSeguroParaToken('http://gamma.local:8765')).toBe(false);
    expect(destinoSeguroParaToken('no es url')).toBe(false);
  });

  it('401 se informa como token rechazado', async () => {
    const r401 = vi.fn(async () => new Response('', { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }));
    const r = await consultarGamma('x', { url: 'http://127.0.0.1:8765', fetchFn: r401, token: TOKEN });
    expect(r.valida).toBe(false);
    expect(r.errores[0]).toMatch(/rechazó el token \(401\)/);
  });

  it('el token de la sesión vive sólo en memoria y se puede olvidar', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    establecerTokenGamma(`  ${TOKEN}  `);
    expect(hayTokenGamma()).toBe(true);
    const fetchFn = ok();
    await consultarGamma('x', { url: 'http://127.0.0.1:8765', fetchFn });
    expect(fetchFn).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: { Authorization: `Bearer ${TOKEN}` } }));
    expect(setItem).not.toHaveBeenCalled();
    borrarTokenGamma();
    expect(hayTokenGamma()).toBe(false);
    setItem.mockRestore();
  });

  it('ni el código ni el build público llevan un token: ninguna VITE_* de token, ni almacenamiento en el cliente', () => {
    const raiz = join(__dirname, '..', '..', '..');
    const archivos = (dir: string): string[] => readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) return n === '__tests__' ? [] : archivos(p);
      return /\.(ts|tsx)$/.test(n) ? [p] : [];
    });
    const conToken = archivos(join(raiz, 'src')).filter((p) => /VITE_GAMMA_TOKEN|GAMMA_EVIDENCIA_TOKEN|VITE_[A-Z_]*TOKEN[A-Z_]*GAMMA/.test(readFileSync(p, 'utf-8')));
    expect(conToken).toEqual([]);
    const cliente = readFileSync(join(raiz, 'src', 'lib', 'gammaCliente.ts'), 'utf-8')
      .split('\n').filter((l) => !/^\s*(\*|\/\/)/.test(l)).join('\n');
    expect(cliente).not.toMatch(/localStorage|sessionStorage|indexedDB/);
    // El build de Pages no define la URL del servicio: la consulta en vivo queda desactivada.
    const flujos = join(raiz, '.github', 'workflows');
    for (const f of readdirSync(flujos)) expect(readFileSync(join(flujos, f), 'utf-8')).not.toMatch(/GAMMA_(URL|EVIDENCIA_TOKEN)|VITE_GAMMA/);
  });
});
