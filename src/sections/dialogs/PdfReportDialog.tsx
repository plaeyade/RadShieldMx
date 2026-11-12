import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/stores/appStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { buildAnalyticMemoryEvidenceSection, buildAnalyticMemorySnapshot } from '@/lib/analyticMemoryEvidence';
import { buildF117ModalityHandoff } from '@/lib/f117ModalityHandoff';
import { buildF146MaterialReportAppendix, formatF146MaterialAppendixText } from '@/lib/f146MaterialReportAppendix';
import { buildF149NormativeNumericQa } from '@/lib/f149NormativeNumericQa';
import { buildF149bFastradClinicalUtility } from '@/lib/f149bFastradClinicalUtility';
import { buildF149cMonteCarloGateway } from '@/lib/f149cMonteCarloGateway';
import { buildF208CanvasReportingLayer } from '@/lib/f208CanvasReportingLayer';
import { buildF218ReportHandoff } from '@/lib/f218ReportHandoff';
import { buildF367F370ReleaseIntegration } from '@/lib/f367F370ReleaseIntegration';
import type { FloorPlan } from '@/types/radshield';
import { filasResultados } from '@/lib/resumenResultados';
import { normasMxAplicables } from '@/lib/normativaMx';
import AvisoProyectoVacio from '@/components/AvisoProyectoVacio';
import { FileText, Download, BookOpen } from 'lucide-react';

const TEMPLATES = [
  { id: 'cnsns', name: 'CNSNS LA-007/01', desc: 'Formato oficial Comision Nacional' },
  { id: 'iaea', name: 'IAEA SSG-46', desc: 'Safety Standards Series' },
  { id: 'ncrp', name: 'NCRP 147/151', desc: 'Validacion metodologica' },
  { id: 'custom', name: 'Personalizado', desc: 'Plantilla configurable' },
];

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  floorPlan?: FloorPlan;
}

