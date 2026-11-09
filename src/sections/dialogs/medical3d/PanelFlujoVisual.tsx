import { Activity, Camera, Download, Layers, MonitorCog } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Medical3DMode, MedicalRoomPreset } from '@/lib/medical3D/sceneBuilder';
import { SelectorComponentesDosis } from '../SelectorComponentesDosis';
import { visualWorkflowPresets } from './constantes';
import type { PanelMedical3DProps } from './tipos';

/** Sala, modo (con componentes de dosis), flujo visual F364 y evidencia visual F365-F366. */
export function PanelFlujoVisual({ estado, exportar }: PanelMedical3DProps) {
  const { applyVisualWorkflowPreset, componentesDisponibles, componentesDosis, mode, preset, setComponentesDosis, setMode, setPreset, visualEvidenceCaptures, visualEvidenceGate, visualWorkflow, visualWorkflowChecklist } = estado;
  const { handleExportVisualEvidencePack, handleExportVisualWorkflowPack, handleSnapshot } = exportar;
  return (
    <>
      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Sala clinica</div>
        <Select value={preset} onValueChange={(value) => setPreset(value as MedicalRoomPreset)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linac">LINAC bunker</SelectItem>
            <SelectItem value="petct">PET/CT suite</SelectItem>
            <SelectItem value="ct">CT imaging room</SelectItem>
            <SelectItem value="gammaKnife">Gamma Knife</SelectItem>
            <SelectItem value="hdr">HDR brachytherapy</SelectItem>
            <SelectItem value="radiofarmacia">Radiofarmacia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Modo</div>
        <Tabs value={mode} onValueChange={(value) => setMode(value as Medical3DMode)}>
          <TabsList className="grid grid-cols-1 h-auto gap-1 bg-transparent p-0">
            <TabsTrigger value="presentation" className="justify-start h-8 text-xs border">
              <MonitorCog className="w-3.5 h-3.5 mr-2" /> Presentacion
            </TabsTrigger>
            <TabsTrigger value="technical" className="justify-start h-8 text-xs border">
              <Layers className="w-3.5 h-3.5 mr-2" /> Tecnico
            </TabsTrigger>
            <TabsTrigger value="dose" className="justify-start h-8 text-xs border">
              <Activity className="w-3.5 h-3.5 mr-2" /> Dosis
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {mode === 'dose' && (
          <div className="space-y-1 rounded border border-slate-200 bg-white p-2" data-testid="medical3d-dosis-motor">
            <div className="text-[9px] text-slate-600">
              Kerma semanal del motor de campo con las barreras del plano: rojo &gt; 0.1, ámbar &gt; 0.02 mSv/sem.
            </div>
            <SelectorComponentesDosis disponibles={componentesDisponibles} seleccion={componentesDosis} onChange={setComponentesDosis} testId="medical3d-componentes" />
          </div>
        )}
      </div>

      <div className="space-y-2 rounded border border-emerald-100 bg-emerald-50 p-2" data-testid="f364-three-visual-workflow">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-emerald-900 uppercase">Flujo visual 3D</div>
            <div className="text-[9px] text-emerald-800">Presets para capturas, memoria y evidencia.</div>
          </div>
          <Badge variant="outline" className="bg-white text-[9px]">{visualWorkflow}</Badge>
        </div>
        <div className="grid grid-cols-1 gap-1">
          {visualWorkflowPresets.map((workflow) => (
            <button
              key={workflow.id}
              type="button"
              className={`rounded border px-2 py-1.5 text-left text-[10px] transition ${visualWorkflow === workflow.id ? 'border-emerald-300 bg-white text-emerald-950 shadow-sm' : 'border-emerald-100 bg-white/70 text-slate-600 hover:bg-white'}`}
              onClick={() => applyVisualWorkflowPreset(workflow.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{workflow.label}</span>
                <span className="text-[9px]">{workflow.mode}</span>
              </div>
              <div className="mt-0.5 text-[9px] opacity-80">{workflow.description}</div>
            </button>
          ))}
        </div>
        <div className="rounded border border-emerald-100 bg-white/85 p-2 text-[9px] text-slate-600">
          {visualWorkflowChecklist.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2 py-0.5">
              <span>{item.label}</span>
              <span className={item.status === 'ready' ? 'text-emerald-700' : item.status === 'blocked' ? 'text-red-700' : 'text-amber-700'}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" className="w-full h-8 justify-start text-xs bg-white" onClick={handleExportVisualWorkflowPack}>
          <Download className="w-3.5 h-3.5 mr-2" /> Exportar tour visual
        </Button>
      </div>

      <div className="space-y-2 rounded border border-sky-100 bg-sky-50 p-2" data-testid="f365-f366-visual-evidence-pack">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-sky-900 uppercase">Evidencia visual</div>
            <div className="text-[9px] text-sky-800">Capturas PNG trazadas por preset + compuerta QA.</div>
          </div>
          <Badge variant="outline" className="bg-white text-[9px]">{visualEvidenceGate.status}</Badge>
        </div>
        <div className="rounded border border-sky-100 bg-white/85 p-2 text-[9px] text-slate-600">
          <div className="flex items-center justify-between gap-2">
            <span>Capturas</span>
            <span>{visualEvidenceGate.captureCount}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>Checklist</span>
            <span>{visualEvidenceGate.readyChecklist}/{visualEvidenceGate.checklistTotal}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>Faltantes</span>
            <span>{visualEvidenceGate.missingWorkflows.length ? visualEvidenceGate.missingWorkflows.join(', ') : 'ninguno'}</span>
          </div>
          <div className="mt-1 text-sky-800">{visualEvidenceGate.recommendation}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" className="h-8 justify-start text-xs bg-white" onClick={handleSnapshot}>
            <Camera className="w-3.5 h-3.5 mr-2" /> Capturar
          </Button>
          <Button size="sm" variant="outline" className="h-8 justify-start text-xs bg-white" onClick={handleExportVisualEvidencePack}>
            <Download className="w-3.5 h-3.5 mr-2" /> Pack
          </Button>
        </div>
        {visualEvidenceCaptures.length > 0 && (
          <div className="max-h-28 space-y-1 overflow-auto">
            {visualEvidenceCaptures.slice(0, 5).map((capture) => (
              <div key={capture.id} className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-[9px] text-slate-600">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sky-900">{capture.label}</span>
                  <span>{capture.checklistReady}/{capture.checklistTotal}</span>
                </div>
                <div className="truncate font-mono text-[8px]">{capture.filename}</div>
                {capture.stationLabel && <div className="truncate text-[8px] text-slate-500">Estacion: {capture.stationLabel}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
