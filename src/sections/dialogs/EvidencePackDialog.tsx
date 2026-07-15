import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpenCheck, Download, FileUp, Link, Plus, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  buildEvidenceCitationLedger,
  createEvidencePack,
  createEvidenceSource,
  normalizeEvidencePack,
  summarizeEvidencePack,
  type EvidenceConfidence,
  type EvidencePack,
  type EvidenceSource,
  type EvidenceSourceType,
  type EvidenceVerificationStatus,
} from '@/lib/evidencePack';
import { buildAnalyticMemorySnapshot, createFloorPlanEvidenceSources } from '@/lib/analyticMemoryEvidence';
import { CADX_STUDIO_EXTERNAL_NOTE } from '@/lib/cadxStudioIntegration';
import { CAD_CODE_VERIFY_EXTERNAL_NOTE } from '@/lib/cadCodeVerify';
import { buildF125CalculationEvidenceGate } from '@/lib/f125CalculationEvidenceGate';
import { buildF126ReleaseEvidenceHardening } from '@/lib/f126ReleaseEvidenceHardening';
import { F93_DROPDOWN_MIGRATION_DECISION } from '@/lib/f93ReleaseSafety';
import { buildF117ModalityHandoff } from '@/lib/f117ModalityHandoff';
import { buildF146MaterialReportAppendix } from '@/lib/f146MaterialReportAppendix';
import { buildF149NormativeNumericQa } from '@/lib/f149NormativeNumericQa';
import { buildF149bFastradClinicalUtility } from '@/lib/f149bFastradClinicalUtility';
import { buildF149cMonteCarloGateway } from '@/lib/f149cMonteCarloGateway';
import { IDAC_DOSE_EXTERNAL_NOTE } from '@/lib/idacDoseIntegration';
import { REVIT_EXTERNAL_INTEGRATION_NOTE } from '@/lib/revitIntegration';
import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import type { FloorPlan } from '@/types/radshield';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
  floorPlan?: FloorPlan;
  barrierResults?: CanvasBarrierResult[];
  sampleLines?: CanvasSampleLine[];
}

const sourceTypes: EvidenceSourceType[] = [
  'official',
  'regulatory',
  'standard',
  'manufacturer',
  'peerReviewed',
  'technicalReport',
  'other',
];

const confidenceLevels: EvidenceConfidence[] = ['high', 'medium', 'low'];
const verificationStatuses: EvidenceVerificationStatus[] = ['draft', 'reviewed', 'verified'];

