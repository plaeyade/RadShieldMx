/**
 * Fase 12, paso 3 — un solo flujo de memoria analítica y CNSNS sobre `radshield/memoria@1`.
 *
 * - Las claves de los diálogos retirados (Memoria IA, asistente, CNSNS .docx, PDF, reporte CNSNS HTML, reporte
 *   regulatorio, exportador «batch») se redirigen al diálogo `memoria`.
 * - DOCX, PDF y JSON salen del mismo objeto (sello sha256 en los tres).
 * - El JSON valida contra el esquema y el JSON Schema publicado en docs/esquemas coincide con el de zod.
 * - Importar un JSON: válido, sello alterado y esquema roto.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import JSZip from 'jszip';
import { calcularProyecto } from '@/lib/motorProyecto';
import { planoEjemploCompleto } from '@/lib/ejemploGuiado';
import { construirMemoria, memoriaAJSON, verificarSelloMemoria } from '@/lib/memoriaAnalitica';
import { erroresEsquemaMemoria, jsonSchemaMemoria } from '@/lib/memoriaEsquema';
import { barrerasCalculadas, camposPorCompletar, importarMemoriaJSON, nombreArchivoMemoria, salidaMemoria } from '@/lib/memoriaFlujo';
import { resolverDialogo, useAppStore } from '@/stores/appStore';
import { useProyectoStore } from '@/stores/proyecto';
import MemoriaDialog from '@/sections/dialogs/MemoriaDialog';

const FECHA = new Date('2026-11-15T12:00:00Z');
const calculado = () => { const p = planoEjemploCompleto(); return { ...p, barriers: calcularProyecto(p).barriers }; };
const leer = (rel: string) => readFileSync(path.resolve(__dirname, '../..', rel), 'utf-8');

describe('Fase 12, paso 3 — memoria unificada', () => {
  it('todas las claves de memoria/informe/CNSNS abren el mismo diálogo', () => {
    for (const k of ['memoriaAI', 'memoriaWizard', 'cnsns', 'cnsnsAutoReport', 'pdfReport', 'regulatoryReport', 'batchReportExporter']) {
      expect(resolverDialogo(k)).toBe('memoria');
    }
    act(() => { useAppStore.getState().closeAll(); useAppStore.getState().open('cnsns'); });
    expect(useAppStore.getState().dialogs.memoria).toBe(true);
    expect(useAppStore.getState().dialogs.cnsns).toBeFalsy();
  });

  it('las rutas duplicadas ya no existen', () => {
    const disenador = leer('pages/ShieldingDesigner.tsx');
    for (const viejo of ['MemoriaAIWizard', 'MemoriaAnaliticaWizard', 'CNSNSAutoReportDialog', 'PdfReportDialog', 'RegulatoryReportDialog', 'BatchReportExporterDialog', 'useCNSNSReport', 'usePDFGenerator', "dialogs/CNSNSDialog'"]) {
      expect(disenador).not.toContain(viejo);
    }
    const menu = leer('sections/Toolbar.tsx');
    expect(menu.match(/onClick=\{invoke\(onMemoria\b/g)).toHaveLength(1);
    expect(menu).not.toMatch(/f404-file-export-pdf|f404-file-export-cnsns/);
  });

  it('el ejemplo «Guíame» valida contra el esquema y conserva el muro norte 17.96 mm Pb / 213.77 mm concreto', () => {
    const m = construirMemoria(calculado(), {}, { fecha: FECHA });
    expect(erroresEsquemaMemoria(m)).toEqual([]);
    expect(erroresEsquemaMemoria(JSON.parse(memoriaAJSON(m)))).toEqual([]);
    const norte = m.barreras.find((b) => b.id === 'eg-captacion-norte')!;
    expect(norte.requeridoPb_mm).toBeCloseTo(17.96, 2);
    expect(norte.requeridoConcreto_mm).toBeCloseTo(213.77, 2);
    expect(erroresEsquemaMemoria({ ...m, extra: 1 })[0]).toMatch(/extra|Unrecognized/i);
    expect(erroresEsquemaMemoria({ ...m, contrato: 'radshield/memoria@2' })[0]).toMatch(/^contrato/);
  });

  it('docs/esquemas/radshield-memoria-1.schema.json es el JSON Schema del esquema zod', () => {
    const publicado = JSON.parse(leer('../docs/esquemas/radshield-memoria-1.schema.json'));
    expect(publicado).toEqual(JSON.parse(JSON.stringify(jsonSchemaMemoria())));
  });

  it('DOCX, PDF y JSON salen del mismo objeto (mismo sello)', async () => {
    const m = construirMemoria(calculado(), { razonSocial: 'Instalación de prueba' }, { fecha: FECHA });
    const json = JSON.parse(await (await salidaMemoria(m, 'json')).text());
    expect(json).toEqual(JSON.parse(JSON.stringify(m)));
    expect(verificarSelloMemoria(json)).toBe(true);
    const docx = await salidaMemoria(m, 'docx');
    const xml = await (await JSZip.loadAsync(await docx.arrayBuffer())).file('word/document.xml')!.async('string');
    expect(xml).toContain(m.sha256.slice(0, 16));
    expect(xml).toContain('Instalación de prueba');
    const pdf = new TextDecoder('latin1').decode(new Uint8Array(await (await salidaMemoria(m, 'pdf')).arrayBuffer()));
    expect(pdf.startsWith('%PDF-')).toBe(true);
    expect(nombreArchivoMemoria(m, 'pdf')).toBe(`Memoria_analitica_${m.origen.proyecto.replace(/[^\w-]+/g, '_')}_2026-11-15.pdf`);
  });

  it('importar: válido, sello alterado y esquema roto', () => {
    const m = construirMemoria(calculado(), {}, { fecha: FECHA });
    expect(importarMemoriaJSON(memoriaAJSON(m)).selloValido).toBe(true);
    expect(importarMemoriaJSON(memoriaAJSON({ ...m, objetivo: 'otro' })).selloValido).toBe(false);
    const { barreras: _b, ...sinBarreras } = m;
    expect(() => importarMemoriaJSON(JSON.stringify(sinBarreras))).toThrow(/esquema/);
    expect(camposPorCompletar(m)).toEqual(expect.arrayContaining(['Razón social', 'Domicilio']));
  });

  it('diálogo: vacío sin cálculo; con el ejemplo calculado, revisión con los 7 puntos', () => {
    act(() => useProyectoStore.getState().setFloorPlan(planoEjemploCompleto()));
    const { unmount } = render(<MemoriaDialog open onOpenChange={() => {}} />);
    expect(screen.getByTestId('memoria-vacio')).toBeTruthy();
    fireEvent.click(screen.getByTestId('memoria-paso-exportar'));
    expect((screen.getByTestId('memoria-json') as HTMLButtonElement).disabled).toBe(true);
    unmount();

    const p = calculado();
    expect(barrerasCalculadas(p)).toHaveLength(7);
    render(<MemoriaDialog open onOpenChange={() => {}} floorPlan={p} />);
    expect(screen.queryByTestId('memoria-vacio')).toBeNull();
    fireEvent.change(screen.getByTestId('memoria-campo-razonSocial'), { target: { value: 'Instalación X' } });
    expect(screen.getByTestId('memoria-pendientes').textContent).not.toMatch(/Razón social/);
    fireEvent.click(screen.getByTestId('memoria-paso-revision'));
    const filas = screen.getByTestId('memoria-tabla-barreras').querySelectorAll('tbody tr');
    expect(filas).toHaveLength(7);
    expect(screen.getByTestId('memoria-tabla-barreras').querySelector('[data-barrera="eg-captacion-norte"]')!.textContent).toMatch(/17\.96.*213\.77/);
    fireEvent.click(screen.getByTestId('memoria-paso-exportar'));
    expect((screen.getByTestId('memoria-json') as HTMLButtonElement).disabled).toBe(false);
  });
});
