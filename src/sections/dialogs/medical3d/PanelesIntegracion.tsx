import { Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PanelMedical3DProps } from './tipos';

/** Integración F367-F370, pila visual F459-F468 y compuerta de capacidades F385-F386. */
export function PanelesIntegracion({ estado, contratos, exportar }: PanelMedical3DProps) {
  const { visualEvidenceCaptures } = estado;
  const { f367F370ReleaseIntegration, f459F463VisualStack, f464F468VisualBeta, productiveCapabilityRows } = contratos;
  const { handleExportF367F370Pack, handleExportF464F468BetaPack } = exportar;
  return (
    <>
      <div className="space-y-2 rounded border border-purple-100 bg-purple-50 p-2" data-testid="f367-f370-medical-3d-release-integration">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-purple-900 uppercase">F367-F370 integracion</div>
            <div className="text-[9px] text-purple-800">3D documental, Unity WebGL externo, motores y fotorrealismo.</div>
          </div>
          <Badge variant="outline" className="bg-white text-[9px]">{f367F370ReleaseIntegration.status}</Badge>
        </div>
        <div className="rounded border border-purple-100 bg-white/85 p-2 text-[9px] text-slate-600">
          <div>Unity: {f367F370ReleaseIntegration.unityWebgl.mode} / fallback {f367F370ReleaseIntegration.unityWebgl.fallback}</div>
          <div>MC: {f367F370ReleaseIntegration.externalEngines.engines.map((engine) => `${engine.id}:${engine.status}`).join(' | ')}</div>
          <div>Fotoreal: {f367F370ReleaseIntegration.photorealism.activeEngine}; Babylon pendiente</div>
          <div>Beta: {f367F370ReleaseIntegration.releaseGate.decision}</div>
        </div>
        <Button size="sm" variant="outline" className="w-full h-8 justify-start text-xs bg-white" onClick={handleExportF367F370Pack}>
          <Download className="w-3.5 h-3.5 mr-2" /> Export F367-F370
        </Button>
      </div>

      <div className="space-y-2 rounded border border-fuchsia-100 bg-fuchsia-50 p-2" data-testid="f459-f463-visual-stack">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-fuchsia-950 uppercase">F459-F463 visual stack</div>
            <div className="text-[9px] text-fuchsia-900">Unity, Babylon, fotorealismo, PBR DB y WASD.</div>
          </div>
          <Badge variant="outline" className="bg-white text-[9px]">{f459F463VisualStack.status}</Badge>
        </div>
        <div className="grid grid-cols-5 gap-1 text-[9px] text-fuchsia-950">
          {f459F463VisualStack.phases.map((phase) => (
            <div key={phase.id} className="rounded border border-fuchsia-100 bg-white/85 px-1.5 py-1" title={phase.output}>
              <div className="font-semibold">{phase.id}</div>
              <div className="truncate">{phase.label}</div>
            </div>
          ))}
        </div>
        <div className="text-[9px] leading-relaxed text-fuchsia-900">
          DB PBR {f459F463VisualStack.materialDb.version}: {f459F463VisualStack.materialDb.records} materiales. Unity externo queda visual-only hasta URL real.
        </div>
      </div>

      <div className="space-y-2 rounded border border-cyan-100 bg-cyan-50 p-2" data-testid="f464-f468-visual-beta">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-cyan-950 uppercase">F464-F468 RC visual beta</div>
            <div className="text-[9px] text-cyan-900">QA 3D, materiales, sync canvas/3D, Memoria IA y gate beta.</div>
          </div>
          <Badge variant="outline" className="bg-white text-[9px]">{f464F468VisualBeta.status}</Badge>
        </div>
        <div className="grid grid-cols-5 gap-1 text-[9px] text-cyan-950">
          {f464F468VisualBeta.phases.map((phase) => (
            <div key={phase.id} className={`rounded border px-1.5 py-1 ${phase.status === 'ready' ? 'border-cyan-200 bg-white' : 'border-amber-200 bg-amber-50'}`} title={phase.evidence}>
              <div className="font-semibold">{phase.id}</div>
              <div className="truncate">{phase.status}</div>
            </div>
          ))}
        </div>
        <div className="rounded border border-cyan-100 bg-white/85 p-2 text-[9px] leading-relaxed text-cyan-950">
          <div className="flex items-center justify-between gap-2"><span>Three/R3F</span><span>{f464F468VisualBeta.qa.threeR3f}</span></div>
          <div className="flex items-center justify-between gap-2"><span>Babylon</span><span>{f464F468VisualBeta.qa.babylon}</span></div>
          <div className="flex items-center justify-between gap-2"><span>WASD</span><span>{f464F468VisualBeta.qa.wasd}</span></div>
          <div className="flex items-center justify-between gap-2"><span>Unity</span><span>{f464F468VisualBeta.qa.unityHandoff}</span></div>
        </div>
        <Button size="sm" variant="outline" className="w-full h-8 justify-start bg-white text-xs" onClick={handleExportF464F468BetaPack} data-testid="f468-export-visual-beta-pack">
          <Download className="w-3.5 h-3.5 mr-2" /> Export F464-F468 beta
        </Button>
      </div>

      <div className="space-y-2 rounded border border-lime-100 bg-lime-50 p-2" data-testid="f465-material-technical-links">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-lime-950 uppercase">F465 materiales vinculados</div>
            <div className="text-[9px] text-lime-900">PBR + densidad + kg/m2 para toolbox tecnica.</div>
          </div>
          <Badge variant="outline" className="bg-white text-[9px]">{f464F468VisualBeta.materialLinks.length}</Badge>
        </div>
        <div className="max-h-32 space-y-1 overflow-auto">
          {f464F468VisualBeta.materialLinks.slice(0, 6).map((link) => (
            <div key={link.wallId} className="rounded border border-lime-100 bg-white/85 px-2 py-1 text-[9px] text-lime-950">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-semibold">{link.wallName}</span>
                <span>{link.requiredThickness_mm} mm</span>
              </div>
              <div className="truncate">{link.pbrMaterialName} / {link.density_kg_m3 ?? 'densidad ?'} kg/m3</div>
              <div>Carga visual: {link.structuralLoad_kg_m2 ?? 'pendiente'} kg/m2</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded border border-blue-100 bg-blue-50 p-2" data-testid="f466-canvas-3d-sync-map">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-blue-950 uppercase">F466 sync canvas/3D</div>
            <div className="text-[9px] text-blue-900">Targets auditables para seleccionar, inspeccionar y capturar.</div>
          </div>
          <Badge variant="outline" className="bg-white text-[9px]">{f464F468VisualBeta.syncLinks.length}</Badge>
        </div>
        <div className="max-h-28 space-y-1 overflow-auto">
          {f464F468VisualBeta.syncLinks.slice(0, 7).map((link) => (
            <div key={`${link.entityType}-${link.entityId}`} className="rounded border border-blue-100 bg-white/85 px-2 py-1 text-[9px] text-blue-950">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-semibold">{link.label}</span>
                <span>{link.entityType}</span>
              </div>
              <div className="truncate font-mono text-[8px]">{`${link.canvasTarget} -> ${link.threeDTarget}`}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded border border-rose-100 bg-rose-50 p-2" data-testid="f467-memoria-visual-evidence">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-rose-950 uppercase">F467 Memoria IA visual</div>
            <div className="text-[9px] text-rose-900">Capturas y secciones para PDF/Evidence.</div>
          </div>
          <Badge variant="outline" className="bg-white text-[9px]">{visualEvidenceCaptures.length} caps</Badge>
        </div>
        <div className="rounded border border-rose-100 bg-white/85 p-2 text-[9px] leading-relaxed text-rose-950">
          {f464F468VisualBeta.memoriaEvidence.reportSections.slice(0, 4).map((section) => (
            <div key={section}>- {section}</div>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded border border-emerald-100 bg-emerald-50 p-2" data-testid="f385-f386-productive-capability-gate">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-emerald-900 uppercase">F385-F386 capacidades productivas</div>
            <div className="text-[9px] text-emerald-800">Solo Three/R3F queda activo en el bundle actual; Unity/Babylon requieren gate live.</div>
          </div>
          <Badge variant="outline" className="bg-white text-[9px]">claim guard</Badge>
        </div>
        <div className="space-y-1">
          {productiveCapabilityRows.map((row) => (
            <div key={row.id} className="rounded border border-emerald-100 bg-white/85 px-2 py-1.5 text-[9px] text-slate-600">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-emerald-950">{row.label}</span>
                <span className={row.status === 'activo' || row.status === 'configurada' || row.status === 'runtime smoke' ? 'text-emerald-700' : 'text-amber-700'}>{row.status}</span>
              </div>
              <div className="mt-0.5 leading-relaxed">{row.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
