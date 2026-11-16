// @vitest-environment node
/**
 * Memoria analítica estructurada (`radshield/memoria@1`) y sus exportadores DOCX y PDF, con el ejemplo «Guíame»
 * (plano sintético, sin datos de clientes).
 */
import { describe, expect, it } from 'vitest';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { calcularProyecto } from '@/lib/motorProyecto';
import { planoEjemploCompleto } from '@/lib/ejemploGuiado';
import {
  areaDeBarrera, construirMemoria, CONTRATO_MEMORIA, jsonCanonico, leerMemoriaJSON, memoriaAJSON, POR_COMPLETAR, SECCIONES_MEMORIA,
  sha256Hex, verificarSelloMemoria,
} from '@/lib/memoriaAnalitica';
import { memoriaADocxDocumento, memoriaAPdf, tablasMemoria, textoPDF } from '@/lib/memoriaAnaliticaExport';
import type { FloorPlan } from '@/types/radshield';

const FECHA = new Date('2026-11-14T12:00:00Z');
function proyecto(): FloorPlan {
  const p = planoEjemploCompleto();
  const r = calcularProyecto(p);
  // Espesores instalados: el norte de captación con 20 mm de Pb (en concreto 250 mm) y uno sin declarar.
  return { ...p, barriers: r.barriers.map((b) => (b.id === 'eg-captacion-norte' ? { ...b, thickness_mm: 250 } : b.id === 'eg-pet-sur' ? b : { ...b, thickness_mm: 300 })) };
}

describe('memoria analítica estructurada', () => {
  it('sha256 conocido y JSON canónico ordenado', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Hex('á'.repeat(100))).toHaveLength(64);
    expect(jsonCanonico({ b: 1, a: [2, { d: 1, c: null }] })).toBe('{"a":[2,{"c":null,"d":1}],"b":1}');
  });

  it('estructura: instalación, fuentes, cargas, ocupaciones, barreras, método, resultados, conclusiones y referencias', () => {
    const m = construirMemoria(proyecto(), { razonSocial: 'Clínica de prueba' }, { fecha: FECHA });
    expect(m.contrato).toBe(CONTRATO_MEMORIA);
    expect(m.instalacion.razonSocial).toBe('Clínica de prueba');
    expect(m.instalacion.domicilio).toBe(POR_COMPLETAR);
    expect(m.instalacion.tipoInstalacion).toBe('Medicina nuclear');
    expect(m.fuentes).toHaveLength(2);
    expect(m.fuentes[0].carga).toMatch(/A₀ = 370 MBq, 30 pacientes\/semana/);
    expect(m.fuentes[0].metodo).toBe('nuclear-511keV');
    expect(m.ocupaciones.filter((o) => o.tipo === 'barrera')).toHaveLength(7);
    expect(m.ocupaciones.find((o) => o.id === 'eg-captacion-sur')!.T).toBeCloseTo(0.2, 12);
    expect(m.barreras).toHaveLength(7);
    const norte = m.barreras.find((b) => b.id === 'eg-captacion-norte')!;
    // Control «Guíame» en la memoria.
    expect(norte.requeridoPb_mm).toBeCloseTo(17.96, 2);
    expect(norte.requeridoConcreto_mm).toBeCloseTo(213.77, 2);
    expect(norte.estado).toBe('CUMPLE');
    expect(norte.area).toBe('Captación');
    expect(norte.punto).toBe('C2');
    expect(m.barreras.find((b) => b.id === 'eg-pet-sur')!.estado).toBe('SIN_ESPESOR');
    expect(m.metodo.normas).toContain('AAPM TG-108');
    expect(m.marcoNormativo.map((x) => x.id)).toEqual(expect.arrayContaining(['RGSR', 'NOM-040-NUCL-2016', 'NOM-003-NUCL-2021', 'NOM-027-NUCL-2021']));
    expect(m.referencias.map((r) => r.id)).toContain('AAPM-TG108');
    // NOM-040 §6.1.1 remite a la NOM-012-NUCL-2002, cancelada: la memoria cita la edición vigente.
    const nom012 = m.marcoNormativo.find((x) => x.id === 'NOM-012-NUCL-2016');
    expect(nom012?.titulo).toMatch(/16 de enero de 2017/);
    expect(nom012?.aplica).toMatch(/§4\.2 \(calibración al menos anual\).*§5\.1\.3 \(verificación al iniciar turno\).*C\.3.*No fija límites de dosis/);
    expect(JSON.stringify(m)).not.toMatch(/NOM-012-NUCL-2015/);
    expect(m.resultadosPorArea.map((a) => a.area)).toEqual(['Captación', 'General', 'Sala PET/CT']);
    expect(m.conclusiones.total).toBe(7);
    expect(m.conclusiones.sinEspesor).toBe(1);
    expect(m.conclusiones.textos.join(' ')).toMatch(/PRELIMINAR/);
  });

  it('sello sha256 verificable, JSON de ida y vuelta y rechazo de versión mayor desconocida', () => {
    const m = construirMemoria(proyecto(), {}, { fecha: FECHA });
    expect(verificarSelloMemoria(m)).toBe(true);
    const otra = construirMemoria(proyecto(), {}, { fecha: FECHA });
    expect(otra.sha256).toBe(m.sha256); // determinista
    const leida = leerMemoriaJSON(memoriaAJSON(m));
    expect(verificarSelloMemoria(leida)).toBe(true);
    expect(verificarSelloMemoria({ ...leida, objetivo: 'otro' })).toBe(false);
    expect(() => leerMemoriaJSON(JSON.stringify({ ...m, contrato: 'radshield/memoria@2' }))).toThrow(/mayor/);
    expect(() => leerMemoriaJSON(JSON.stringify({ ...m, contrato: 'otro/memoria@1' }))).toThrow(/desconocido/);
  });

  it('área por nombre de barrera', () => {
    expect(areaDeBarrera({ name: 'Sala PET/CT — muro norte' })).toBe('Sala PET/CT');
    expect(areaDeBarrera({ name: 'DXF 3 (MUROS)' })).toBe('General');
  });

  it('DOCX: documento Word válido con todas las secciones y la tabla de resultados', async () => {
    const m = construirMemoria(proyecto(), {}, { fecha: FECHA });
    const buf = await Packer.toBuffer(memoriaADocxDocumento(m));
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml')!.async('string');
    for (const s of SECCIONES_MEMORIA) expect(xml).toContain(s);
    expect(xml).toContain('MEMORIA ANALÍTICA DE CÁLCULO DE BLINDAJES');
    expect(xml).toContain('17.96');
    expect(xml).toContain('SIN ESPESOR');
  });

  it('PDF: documento con las secciones, sin caracteres fuera de WinAnsi', () => {
    const m = construirMemoria(proyecto(), {}, { fecha: FECHA });
    const pdf = memoriaAPdf(m);
    const bytes = new Uint8Array(pdf.output('arraybuffer'));
    const texto = new TextDecoder('latin1').decode(bytes);
    expect(texto.startsWith('%PDF-')).toBe(true);
    expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
    for (const s of ['I. Objetivo', 'X. Resultados por', 'XI. Conclusiones', 'XII. Referencias']) expect(texto).toContain(s);
    expect(textoPDF('K·B ≤ P/T → Σ µ')).toBe('K·B <= P/T -> Suma  u');
    expect(tablasMemoria(m).resultados(m.barreras).filas).toHaveLength(7);
  });
});
