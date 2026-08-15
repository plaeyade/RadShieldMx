import { useMemo, useState } from 'react';
import { AlertTriangle, Calculator, CheckCircle2, ClipboardCopy, FileSearch, FileText, Radiation, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createFloorPlanEvidenceSources } from '@/lib/analyticMemoryEvidence';
import type { FloorPlan } from '@/types/radshield';

interface DxfImportReviewPanelProps {
  floorPlan: FloorPlan;
  onClose: () => void;
  onConfirm: () => void;
  onPlaceClinicalSources?: () => void;
  onRunCalculations: () => void;
  onOpenMemoriaAI: () => void;
  onOpenEvidencePack: () => void;
}

export default function DxfImportReviewPanel({
  floorPlan,
  onClose,
  onConfirm,
  onPlaceClinicalSources,
  onRunCalculations,
  onOpenMemoriaAI,
  onOpenEvidencePack,
}: DxfImportReviewPanelProps) {
  const metadata = floorPlan.importMetadata;
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const dxfEvidence = useMemo(
    () => createFloorPlanEvidenceSources(floorPlan).find((source) => source.id === 'ev-dxf-import-review'),
    [floorPlan],
  );

  if (!metadata) return null;

  const warnings = metadata.warnings ?? [];
  const isPreliminary = metadata.status === 'preliminary';
  const hasScale = Number.isFinite(floorPlan.scale_m_per_pixel) && floorPlan.scale_m_per_pixel > 0;
  const readyForMemory = metadata.status === 'final' && floorPlan.barriers.length > 0 && hasScale;
  const calculationStatus = metadata.calculationStatus ?? 'not-started';
  const hasSources = floorPlan.sources.length > 0;
  const calculationLabel = calculationStatus === 'complete'
    ? `Calculado (${metadata.calculatedBarriers ?? floorPlan.barriers.length} barreras)`
    : calculationStatus === 'running'
      ? 'Calculando'
      : calculationStatus === 'blocked-no-source'
        ? 'Pendiente de fuente/equipo'
        : calculationStatus === 'error'
          ? 'Error de calculo'
          : 'Pendiente de calculo';
  const workflowSteps = [
    { id: 'load', label: 'Cargar', done: Boolean(metadata.importedAt), active: false },
    { id: 'map', label: 'Mapear capas', done: (metadata.mappedBarriers ?? floorPlan.barriers.length) > 0, active: false },
    { id: 'sources', label: 'Fuentes', done: hasSources, active: !hasSources && floorPlan.barriers.length > 0 },
    { id: 'confirm', label: 'Confirmar', done: metadata.status === 'final', active: isPreliminary && hasSources },
    {
      id: 'calculate',
      label: 'Calcular',
      done: calculationStatus === 'complete',
      active: metadata.status === 'final' && calculationStatus !== 'complete',
    },
  ];
  const nextAction = isPreliminary
    ? hasSources
      ? 'Confirme geometria, escala, fuentes y continuidad de barreras antes de calcular o generar memoria.'
      : 'Coloque o confirme fuentes/equipos radiologicos antes de calcular o generar memoria.'
    : calculationStatus === 'blocked-no-source'
      ? 'Agregue o confirme una fuente/equipo radiologico y vuelva a ejecutar Calcular.'
      : calculationStatus === 'complete'
        ? 'Abra Memoria IA o Evidence Pack para usar la evidencia CAD/DXF revisada.'
        : calculationStatus === 'error'
          ? 'Revise advertencias, escala y fuentes antes de repetir el calculo.'
          : 'Ejecute Calcular para vincular barreras DXF con resultados preliminares.';

  const copyEvidenceSummary = async () => {
    if (!dxfEvidence) return;
    const summary = [
      `Evidence ID: ${dxfEvidence.id}`,
      `Estado: ${dxfEvidence.verificationStatus}`,
      `Hash: ${dxfEvidence.excerptHash}`,
      `Titulo: ${dxfEvidence.title}`,
      `Claim: ${dxfEvidence.claim}`,
      `Extracto: ${dxfEvidence.excerpt}`,
      `Notas: ${dxfEvidence.notes}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopyState('copied');
      toast.success('Resumen DXF copiado', { description: dxfEvidence.excerptHash });
      window.setTimeout(() => setCopyState('idle'), 1600);
    } catch {
      toast.error('No se pudo copiar el resumen DXF');
    }
  };

  return (
    <section
      data-testid="dxf-import-review-panel"
      className="fixed bottom-9 right-4 z-[65] w-[340px] max-w-[calc(100vw-2rem)] rounded-md border border-slate-200 bg-white/98 shadow-xl"
      aria-label="Revision de geometria DXF para memoria"
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-700">Revision DXF</div>
          <div className="max-w-[260px] truncate text-[10px] text-slate-500" title={metadata.fileName}>
            {metadata.fileName ?? floorPlan.name}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          title="Cerrar panel de revision DXF"
          aria-label="Cerrar revision DXF"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 px-3 py-3 text-[11px] text-slate-600">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={isPreliminary ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}>
            {isPreliminary ? 'Preliminar' : 'Confirmado'}
          </Badge>
          <Badge variant="outline">Modo {metadata.mode ?? 'DXF'}</Badge>
          <Badge variant="outline">{floorPlan.barriers.length} barreras</Badge>
          <Badge variant="outline">{floorPlan.sources.length} fuentes</Badge>
        </div>
        <div data-testid="dxf-review-workflow-steps" className="rounded border border-slate-200 bg-slate-50 p-2">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Flujo CAD/DXF</div>
          <div className="grid grid-cols-5 gap-1">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="min-w-0 text-center">
                <div
                  className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-bold ${
                    step.done
                      ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                      : step.active
                        ? 'border-amber-300 bg-amber-100 text-amber-800'
                        : 'border-slate-200 bg-white text-slate-400'
                  }`}
                  title={step.label}
                >
                  {index + 1}
                </div>
                <div className="mt-1 truncate text-[9px] text-slate-500" title={step.label}>{step.label}</div>
              </div>
            ))}
          </div>
          <div data-testid="dxf-review-next-action" className="mt-2 rounded bg-white px-2 py-1 text-[10px] leading-snug text-slate-600">
            <span className="font-semibold text-slate-700">Siguiente:</span> {nextAction}
          </div>
        </div>
        <div
          data-testid="dxf-review-calculation-status"
          className={`rounded border p-2 ${
            calculationStatus === 'complete'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : calculationStatus === 'blocked-no-source'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : calculationStatus === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Calculo preliminar DXF</span>
            <span>{calculationLabel}</span>
          </div>
          <div className="mt-1 text-[10px] leading-snug">
            {metadata.calculationMessage ?? 'Confirme geometria y ejecute calculo cuando exista una fuente radiologica.'}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
          <dt className="text-slate-400">Escala</dt>
          <dd className="text-right font-medium text-slate-700">{hasScale ? `${floorPlan.scale_m_per_pixel.toPrecision(4)} m/px` : 'pendiente'}</dd>
          <dt className="text-slate-400">Barreras mapeadas</dt>
          <dd className="text-right font-medium text-slate-700">{metadata.mappedBarriers ?? floorPlan.barriers.length}</dd>
          <dt className="text-slate-400">Importado</dt>
          <dd className="text-right font-medium text-slate-700">{metadata.importedAt ? new Date(metadata.importedAt).toLocaleTimeString('es-MX') : 'sin fecha'}</dd>
          <dt className="text-slate-400">Confirmado</dt>
          <dd className="text-right font-medium text-slate-700">{metadata.confirmedAt ? new Date(metadata.confirmedAt).toLocaleTimeString('es-MX') : 'pendiente'}</dd>
        </dl>

        <div className={readyForMemory ? 'rounded border border-emerald-200 bg-emerald-50 p-2 text-emerald-800' : 'rounded border border-amber-200 bg-amber-50 p-2 text-amber-800'}>
          <div className="flex items-center gap-1 font-semibold">
            {readyForMemory ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            {readyForMemory ? 'Listo para calculo y memoria' : 'Requiere revision antes de memoria'}
          </div>
          <div className="mt-1 text-[10px] leading-snug">
            {readyForMemory
              ? 'La geometria fue confirmada; puede usarse como base trazable para calculo, Evidence Pack y Memoria IA.'
              : 'Revise escala, capas y continuidad de muros antes de emitir resultados o anexos.'}
          </div>
        </div>

        {dxfEvidence && (
          <div className="rounded border border-blue-200 bg-blue-50 p-2 text-blue-900" data-testid="dxf-review-evidence-source">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">Evidencia trazable</div>
                <div className="mt-1 text-[10px] leading-snug text-blue-800">
                  {dxfEvidence.id} - {dxfEvidence.verificationStatus} - {dxfEvidence.excerptHash}
                </div>
              </div>
              <button
                type="button"
                onClick={copyEvidenceSummary}
                className="rounded border border-blue-200 bg-white px-1.5 py-1 text-blue-700 hover:bg-blue-100"
                title="Copiar resumen de evidencia DXF"
                aria-label="Copiar resumen de evidencia DXF"
                data-testid="dxf-review-copy-evidence"
              >
                <ClipboardCopy className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-1 line-clamp-2 text-[10px] leading-snug text-blue-700">{dxfEvidence.notes}</div>
            {copyState === 'copied' && <div className="mt-1 text-[10px] font-semibold text-emerald-700">Copiado al portapapeles</div>}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="rounded border border-slate-200 bg-slate-50 p-2">
            <div className="mb-1 font-semibold text-slate-700">Advertencias</div>
            <ul className="max-h-24 space-y-1 overflow-auto pr-1">
              {warnings.slice(0, 6).map((warning, index) => (
                <li key={`${warning}-${index}`} className="leading-snug text-slate-500">- {warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {onPlaceClinicalSources && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[11px]"
              onClick={onPlaceClinicalSources}
              title="Colocar LINAC, Gamma Knife, ciclotron y PET como fuentes preliminares trazables sobre el plano DXF."
              data-testid="dxf-review-place-clinical-sources"
            >
              <Radiation className="mr-1 h-3.5 w-3.5" /> Fuentes
            </Button>
          )}
          {isPreliminary && (
            <Button size="sm" className="h-8 text-[11px]" onClick={onConfirm} data-testid="dxf-review-confirm">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirmar
            </Button>
          )}
          <Button
            size="sm"
            variant={isPreliminary ? 'outline' : 'default'}
            className="h-8 text-[11px]"
            onClick={onRunCalculations}
            disabled={isPreliminary}
            title={isPreliminary ? 'Primero confirme la geometria DXF revisada.' : 'Ejecutar calculo preliminar con barreras DXF confirmadas.'}
            data-testid="dxf-review-calculate"
          >
            <Calculator className="mr-1 h-3.5 w-3.5" /> Calcular
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={onOpenMemoriaAI} data-testid="dxf-review-memoria">
            <FileText className="mr-1 h-3.5 w-3.5" /> Memoria IA
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={onOpenEvidencePack} data-testid="dxf-review-evidence">
            <FileSearch className="mr-1 h-3.5 w-3.5" /> Evidencia
          </Button>
        </div>
      </div>
    </section>
  );
}
