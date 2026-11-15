/**
 * Exportadores DOCX y PDF de la memoria analítica (`radshield/memoria@1`). Se cargan de forma diferida desde el
 * diálogo de reporte CNSNS (docx y jsPDF no pesan en el arranque).
 */
import {
  AlignmentType, BorderStyle, Document, HeadingLevel, Packer, PageOrientation, Paragraph, Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx';
import { jsPDF } from 'jspdf';
import { SECCIONES_MEMORIA, type BarreraMemoria, type MemoriaAnalitica } from '@/lib/memoriaAnalitica';

const f = (v: number | null | undefined, d = 1) => (v === null || v === undefined || !Number.isFinite(v) ? '—' : v.toFixed(d));
const e = (v: number | null | undefined) => (v === null || v === undefined || !Number.isFinite(v) ? '—' : v.toExponential(2));
const estadoTxt = (s: string) => s.replace(/_/g, ' ');
/** Fecha del documento en la hora de México (el ISO de `origen.fecha` está en UTC). */
export const fechaDoc = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: '2-digit', year: 'numeric' });

/** Tablas de la memoria como filas de texto (las comparten DOCX y PDF). */
export function tablasMemoria(m: MemoriaAnalitica) {
  return {
    instalacion: [
      ['Instalación', m.instalacion.nombre],
      ['Razón social', m.instalacion.razonSocial],
      ['Domicilio', m.instalacion.domicilio],
      ['Tipo de instalación', m.instalacion.tipoInstalacion],
      ['Clase (NOM-003-NUCL-2021)', m.instalacion.clasificacionNOM003],
      ['Nivel / planta', m.instalacion.nivel],
      ['Encargado de seguridad radiológica', m.instalacion.responsableSR],
      ['Elaboró', m.instalacion.elaboro],
      ['Revisión', m.instalacion.revision],
      ['Fecha', fechaDoc(m.origen.fecha)],
      ['Escala del plano', `${m.instalacion.escala_m_px} m/px`],
    ],
    fuentes: {
      cab: ['Fuente', 'Modalidad', 'Método', 'Posición (m)', 'Altura (m)'],
      filas: m.fuentes.map((s) => [s.nombre, s.modalidad, s.metodo, `${s.posicion_m.x}, ${s.posicion_m.y}`, f(s.alturaFuente_m, 2)]),
    },
    cargas: {
      cab: ['Fuente', 'Carga de trabajo y condiciones de operación'],
      filas: m.fuentes.map((s) => [s.nombre, s.carga || '—']),
    },
    ocupaciones: {
      cab: ['Colindancia / área', 'Tipo', 'Zona', 'T', 'P (mSv/sem)', 'P/T (mSv/sem)', 'Ḣ_L (µSv/h)'],
      filas: m.ocupaciones.map((o) => [o.area, o.tipo, o.zona, f(o.T, 3), f(o.P_mSv_semana, 3), f(o.P_T_mSv_semana, 3), f(o.limiteDerivado_uSv_h, 3)]),
    },
    barreras: {
      cab: ['Punto', 'Barrera', 'Tipo', 'Material', 'U', 'Instalado (mm)'],
      filas: m.barreras.map((b) => [b.punto, b.nombre, b.tipo, b.material, f(b.U, 2), f(b.instalado_mm)]),
    },
    resultados: (bs: BarreraMemoria[]) => ({
      cab: ['Punto', 'Zona', 'T', 'P (mSv/sem)', 'K sin blindaje (mSv/sem)', 'Req. Pb (mm)', 'Req. concreto (mm)', 'Req. material (mm)', 'Instalado (mm)', 'Estado'],
      filas: bs.map((b) => [b.punto, b.zona, f(b.T, 3), f(b.P_mSv_semana, 3), e(b.kermaSinBlindaje_mSv_semana), f(b.requeridoPb_mm, 2), f(b.requeridoConcreto_mm), `${f(b.requerido_mm)} ${b.material}`, f(b.instalado_mm), estadoTxt(b.estado)]),
    }),
  };
}

// ─── DOCX ───
const borde = { style: BorderStyle.SINGLE, size: 4, color: '999999' };
const celda = (t: string, cab = false) => new TableCell({
  borders: { top: borde, bottom: borde, left: borde, right: borde },
  children: [new Paragraph({ children: [new TextRun({ text: t, bold: cab, size: 16 })] })],
});
const tabla = (cab: string[], filas: string[][]) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [new TableRow({ tableHeader: true, children: cab.map((c) => celda(c, true)) }), ...filas.map((r) => new TableRow({ children: r.map((c) => celda(c)) }))],
});
const p = (t: string, opts: { bold?: boolean; italics?: boolean; size?: number; color?: string } = {}) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, ...opts })] });
const h1 = (t: string) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: t })] });
const h2 = (t: string) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: t })] });
const vineta = (t: string) => new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: t, size: 20 })] });

