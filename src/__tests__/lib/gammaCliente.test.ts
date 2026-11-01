import { describe, expect, it, vi } from 'vitest';
import paquete from '@/data/gamma-evidencia-memoria.json';
import evidenciaFixture from '../fixtures/gamma-evidencia.json';
import {
  consultarGamma,
  referenciaDocumental,
  seccionEvidenciaMemoria,
  verificarPaqueteGamma,
} from '@/lib/gammaCliente';

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
    const r = await consultarGamma('dosis', { url: 'http://127.0.0.1:8765/', k: 3, revision: true, fetchFn });
    expect(fetchFn).toHaveBeenCalledWith(
      'http://127.0.0.1:8765/v1/ecosistema/evidencia?q=dosis&k=3&revision=1',
      expect.anything(),
    );
    expect(r.valida).toBe(true);
    expect(referenciaDocumental(r.citas[0], {})).toContain(r.citas[0].source_id);
  });

  it('errores HTTP o de red no lanzan', async () => {
    const caido = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    expect((await consultarGamma('x', { url: 'http://g', fetchFn: caido })).errores[0]).toMatch(/no disponible/);
    const r500 = vi.fn(async () => new Response('{}', { status: 500 }));
    expect((await consultarGamma('x', { url: 'http://g', fetchFn: r500 })).errores[0]).toMatch(/500/);
  });
});