function downloadJson(filename: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function EvidencePackDialog({
  open,
  onOpenChange,
  projectName = 'RadShield-MX',
  floorPlan,
  barrierResults = [],
  sampleLines = [],
}: Props) {
  const [pack, setPack] = useState<EvidencePack>(() => createEvidencePack(projectName));
  const [importError, setImportError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedSources = useMemo(() => createFloorPlanEvidenceSources(floorPlan, barrierResults, sampleLines), [floorPlan, barrierResults, sampleLines]);
  const calculationSnapshot = useMemo(() => buildAnalyticMemorySnapshot(floorPlan, barrierResults, sampleLines), [floorPlan, barrierResults, sampleLines]);
  const f125Gate = useMemo(() => buildF125CalculationEvidenceGate(floorPlan, barrierResults, sampleLines), [floorPlan, barrierResults, sampleLines]);
  const f117Handoff = useMemo(() => buildF117ModalityHandoff(), []);
  const f146MaterialAppendix = useMemo(() => buildF146MaterialReportAppendix(floorPlan), [floorPlan]);
  const f149NormativeQa = useMemo(() => buildF149NormativeNumericQa(), []);
  const f149bFastradUtility = useMemo(() => buildF149bFastradClinicalUtility(), []);
  const f149cMonteCarloGateway = useMemo(() => buildF149cMonteCarloGateway(floorPlan), [floorPlan]);
  const summary = useMemo(() => summarizeEvidencePack(pack), [pack]);
  const f126ReleaseEvidence = useMemo(() => buildF126ReleaseEvidenceHardening(pack.sources, pack.citationLedger), [pack.sources, pack.citationLedger]);

  useEffect(() => {
    if (!open) return;
    setPack((current) => {
      const manualSources = current.sources.filter((source) => !source.id.startsWith('ev-f75-'));
      const f117Source = createEvidenceSource({
        id: 'ev-f117-active-modality',
        title: `F117 perfil activo ${f117Handoff.activeProfile.label}`,
        sourceType: 'technicalReport',
        claim: f117Handoff.evidenceDefaults.objective,
        excerpt: `Perfil ${f117Handoff.activeProfile.name}; normas ${f117Handoff.evidenceDefaults.priorityDocuments.join(', ')}; plantilla ${f117Handoff.reportDefaults.templateId}.`,
        notes: 'Fuente interna de ruteo documental. Debe complementarse con citas normativas verificadas antes de dictamen.',
        confidence: 'medium',
        tags: f117Handoff.evidenceDefaults.citationTags,
        documentId: `f117-${f117Handoff.activeProfile.id}`,
        sectionRef: 'F117 modality handoff',
        verificationStatus: 'reviewed',
      });
      const sources = [...generatedSources, ...manualSources];
      const sourcesWithProfile = sources.some((source) => source.id === f117Source.id) ? sources : [f117Source, ...sources];
      return {
        ...current,
        projectName,
        objective: current.objective || f117Handoff.evidenceDefaults.objective,
        updatedAt: new Date().toISOString(),
        sources: sourcesWithProfile,
        citationLedger: buildEvidenceCitationLedger(sourcesWithProfile),
      };
    });
  }, [open, projectName, generatedSources, f117Handoff]);

  if (!open) return null;

  const updatePack = (updates: Partial<EvidencePack>) => {
    setPack((current) => ({ ...current, ...updates, updatedAt: new Date().toISOString() }));
  };

  const updateSource = (id: string, updates: Partial<EvidenceSource>) => {
    setPack((current) => {
      const sources = current.sources.map((source) => {
        if (source.id !== id) return source;
        const shouldRefreshHash = updates.claim !== undefined || updates.excerpt !== undefined;
        return createEvidenceSource({
          ...source,
          ...updates,
          excerptHash: shouldRefreshHash ? undefined : source.excerptHash,
        });
      });
      return {
        ...current,
        updatedAt: new Date().toISOString(),
        sources,
        citationLedger: buildEvidenceCitationLedger(sources),
      };
    });
  };

  const addSource = () => {
    setPack((current) => {
      const sources = [createEvidenceSource({ title: 'Nueva fuente', sourceType: 'official' }), ...current.sources];
      return {
        ...current,
        updatedAt: new Date().toISOString(),
        sources,
        citationLedger: buildEvidenceCitationLedger(sources),
      };
    });
  };

  const removeSource = (id: string) => {
    setPack((current) => {
      const sources = current.sources.filter((source) => source.id !== id);
      return {
        ...current,
        updatedAt: new Date().toISOString(),
        sources,
        citationLedger: buildEvidenceCitationLedger(sources),
      };
    });
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      setPack(normalizeEvidencePack(parsed, projectName));
      setImportError(null);
    } catch {
      setImportError('No se pudo importar el Evidence Pack. Revise que sea JSON valido.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
            <BookOpenCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Evidence Pack</h1>
            <p className="text-xs text-slate-500">Fuentes trazables para memorias analiticas y revisiones deep dive</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Offline JSON</Badge>
          <Badge variant="outline">Fase 43</Badge>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} aria-label="Cerrar Evidence Pack">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[320px_minmax(0,1fr)] flex-1 min-h-0">
        <aside className="border-r bg-white p-4 overflow-auto space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Proyecto</label>
            <Input value={pack.projectName} onChange={(event) => updatePack({ projectName: event.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-500 uppercase">Objetivo</label>
            <Textarea value={pack.objective} onChange={(event) => updatePack({ objective: event.target.value })} className="min-h-[92px]" />
          </div>

          <Card>
            <CardContent className="p-3 text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800">Resumen</div>
              <div>Total fuentes: {summary.total}</div>
              <div>Alta confianza: {summary.highConfidence}</div>
              <div>Listas para memoria: {summary.readyForMemory}</div>
              <div>Tipos: {Object.entries(summary.byType).map(([type, count]) => `${type} ${count}`).join(', ') || 'sin clasificar'}</div>
            </CardContent>
          </Card>

          <Card data-testid="f93-citation-ledger-summary" className="border-sky-200 bg-sky-50">
            <CardContent className="p-3 text-xs text-sky-900 space-y-1">
              <div className="font-semibold">Citation ledger F93</div>
              <div>Claims trazables: {summary.ledgerTotal}</div>
              <div>Con pagina/seccion: {summary.ledgerComplete}</div>
              <div>Verificadas: {summary.verified}</div>
              <div>Deep dive: {summary.readyForDeepDive ? 'listo' : 'pendiente de referencias'}</div>
            </CardContent>
          </Card>

          <Card data-testid="f117-modality-handoff-evidence" className="border-cyan-200 bg-cyan-50">
            <CardContent className="p-3 text-xs text-cyan-900 space-y-1">
              <div className="font-semibold">F117 perfil activo</div>
              <div>{f117Handoff.activeProfile.label} - {f117Handoff.activeProfile.name}</div>
              <div>Objetivo: {f117Handoff.evidenceDefaults.objective}</div>
              <div>Documentos: {f117Handoff.evidenceDefaults.priorityDocuments.join(', ')}</div>
              <div>Tags: {f117Handoff.evidenceDefaults.citationTags.join(', ')}</div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2 h-7 w-full justify-start text-[10px]"
                data-testid="f118-apply-evidence-objective"
                onClick={() => updatePack({ objective: f117Handoff.evidenceDefaults.objective })}
              >
                Aplicar objetivo F118
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="f146-material-appendix-evidence" className="border-amber-200 bg-amber-50">
            <CardContent className="p-3 text-xs text-amber-900 space-y-1">
              <div className="font-semibold">F146 anexo materiales</div>
              <div>Barreras: {f146MaterialAppendix.totals.barriers}</div>
              <div>Materiales: {f146MaterialAppendix.totals.materials.join(', ') || 'N/A'}</div>
              <div>Peso estimado: {f146MaterialAppendix.totals.totalWeight_kg.toFixed(1)} kg</div>
              <div>Revision requerida: {f146MaterialAppendix.totals.reviewRequired}</div>
              <div>Hashes: {f146MaterialAppendix.rows.slice(0, 2).map((row) => row.citationHash).join(' | ') || 'sin filas'}</div>
            </CardContent>
          </Card>

          <Card data-testid="f149-normative-numeric-qa-evidence" className="border-rose-200 bg-rose-50">
            <CardContent className="p-3 text-xs text-rose-900 space-y-1">
              <div className="font-semibold">F149 QA numerico normativo</div>
              <div>Suite NCRP: {f149NormativeQa.canonicalSuite.passed}/{f149NormativeQa.canonicalSuite.total}</div>
              <div>Casos F149: {f149NormativeQa.totals.passed}/{f149NormativeQa.totals.total}</div>
              <div>Revision: {f149NormativeQa.totals.review} | Fallas: {f149NormativeQa.totals.failed}</div>
              <div>Bloqueos release: {f149NormativeQa.totals.releaseBlocking}</div>
              <div>RC: {f149NormativeQa.releaseReady ? 'listo con revision profesional' : 'bloqueado'}</div>
              <div className="text-[10px]">{f149NormativeQa.nextPhase}</div>
            </CardContent>
          </Card>

          <Card data-testid="f149b-fastrad-export-smoke-evidence" className="border-slate-300 bg-slate-50">
            <CardContent className="p-3 text-xs text-slate-900 space-y-1">
              <div className="font-semibold">F149b FASTRAD + export smoke</div>
              <div>Fuente: {f149bFastradUtility.sourceUrl}</div>
              <div>Adoptar ahora: {f149bFastradUtility.adoptedNow.length}</div>
              <div>Diferidas: {f149bFastradUtility.deferred.length}</div>
              <div>Externas: {f149bFastradUtility.rejectedForRadShield.length}</div>
              <div>Smoke superficies: {f149bFastradUtility.exportSmoke.surfaces.map((surface) => `${surface.surface}:${surface.status}`).join(' | ')}</div>
              <div>RC: {f149bFastradUtility.exportSmoke.releaseReady ? 'listo' : 'pendiente'}</div>
              <div className="text-[10px]">{f149bFastradUtility.decision}</div>
            </CardContent>
          </Card>

          <Card data-testid="f149c-monte-carlo-gateway-evidence" className="border-blue-300 bg-blue-50">
            <CardContent className="p-3 text-xs text-blue-900 space-y-1">
              <div className="font-semibold">F149c Monte Carlo Gateway</div>
              <div>Schema: {f149cMonteCarloGateway.exportPackage.packageSchema}</div>
              <div>Fingerprint: {f149cMonteCarloGateway.exportPackage.projectFingerprint}</div>
              <div>Motores: {f149cMonteCarloGateway.engines.map((engine) => `${engine.label}:${engine.status}`).join(' | ')}</div>
              <div>Artefactos release: {f149cMonteCarloGateway.exportPackage.artifacts.filter((artifact) => artifact.requiredForRelease).length}</div>
              <div>Gates: {f149cMonteCarloGateway.validationGates.map((gate) => `${gate.id}:${gate.status}`).join(' | ')}</div>
              <div>RC: {f149cMonteCarloGateway.exportPackage.releaseReady ? 'gateway listo' : 'validacion requerida'}</div>
              <div className="text-[10px]">{f149cMonteCarloGateway.decision}</div>
            </CardContent>
          </Card>

          <Card data-testid="f93-dropdown-migration-decision" className="border-violet-200 bg-violet-50">
            <CardContent className="p-3 text-xs text-violet-900 space-y-1">
              <div className="font-semibold">Dropdowns F93</div>
              <div>{F93_DROPDOWN_MIGRATION_DECISION.status}</div>
              <div>{F93_DROPDOWN_MIGRATION_DECISION.decision}</div>
              <div>Grupos preparados: {F93_DROPDOWN_MIGRATION_DECISION.stagedGroups.length}</div>
            </CardContent>
          </Card>

          <Card data-testid="evidence-pack-calculation-snapshot" className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-3 text-xs text-emerald-900 space-y-1">
              <div className="font-semibold">Snapshot del calculo</div>
              <div>Barreras: {calculationSnapshot.barriers}</div>
              <div>Fuentes: {calculationSnapshot.sources}</div>
              <div>Zonas: {calculationSnapshot.regions}</div>
              <div>Resultados: {calculationSnapshot.results}</div>
              <div>Lineas 0.3m: {calculationSnapshot.sampleLines}</div>
              <div>Puntos: {calculationSnapshot.samplePoints}</div>
              <div data-testid="evidence-pack-f86-critical-points">Puntos criticos F86: {calculationSnapshot.criticalPoints}</div>
              <div data-testid="evidence-pack-f86-preset-coverage">Presets F86: {calculationSnapshot.presetBarriers} ({calculationSnapshot.presetCoveragePct}%)</div>
              <div>Max espesor: {calculationSnapshot.maxThickness.toFixed(1)} mm</div>
            </CardContent>
          </Card>

          <Card data-testid="f125-calculation-evidence-gate" className="border-amber-200 bg-amber-50">
            <CardContent className="p-3 text-xs text-amber-900 space-y-1">
              <div className="font-semibold">F125 calculo-memoria-evidencia</div>
              <div>Resultados auditables: {f125Gate.resultCount}</div>
              <div>Completos: {f125Gate.completeCount}</div>
              <div>Requieren revision: {f125Gate.reviewRequiredCount}</div>
              <div>Sin resultado valido: {f125Gate.missingResultCount}</div>
              <div>Campos: {f125Gate.requiredFields.join(', ')}</div>
              <div className="text-[10px]">{f125Gate.decision}</div>
            </CardContent>
          </Card>

          <Card data-testid="f126-release-evidence-hardening" className="border-lime-200 bg-lime-50">
            <CardContent className="p-3 text-xs text-lime-900 space-y-1">
              <div className="font-semibold">F126 evidencia release</div>
              <div>Ledger: {f126ReleaseEvidence.total}</div>
              <div>Listas: {f126ReleaseEvidence.releaseReady}</div>
              <div>Sin doc: {f126ReleaseEvidence.missingDocumentId}</div>
              <div>Sin pag/seccion: {f126ReleaseEvidence.missingPageOrSection}</div>
              <div>Borrador: {f126ReleaseEvidence.unverified}</div>
              <div>RC: {f126ReleaseEvidence.readyForReleaseCandidate ? 'listo' : 'pendiente'}</div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <input ref={inputRef} data-testid="evidence-pack-input" type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
            <Button className="w-full justify-start" size="sm" onClick={addSource}>
              <Plus className="w-4 h-4 mr-2" /> Agregar fuente
            </Button>
            <Button className="w-full justify-start" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
              <FileUp className="w-4 h-4 mr-2" /> Importar JSON
            </Button>
            <Button className="w-full justify-start" size="sm" variant="outline" onClick={() => downloadJson(`evidence_pack_${pack.projectName.replace(/\W+/g, '_')}.json`, pack)}>
              <Download className="w-4 h-4 mr-2" /> Exportar JSON
            </Button>
            {importError && <div className="text-xs text-red-600">{importError}</div>}
          </div>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-3 text-xs text-amber-900 space-y-2">
              <div className="font-semibold">Integraciones futuras</div>
              <div>FSB queda como navegador supervisado externo por MCP.</div>
              <div>Browserbase queda como motor externo para Search/Fetch/Trace con API key.</div>
              <div>{REVIT_EXTERNAL_INTEGRATION_NOTE}</div>
              <div>{CADX_STUDIO_EXTERNAL_NOTE}</div>
              <div>{CAD_CODE_VERIFY_EXTERNAL_NOTE}</div>
              <div>{IDAC_DOSE_EXTERNAL_NOTE}</div>
            </CardContent>
          </Card>
        </aside>

        <main className="min-w-0 overflow-auto p-5 bg-slate-50">
          <div className="max-w-5xl mx-auto space-y-3">
            {pack.sources.map((source) => (
              <Card key={source.id} className="bg-white">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_150px_120px_auto] gap-2">
                    <Input value={source.title} onChange={(event) => updateSource(source.id, { title: event.target.value })} placeholder="Titulo de la fuente" />
                    <select
                      value={source.sourceType}
                      onChange={(event) => updateSource(source.id, { sourceType: event.target.value as EvidenceSourceType })}
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {sourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <select
                      value={source.confidence}
                      onChange={(event) => updateSource(source.id, { confidence: event.target.value as EvidenceConfidence })}
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {confidenceLevels.map((level) => <option key={level} value={level}>{level}</option>)}
                    </select>
                    <Button variant="ghost" size="icon" onClick={() => removeSource(source.id)} aria-label="Eliminar fuente">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-[minmax(0,1fr)_180px] gap-2">
                    <div className="relative">
                      <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input className="pl-9" value={source.url} onChange={(event) => updateSource(source.id, { url: event.target.value })} placeholder="https://..." />
                    </div>
                    <Input value={source.publishedDate} onChange={(event) => updateSource(source.id, { publishedDate: event.target.value })} placeholder="Fecha publicacion" />
                  </div>

                  <div data-testid="f93-citation-fields" className="grid grid-cols-[1fr_1fr_100px_1fr_120px] gap-2">
                    <Input value={source.claimId || ''} onChange={(event) => updateSource(source.id, { claimId: event.target.value })} placeholder="claimId" />
                    <Input value={source.documentId || ''} onChange={(event) => updateSource(source.id, { documentId: event.target.value })} placeholder="documentId" />
                    <Input value={source.pageRef || ''} onChange={(event) => updateSource(source.id, { pageRef: event.target.value })} placeholder="pag." />
                    <Input value={source.sectionRef || ''} onChange={(event) => updateSource(source.id, { sectionRef: event.target.value })} placeholder="seccion" />
                    <select
                      value={source.verificationStatus || 'draft'}
                      onChange={(event) => updateSource(source.id, { verificationStatus: event.target.value as EvidenceVerificationStatus })}
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {verificationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                  <div className="text-[10px] text-slate-400">Hash F93: {source.excerptHash}</div>

                  <div className="grid grid-cols-2 gap-2">
                    <Textarea value={source.claim} onChange={(event) => updateSource(source.id, { claim: event.target.value })} placeholder="Afirmacion tecnica que sustenta" />
                    <Textarea value={source.excerpt} onChange={(event) => updateSource(source.id, { excerpt: event.target.value })} placeholder="Extracto breve o resumen verificable" />
                  </div>
                  <Textarea value={source.notes} onChange={(event) => updateSource(source.id, { notes: event.target.value })} placeholder="Notas de validacion, limitaciones o relacion con memoria analitica" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