export function memoriaADocxDocumento(m: MemoriaAnalitica): Document {
  const t = tablasMemoria(m);
  const S = SECCIONES_MEMORIA;
  const hijos: (Paragraph | Table)[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'MEMORIA ANALÍTICA DE CÁLCULO DE BLINDAJES', bold: true, size: 32 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: m.instalacion.nombre, bold: true, size: 26 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: `${m.instalacion.tipoInstalacion} · ${fechaDoc(m.origen.fecha)} · Revisión ${m.instalacion.revision}`, size: 20 })] }),
    p('PRELIMINAR — generado por RadShield-MX a partir del proyecto; debe revisarlo y firmarlo el responsable antes de presentarlo a la CNSNS.', { italics: true, color: 'B91C1C', size: 18 }),
    p(`Contrato ${m.contrato} · id ${m.id} · sha256 ${m.sha256.slice(0, 16)}… · ${m.origen.app} · ${m.origen.motor}`, { size: 16, color: '666666' }),
    h1(S[0]), p(m.objetivo),
    h1(S[1]), p(m.alcance),
    h1(S[2]), tabla(['Campo', 'Valor'], t.instalacion),
    ...(m.instalacion.actividades.length ? [h2('Actividades'), ...m.instalacion.actividades.map(vineta)] : []),
    ...(m.instalacion.colindancias.length ? [h2('Colindancias'), tabla(['Orientación', 'Colinda con'], m.instalacion.colindancias.map((c) => [c.orientacion, c.descripcion]))] : []),
    h1(S[3]), ...m.marcoNormativo.map((x) => vineta(`${x.id}: ${x.aplica}`)),
    h1(S[4]), tabla(t.fuentes.cab, t.fuentes.filas),
    h1(S[5]), tabla(t.cargas.cab, t.cargas.filas),
    h1(S[6]), tabla(t.ocupaciones.cab, t.ocupaciones.filas),
    h1(S[7]), tabla(t.barreras.cab, t.barreras.filas),
    h1(S[8]),
    h2('Criterios'), ...m.criterios.map((c) => vineta(c.texto)),
    h2('Método'), ...m.metodo.descripcion.map((d) => p(d, { size: 20 })),
    h2('Fórmulas'), ...m.metodo.formulas.map((x) => vineta(`${x.expresion}. ${x.donde}`)),
    h1(S[9]),
    ...m.resultadosPorArea.flatMap((a) => {
      const bs = m.barreras.filter((b) => a.barreras.includes(b.id));
      const r = t.resultados(bs);
      return [h2(a.area), tabla(r.cab, r.filas), p(a.conclusion, { size: 20 })];
    }),
    h1(S[10]), ...m.conclusiones.textos.map(vineta),
    ...(m.advertencias.length ? [h2('Advertencias'), ...m.advertencias.map(vineta)] : []),
    h1(S[11]), ...m.referencias.map((r) => vineta(r.cita)),
    h1(S[12]),
    ...m.barreras.flatMap((b) => [h2(`${b.punto} · ${b.nombre}`), p(`Norma: ${b.norma} · Fórmula: ${b.formula} · ${b.nota}`, { size: 18 }), ...b.hipotesis.map((x) => vineta(x))]),
  ];
  return new Document({
    creator: 'RadShield-MX', title: `Memoria analítica — ${m.instalacion.nombre}`, description: m.contrato,
    styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
    sections: [{ properties: { page: { size: { orientation: PageOrientation.PORTRAIT } } }, children: hijos }],
  });
}

export async function memoriaADocxBlob(m: MemoriaAnalitica): Promise<Blob> {
  return Packer.toBlob(memoriaADocxDocumento(m));
}

// ─── PDF (jsPDF, fuentes estándar WinAnsi: se sustituyen los símbolos que no tiene) ───
export function textoPDF(s: string): string {
  return s
    .replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/→/g, '->').replace(/Σ_?/g, 'Suma ').replace(/[·]/g, '·')
    .replace(/₀/g, '0').replace(/₁/g, '1').replace(/½/g, '1/2').replace(/Ḣ/g, 'H').replace(/γ/g, 'gamma').replace(/μ|µ/g, 'u')
    .replace(/α/g, 'alfa').replace(/β/g, 'beta').replace(/θ/g, 'theta').replace(/⁻/g, '-').replace(/¹/g, '1').replace(/³/g, '3')
    .replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, '...')
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\xFF—–€•]/g, '?');
}

