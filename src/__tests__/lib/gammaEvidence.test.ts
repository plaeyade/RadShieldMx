import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/gamma-evidencia.json';
import { formatearCitaParaMemoria, sha256Hex, verificarEvidenciaGamma } from '@/lib/gammaEvidence';

// La fixture la generó GAMMA-AI (gamma_domain.ecosystem.construir_evidencia) sobre el SRG de IBA
// registrado por Zumaya-AI: prueba que ambos lados del contrato hablan el mismo formato. Los textos
// de las citas son paráfrasis de prueba, no citas literales del documento.
const copia = () => JSON.parse(JSON.stringify(fixture));

describe('gamma/evidencia@1', () => {
  it('acepta y verifica la evidencia emitida por GAMMA (interoperabilidad Python ↔ TypeScript)', async () => {
    const r = await verificarEvidenciaGamma(copia());
    expect(r.errores).toEqual([]);
    expect(r.valida).toBe(true);
    expect(r.citas.every((c) => c.verificada)).toBe(true);
    expect(r.citas[0].source_id).toBe('source_b899b5034fa514181b99425e1f9cc523');
  });

  it('detecta texto alterado después de salir de GAMMA', async () => {
    const ev = copia();
    ev.citas[0].texto = ev.citas[0].texto.replace('1.8E8', '1.8E6');
    const r = await verificarEvidenciaGamma(ev);
    expect(r.valida).toBe(false);
    expect(r.citas[0].verificada).toBe(false);
    expect(r.citas[0].motivo).toContain('alterado');
    expect(r.citas[1].verificada).toBe(true);
  });

  it('rechaza evidencia que se declare validada o apta para firma', async () => {
    const ev = copia();
    ev.estado = 'validada';
    ev.no_apto_para_firma = false;
    const r = await verificarEvidenciaGamma(ev);
    expect(r.valida).toBe(false);
    expect(r.errores.join(' ')).toContain('no puede declararse validada');
    expect(r.errores.join(' ')).toContain('no_apto_para_firma');
  });

  it('rechaza source_id que no corresponde al documento y entradas no JSON', async () => {
    const ev = copia();
    ev.citas[1].source_id = `source_${'0'.repeat(32)}`;
    expect((await verificarEvidenciaGamma(ev)).citas[1].motivo).toContain('source_id');
    expect((await verificarEvidenciaGamma(null)).valida).toBe(false);
  });

  it('sha256Hex coincide con hashlib y la cita para memoria conserva la trazabilidad', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    const texto = formatearCitaParaMemoria(fixture.citas[0]);
    expect(texto).toContain('GAMMA source_b899b5034fa514181b99425e1f9cc523, p. 27');
    expect(texto).toContain('no apta para firma');
  });
});