export default function PdfReportDialog({ open: controlledOpen, onOpenChange, floorPlan: liveFloorPlan }: Props) {
  const storeOpen = useAppStore(s => Boolean(s.dialogs.pdfReport));
  const close = () => useAppStore.getState().close('pdfReport');
  const open = controlledOpen ?? storeOpen;
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    if (!nextOpen) close();
  };
  const storedFloorPlan = useCanvasStore(s => s.floorPlan);
  const floorPlan = liveFloorPlan ?? storedFloorPlan;
  const evidenceSnapshot = buildAnalyticMemorySnapshot(floorPlan);
  const evidenceSection = buildAnalyticMemoryEvidenceSection(floorPlan);
  const f117Handoff = buildF117ModalityHandoff();
  const f146MaterialAppendix = buildF146MaterialReportAppendix(floorPlan);
  // Fase 10: la tabla de resultados sale del proyecto (antes eran dos filas fijas «Pared A/B: cumple»).
  const filas = filasResultados(floorPlan);
  const requieren = filas.filter((f) => f.estado === 'requiere').length;
  const sinCalculo = filas.filter((f) => f.estado === 'sin-calculo').length;
  const f146AppendixText = formatF146MaterialAppendixText(f146MaterialAppendix);
  const f149NormativeQa = buildF149NormativeNumericQa();
  const f149bFastradUtility = buildF149bFastradClinicalUtility();
  const f149cMonteCarloGateway = buildF149cMonteCarloGateway(floorPlan);
  const f208CanvasReporting = buildF208CanvasReportingLayer(floorPlan);
  const f218ReportHandoff = buildF218ReportHandoff(floorPlan);
  const f367F370ReleaseIntegration = buildF367F370ReleaseIntegration(floorPlan);
  const reportTemplates = TEMPLATES.some((item) => item.id === f117Handoff.reportDefaults.templateId)
    ? TEMPLATES
    : [
      {
        id: f117Handoff.reportDefaults.templateId,
        name: f117Handoff.reportDefaults.title,
        desc: `F118 sugerida ${f117Handoff.activeProfile.label}`,
      },
      ...TEMPLATES,
    ];
  const [template, setTemplate] = useState('cnsns');
  const [facility, setFacility] = useState('');
  const [physicist, setPhysicist] = useState('');
  const [licensee, setLicensee] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    setGenerating(false);
    const blob = new Blob([JSON.stringify({
      template,
      facility,
      physicist,
      licensee,
      date,
      generated: new Date().toISOString(),
      resultados_barreras: filas,
      evidencia_canvas_f76: {
        snapshot: evidenceSnapshot,
        apendice_memoria: evidenceSection,
      },
      f146_material_appendix: f146MaterialAppendix,
      f149_normative_numeric_qa: f149NormativeQa,
      f149b_fastrad_export_smoke: f149bFastradUtility,
      f149c_monte_carlo_gateway: f149cMonteCarloGateway,
      f208_canvas_reporting_layer: f208CanvasReporting,
      f218_report_handoff: f218ReportHandoff,
      f367_f370_release_integration: f367F370ReleaseIntegration,
      f117_profile_handoff: {
        activeProfile: f117Handoff.activeProfile,
        reportDefaults: f117Handoff.reportDefaults,
        evidenceDefaults: f117Handoff.evidenceDefaults,
      },
    }, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RadShield_Report_${facility || 'instalacion'}_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="pdf-report-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-[#d97706]" /> PDF Report Generator — v117
            <span className="text-[10px] font-mono text-slate-400">CNSNS LA-007/01 | IAEA SSG-46</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-[10px]">Plantilla</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {reportTemplates.map((item) => (
                    <SelectItem key={item.id} value={item.id} className="text-xs">
                      {item.name} - {item.desc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-[10px]">Fecha</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-7 text-xs" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-[10px]">Instalacion</Label><Input value={facility} onChange={e => setFacility(e.target.value)} placeholder="Hospital General" className="h-7 text-xs" /></div>
            <div><Label className="text-[10px]">Fisico Medico</Label><Input value={physicist} onChange={e => setPhysicist(e.target.value)} placeholder="Dr. Nombre" className="h-7 text-xs" /></div>
          </div>
          <div><Label className="text-[10px]">Licencia CNSNS</Label><Input value={licensee} onChange={e => setLicensee(e.target.value)} placeholder="CNSNS-L-010-XXXX" className="h-7 text-xs" /></div>
          <div
            data-testid="f118-report-template-preselection"
            className="flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1.5 text-[10px] text-cyan-900"
          >
            <div className="min-w-0 flex-1">
              <span className="font-semibold">F118 sugerida:</span> {f117Handoff.reportDefaults.title}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[9px]"
              data-testid="f118-apply-suggested-report-template"
              onClick={() => setTemplate(f117Handoff.reportDefaults.templateId)}
            >
              Usar
            </Button>
          </div>

          <div ref={reportRef} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="text-center border-b border-slate-200 pb-2">
              <h2 className="text-sm font-bold text-slate-800">MEMORIA DE CALCULO DE BLINDAJE</h2>
              <p className="text-[10px] text-slate-500">{reportTemplates.find(t => t.id === template)?.name} | RadShield-MX v117</p>
              <p data-testid="f117-modality-handoff-report" className="text-[9px] text-cyan-700">
                F117 {f117Handoff.activeProfile.label}: {f117Handoff.reportDefaults.title} | {f117Handoff.reportDefaults.templateId}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div><span className="text-slate-500">Instalacion:</span> {facility || '—'}</div>
              <div><span className="text-slate-500">Fecha:</span> {date}</div>
              <div><span className="text-slate-500">Fisico Medico:</span> {physicist || '—'}</div>
              <div><span className="text-slate-500">Licencia:</span> {licensee || '—'}</div>
            </div>
            <div className="text-[10px] space-y-1">
              <p className="font-semibold text-slate-700">1. Objetivo</p>
              <p className="text-slate-600">Determinar los espesores de blindaje necesarios para cumplir con la meta de dosis de diseno P segun NCRP 147/151.</p>
              <p className="font-semibold text-slate-700 mt-2">2. Metodologia</p>
              <p className="text-slate-600">Metodo de TVL (Tenth-Value Layer) con formula B = Pd²/(WUT) para barreras primarias y metodo de suma aritmetica para secundarias.</p>
              <p className="font-semibold text-slate-700 mt-2">3. Resultados</p>
              {filas.length === 0 ? (
                <AvisoProyectoVacio floorPlan={floorPlan} exige="plano" />
              ) : (
                <table className="w-full text-[9px] border-collapse" data-testid="pdf-report-resultados">
                  <tbody>
                    <tr className="bg-slate-100"><th className="border p-1 text-left">Barrera</th><th className="border p-1">Material</th><th className="border p-1">Kerma sin blindaje (mSv/sem)</th><th className="border p-1">T · P (mSv/sem)</th><th className="border p-1">Espesor requerido (mm)</th></tr>
                    {filas.map((f) => (
                      <tr key={f.id}>
                        <td className="border p-1">{f.nombre}</td>
                        <td className="border p-1 text-center">{f.material}</td>
                        <td className="border p-1 text-center">{f.kerma_mSv_semana === null ? '—' : f.kerma_mSv_semana.toPrecision(3)}</td>
                        <td className="border p-1 text-center">{f.T.toFixed(3)} · {f.P_mSv_semana}</td>
                        <td className="border p-1 text-center">{f.estado === 'sin-calculo' ? 'sin cálculo' : f.estado === 'no-requiere' ? 'no requiere blindaje adicional' : f.espesor_mm === null ? '—' : f.espesor_mm.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="font-semibold text-slate-700 mt-2">4. Conclusion</p>
              <p className="text-slate-600" data-testid="pdf-report-conclusion">
                {filas.length === 0
                  ? 'Sin barreras en el proyecto: no hay conclusión que reportar.'
                  : sinCalculo > 0
                    ? `${sinCalculo} de ${filas.length} barrera(s) sin cálculo: ejecute el cálculo antes de emitir la memoria.`
                    : `${requieren} de ${filas.length} barrera(s) requieren blindaje para cumplir su objetivo P (espesor requerido arriba); el resto cumple sin blindaje adicional. Resultado preliminar: requiere revisión del responsable.`}
              </p>
              <p className="font-semibold text-slate-700 mt-2" data-testid="pdf-report-evidence-f76">5. Evidencia F76</p>
              <p className="text-slate-600">
                Canvas: {evidenceSnapshot.barriers} barreras, {evidenceSnapshot.sources} fuentes,
                {evidenceSnapshot.regions} zonas, estandares {evidenceSnapshot.standards.join(', ') || 'pendientes'}.
              </p>
              <p className="font-semibold text-slate-700 mt-2">6. Perfil documental F117</p>
              <p className="text-slate-600">
                Perfil {f117Handoff.activeProfile.label} - {f117Handoff.activeProfile.name}. Documentos prioritarios:
                {' '}{f117Handoff.evidenceDefaults.priorityDocuments.join(', ')}.
              </p>
              <div data-testid="f146-material-report-appendix" className="mt-2 rounded border border-amber-200 bg-amber-50 p-2">
                <p className="font-semibold text-amber-900">7. Anexo F146 de materiales</p>
                <p className="text-amber-900">
                  {f146MaterialAppendix.totals.barriers} barreras, {f146MaterialAppendix.totals.materials.length} materiales,
                  {' '}peso estimado {f146MaterialAppendix.totals.totalWeight_kg.toFixed(1)} kg,
                  {' '}costo estimado USD {f146MaterialAppendix.totals.estimatedCostUSD.toFixed(0)}.
                </p>
                <table className="mt-1 w-full text-[8px] border-collapse bg-white">
                  <tbody>
                    <tr className="bg-amber-100">
                      <th className="border p-1 text-left">Barrera</th>
                      <th className="border p-1">Material</th>
                      <th className="border p-1">TVL</th>
                      <th className="border p-1">Peso</th>
                      <th className="border p-1">Cita/hash</th>
                    </tr>
                    {f146MaterialAppendix.rows.slice(0, 6).map((row) => (
                      <tr key={`${row.barrierId}-${row.materialCode}`}>
                        <td className="border p-1">{row.barrierName}</td>
                        <td className="border p-1 text-center">{row.materialCode} {row.thickness_mm.toFixed(0)} mm</td>
                        <td className="border p-1 text-center">{row.tvlSummary}</td>
                        <td className="border p-1 text-center">{row.weight_kg.toFixed(1)} kg</td>
                        <td className="border p-1 text-center">{row.citationSource} {row.citationHash}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-1 text-[8px] text-amber-800">{f146AppendixText.split('\n').slice(-3).join(' ')}</p>
              </div>
              <div data-testid="f149-f149b-pdf-export-smoke" className="mt-2 rounded border border-rose-200 bg-rose-50 p-2">
                <p className="font-semibold text-rose-900">8. QA F149/F149b previo a exportacion</p>
                <p className="text-rose-900">
                  F149: {f149NormativeQa.totals.passed}/{f149NormativeQa.totals.total} casos, bloqueos release {f149NormativeQa.totals.releaseBlocking}.
                  {' '}F149b: {f149bFastradUtility.exportSmoke.releaseReady ? 'smoke listo' : 'smoke pendiente'}.
                </p>
                <p className="mt-1 text-[8px] text-rose-800">
                  FASTRAD util clinica adoptada: {f149bFastradUtility.adoptedNow.join(' | ')}.
                </p>
                <p className="mt-1 text-[8px] text-rose-800">
                  Guardrail: {f149bFastradUtility.rejectedForRadShield.join(' | ') || 'Monte Carlo externo si se requiere validacion avanzada.'}
                </p>
              </div>
              <div data-testid="f208-canvas-reporting-pdf" className="mt-2 rounded border border-cyan-200 bg-cyan-50 p-2">
                <p className="font-semibold text-cyan-900">9. Canvas reportable F208</p>
                <p className="text-cyan-900">
                  Estado {f208CanvasReporting.status}, score {f208CanvasReporting.score}%,
                  {' '}listos/parciales/faltantes {f208CanvasReporting.readyCount}/{f208CanvasReporting.partialCount}/{f208CanvasReporting.missingCount}.
                </p>
                <p className="mt-1 text-[8px] text-cyan-800">
                  {f208CanvasReporting.items.map((item) => `${item.label}:${item.status}`).join(' | ')}
                </p>
                <p className="mt-1 text-[8px] text-cyan-800">
                  Anexos: {f208CanvasReporting.exportArtifacts.join(', ')}
                </p>
              </div>
              <div data-testid="f218-report-handoff-pdf" className="mt-2 rounded border border-teal-200 bg-teal-50 p-2">
                <p className="font-semibold text-teal-900">10. Handoff visual F218</p>
                <p className="text-teal-900">
                  Estado {f218ReportHandoff.status};
                  {' '}listos/revision/faltantes {f218ReportHandoff.readyCount}/{f218ReportHandoff.reviewCount}/{f218ReportHandoff.missingCount}.
                </p>
                <p className="mt-1 text-[8px] text-teal-800">
                  Adjuntos: {f218ReportHandoff.requiredAttachments.join(' | ')}
                </p>
                <p className="mt-1 text-[8px] text-teal-800">
                  {f218ReportHandoff.items.map((item) => `${item.requiredSnapshot}:${item.status}`).join(' | ')}
                </p>
              </div>
              <div data-testid="f149c-monte-carlo-gateway-pdf" className="mt-2 rounded border border-blue-200 bg-blue-50 p-2">
                <p className="font-semibold text-blue-900">11. Gateway F149c Monte Carlo externo</p>
                <p className="text-blue-900">
                  Paquete {f149cMonteCarloGateway.exportPackage.packageSchema};
                  {' '}fingerprint {f149cMonteCarloGateway.exportPackage.projectFingerprint};
                  {' '}artefactos {f149cMonteCarloGateway.exportPackage.artifacts.length}.
                </p>
                <p className="mt-1 text-[8px] text-blue-800">
                  Motores: {f149cMonteCarloGateway.engines.map((engine) => `${engine.label}:${engine.status}`).join(' | ')}.
                </p>
                <p className="mt-1 text-[8px] text-blue-800">
                  Guardrails: {f149cMonteCarloGateway.releaseGuardrails.slice(0, 2).join(' | ')}.
                </p>
              </div>
              <div data-testid="f367-f370-release-integration-pdf" className="mt-2 rounded border border-purple-200 bg-purple-50 p-2">
                <p className="font-semibold text-purple-900">12. Integracion F367-F370: evidencia 3D, Unity y motores externos</p>
                <p className="text-purple-900">
                  Estado {f367F370ReleaseIntegration.status};
                  {' '}decision {f367F370ReleaseIntegration.releaseGate.decision}.
                </p>
                <p className="mt-1 text-[8px] text-purple-800">
                  Evidencia 3D: {f367F370ReleaseIntegration.visualEvidence.requiredFiles.join(' | ')}.
                </p>
                <p className="mt-1 text-[8px] text-purple-800">
                  Unity: {f367F370ReleaseIntegration.unityWebgl.mode}, fallback {f367F370ReleaseIntegration.unityWebgl.fallback}.
                </p>
                <p className="mt-1 text-[8px] text-purple-800">
                  MC externo: {f367F370ReleaseIntegration.externalEngines.engines.map((engine) => `${engine.id}:${engine.status}`).join(' | ')}.
                </p>
                <p className="mt-1 text-[8px] text-purple-800">
                  Fotorealismo: {f367F370ReleaseIntegration.photorealism.activeEngine}; Babylon pendiente.
                </p>
              </div>
            </div>
            <div className="text-center text-[9px] text-slate-400 pt-2 border-t border-slate-200">
              Generado por RadShield-MX v117 | NCRP 147/151 compliant | {new Date().toLocaleDateString('es-MX')}
            </div>
          </div>

          <Button onClick={generatePDF} disabled={generating} className="w-full bg-[#d97706] hover:bg-[#b45309] text-white gap-2">
            <Download className="w-4 h-4" /> {generating ? 'Generando...' : 'Descargar Reporte JSON'}
          </Button>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />Ref: CNSNS LA-007/01 | {normasMxAplicables(floorPlan.sources.map((s) => s.modality)).join(' | ')} | NCRP 147/151</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