export function memoriaAPdf(m: MemoriaAnalitica): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'letter', compress: false });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 15;
  let y = M;
  const salto = (h: number) => { if (y + h > H - M) { doc.addPage(); y = M; } };
  const parrafo = (t: string, size = 9.5, estilo: 'normal' | 'bold' | 'italic' = 'normal') => {
    doc.setFont('helvetica', estilo); doc.setFontSize(size);
    const lineas = doc.splitTextToSize(textoPDF(t), W - 2 * M) as string[];
    for (const l of lineas) { salto(size * 0.45); doc.text(l, M, y); y += size * 0.45; }
    y += 1.5;
  };
  const titulo = (t: string, size = 12) => { salto(12); y += 2; doc.setFont('helvetica', 'bold'); doc.setFontSize(size); doc.text(textoPDF(t), M, y); y += size * 0.5; doc.setDrawColor(180); doc.line(M, y - 3, W - M, y - 3); y += 1; };
  const tablaPDF = (cab: string[], filas: string[][]) => {
    const anchoT = W - 2 * M;
    const ancho = anchoT / cab.length;
    const fila = (r: string[], bold: boolean) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(7);
      const celdas = r.map((c) => doc.splitTextToSize(textoPDF(c ?? ''), ancho - 2) as string[]);
      const alto = Math.max(...celdas.map((c) => c.length)) * 3 + 2;
      salto(alto);
      celdas.forEach((c, i) => { doc.rect(M + i * ancho, y - 3, ancho, alto); c.forEach((l, j) => doc.text(l, M + i * ancho + 1, y + j * 3)); });
      y += alto;
    };
    fila(cab, true);
    filas.forEach((r) => fila(r, false));
    y += 2;
  };
  const t = tablasMemoria(m);
  const S = SECCIONES_MEMORIA;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text(textoPDF('MEMORIA ANALÍTICA DE CÁLCULO DE BLINDAJES'), W / 2, y + 4, { align: 'center' }); y += 11;
  doc.setFontSize(12); doc.text(textoPDF(m.instalacion.nombre), W / 2, y, { align: 'center' }); y += 7;
  parrafo(`${m.instalacion.tipoInstalacion} · ${fechaDoc(m.origen.fecha)} · Revisión ${m.instalacion.revision}`, 9);
  parrafo('PRELIMINAR — generado por RadShield-MX a partir del proyecto; debe revisarlo y firmarlo el responsable antes de presentarlo a la CNSNS.', 8.5, 'italic');
  parrafo(`Contrato ${m.contrato} · id ${m.id} · sha256 ${m.sha256} · ${m.origen.app} · ${m.origen.motor}`, 7);
  titulo(S[0]); parrafo(m.objetivo);
  titulo(S[1]); parrafo(m.alcance);
  titulo(S[2]); tablaPDF(['Campo', 'Valor'], t.instalacion);
  if (m.instalacion.actividades.length) parrafo(`Actividades: ${m.instalacion.actividades.join('; ')}.`);
  if (m.instalacion.colindancias.length) tablaPDF(['Orientación', 'Colinda con'], m.instalacion.colindancias.map((c) => [c.orientacion, c.descripcion]));
  titulo(S[3]); m.marcoNormativo.forEach((x) => parrafo(`• ${x.id}: ${x.aplica}`));
  titulo(S[4]); tablaPDF(t.fuentes.cab, t.fuentes.filas);
  titulo(S[5]); tablaPDF(t.cargas.cab, t.cargas.filas);
  titulo(S[6]); tablaPDF(t.ocupaciones.cab, t.ocupaciones.filas);
  titulo(S[7]); tablaPDF(t.barreras.cab, t.barreras.filas);
  titulo(S[8]);
  m.criterios.forEach((c) => parrafo(`• ${c.texto}`));
  m.metodo.descripcion.forEach((d) => parrafo(d));
  m.metodo.formulas.forEach((x) => parrafo(`• ${x.expresion}. ${x.donde}`, 8.5));
  titulo(S[9]);
  for (const a of m.resultadosPorArea) {
    parrafo(a.area, 10.5, 'bold');
    const r = t.resultados(m.barreras.filter((b) => a.barreras.includes(b.id)));
    tablaPDF(r.cab, r.filas);
    parrafo(a.conclusion, 9);
  }
  titulo(S[10]); m.conclusiones.textos.forEach((x) => parrafo(`• ${x}`));
  if (m.advertencias.length) { parrafo('Advertencias', 10, 'bold'); m.advertencias.forEach((x) => parrafo(`• ${x}`, 8.5)); }
  titulo(S[11]); m.referencias.forEach((r) => parrafo(`• ${r.cita}`, 8.5));
  titulo(S[12]);
  for (const b of m.barreras) {
    parrafo(`${b.punto} · ${b.nombre}`, 9.5, 'bold');
    parrafo(`Norma: ${b.norma} · Fórmula: ${b.formula} · ${b.nota}`, 8);
    b.hipotesis.forEach((x) => parrafo(`- ${x}`, 7.5));
  }
  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(textoPDF(`${m.instalacion.nombre} — memoria analítica (PRELIMINAR) — página ${i} de ${paginas}`), W / 2, H - 7, { align: 'center' });
  }
  return doc;
}

export function memoriaAPdfBlob(m: MemoriaAnalitica): Blob {
  return memoriaAPdf(m).output('blob');
}
