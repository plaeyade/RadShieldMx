// PDF Report Generator using jsPDF
import { jsPDF } from 'jspdf';
import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import { buildAnalyticMemoryEvidenceSection } from '@/lib/analyticMemoryEvidence';
import { buildF125CalculationEvidenceGate } from '@/lib/f125CalculationEvidenceGate';
import type { FloorPlan } from '@/types/radshield';
import { MATERIALS } from '@/types/radshield';
import { citasMxAplicables } from '@/lib/normativaMx';
import { stampNotForSignature } from '@/components/SyntheticResultBanner';

export function generatePDFReport(
  floorPlan: FloorPlan,
  meta: {
    preparerName: string;
    reviewerName: string;
    institution: string;
    date: string;
    barrierResults?: CanvasBarrierResult[];
    sampleLines?: CanvasSampleLine[];
  }
): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Cover
  doc.setFillColor(180, 30, 30);
  doc.rect(0, 0, pageW, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('RadShield-MX', pageW / 2, 25, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Memoria Tecnica de Blindaje Radiologico', pageW / 2, 32, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  let y = 50;
  doc.text(`Proyecto: ${floorPlan.name}`, 20, y); y += 8;
  doc.text(`Institucion: ${meta.institution || 'N/A'}`, 20, y); y += 8;
  doc.text(`Fecha: ${meta.date}`, 20, y); y += 8;
  doc.text(`Fisico Medico: ${meta.preparerName || 'N/A'}`, 20, y); y += 8;
  doc.text(`Revisor: ${meta.reviewerName || 'N/A'}`, 20, y); y += 8;
  doc.text(`Escala: ${floorPlan.scale_m_per_pixel.toFixed(4)} m/px`, 20, y); y += 8;
  doc.text(`Fuentes: ${floorPlan.sources.length} | Barreras: ${floorPlan.barriers.length}`, 20, y); y += 12;

  // Results table
  doc.setFontSize(14);
  doc.text('Resultados de Blindaje', 20, y); y += 10;

  // Header
  doc.setFillColor(230, 230, 230);
  doc.rect(15, y - 5, pageW - 30, 8, 'F');
  doc.setFontSize(8);
  doc.text('Barrera', 17, y);
  doc.text('Tipo', 60, y);
  doc.text('Long(m)', 80, y);
  doc.text('Kerma(mSv)', 100, y);
  doc.text('Material', 125, y);
  doc.text('Esp(mm)', 155, y);
  y += 8;

  // Rows
  const barriersWithResults = floorPlan.barriers.filter(b => b.requiredThickness_mm);
  for (const b of barriersWithResults) {
    if (y > pageH - 20) { doc.addPage(); y = 20; }
    const length_m = Math.sqrt((b.x2 - b.x1) ** 2 + (b.y2 - b.y1) ** 2) * floorPlan.scale_m_per_pixel;
    const topMat = Object.entries(b.requiredThickness_mm || {}).sort((a, c) => (a[1] || 0) - (c[1] || 0))[0];
    const matName = topMat ? MATERIALS.find(m => m.code === topMat[0])?.name?.substring(0, 15) || topMat[0] : '-';
    const thick = topMat ? (topMat[1] || 0).toFixed(1) : '-';

    doc.setFontSize(7);
    doc.text(b.name.substring(0, 20), 17, y);
    doc.text(b.barrierType.substring(0, 10), 60, y);
    doc.text(length_m.toFixed(2), 80, y);
    doc.text((b.maxKerma || 0).toFixed(3), 100, y);
    doc.text(matName, 125, y);
    doc.text(thick, 155, y);
    y += 5;
  }

  // Material comparison
  y += 10;
  if (y > pageH - 40) { doc.addPage(); y = 20; }
  doc.setFontSize(14);
  doc.text('Comparativa de Materiales', 20, y); y += 10;
  doc.setFontSize(8);
  doc.setFillColor(230, 230, 230);
  doc.rect(15, y - 5, pageW - 30, 8, 'F');
  doc.text('Material', 17, y);
  doc.text('Espesor total (mm)', 80, y);
  doc.text('Costo est. (USD)', 130, y);
  y += 8;

  for (const mat of MATERIALS) {
    if (y > pageH - 15) { doc.addPage(); y = 20; }
    let totalT = 0, totalC = 0;
    for (const b of barriersWithResults) {
      const t = b.requiredThickness_mm?.[mat.code] || 0;
      const length_m = Math.sqrt((b.x2 - b.x1) ** 2 + (b.y2 - b.y1) ** 2) * floorPlan.scale_m_per_pixel;
      totalT += t;
      totalC += (t / 1000) * mat.cost_per_m3 * length_m;
    }
    doc.setFontSize(7);
    doc.text(mat.name.substring(0, 25), 17, y);
    doc.text(totalT.toFixed(1), 80, y);
    doc.text(`$${totalC.toFixed(2)}`, 130, y);
    y += 5;
  }

  // Normative references
  y += 10;
  if (y > pageH - 40) { doc.addPage(); y = 20; }
  doc.setFontSize(14);
  doc.text('Referencias Normativas', 20, y); y += 8;
  doc.setFontSize(9);
  const refs = [
    'NCRP Report No. 151 (2005) - Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray',
    'NCRP Report No. 147 (2004) - Structural Shielding Design for Medical X-Ray Imaging Facilities',
    'AAPM TG 108 (2010) - PET and PET/CT Shielding Requirements',
    'IAEA SRS No. 47 (2006) - Radiation Protection for PET/CT',
    // Normas mexicanas según las modalidades del proyecto (NOM-040/NOM-013 sólo en medicina nuclear, NOM-033 en linac).
    ...citasMxAplicables(floorPlan.sources.map((s) => s.modality)),
  ];
  for (const r of refs) { doc.text(`• ${r}`, 20, y); y += 5; }

  y += 10;
  if (y > pageH - 45) { doc.addPage(); y = 20; }
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('Evidencia trazable del canvas (F76)', 20, y); y += 8;
  doc.setFontSize(8);
  const evidenceSection = buildAnalyticMemoryEvidenceSection(
    floorPlan,
    meta.barrierResults ?? [],
    meta.sampleLines ?? [],
  );
  const f125Gate = buildF125CalculationEvidenceGate(floorPlan, meta.barrierResults ?? [], meta.sampleLines ?? []);
  doc.text(`F125 resultados auditables: ${f125Gate.resultCount} | completos: ${f125Gate.completeCount} | revision: ${f125Gate.reviewRequiredCount} | sin resultado: ${f125Gate.missingResultCount}`, 20, y);
  y += 5;
  for (const line of evidenceSection.trim().split('\n').slice(1)) {
    if (y > pageH - 18) { doc.addPage(); y = 20; }
    const wrapped = doc.splitTextToSize(line || ' ', pageW - 40);
    doc.text(wrapped, 20, y);
    y += Math.max(4, wrapped.length * 4);
  }

  // Signatures
  y += 15;
  if (y > pageH - 30) { doc.addPage(); y = 20; }
  doc.line(20, y, 80, y); doc.line(110, y, 170, y);
  doc.setFontSize(9);
  doc.text(meta.preparerName || 'Fisico Medico', 20, y + 5);
  doc.text('Elaboro', 20, y + 10);
  doc.text(meta.reviewerName || 'RPO / Supervisor', 110, y + 5);
  doc.text('Reviso', 110, y + 10);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generado por RadShield-MX v1.2 | ${meta.date}`, pageW / 2, pageH - 10, { align: 'center' });

  stampNotForSignature(doc);
  return doc.output('blob');
}
