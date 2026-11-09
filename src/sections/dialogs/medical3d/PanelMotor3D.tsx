import { Download, MonitorCog } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MEDICAL_3D_RENDER_STRATEGIES, type Medical3DRenderEngine } from '@/lib/medical3D/renderStrategy';
import { NOTA_VISOR_EN_REVISION, VISOR_3D_BABYLON } from '@/lib/featureFlags';
import { BabylonRuntimeSmokePreview } from './BabylonRuntimeSmokePreview';
import { UnityWebglExportedBuildPreview } from './PanelesUnityFotoreal';
import type { PanelMedical3DProps } from './tipos';

/** Selector de motor 3D (F307-F309): Three/R3F activo; Babylon tras VISOR_3D_BABYLON; puente Unity. */
export function PanelMotor3D({ estado, contratos, exportar, open }: PanelMedical3DProps) {
  const { hasGeometry, pbrMaterialDb, renderEngine, renderStrategy, scene, setBabylonSmokeStatus, setRenderEngine } = estado;
  const { babylonDeepContract, f520ToF524DeepRendererBabylon, unityExportedBuildContract, unityLaunchPacket } = contratos;
  const { handleExportEngineHandoff, handleExportUnityHandoff, handleOpenUnityExternalViewer } = exportar;
  return (
    <>
      <div className="space-y-2 rounded border border-slate-200 bg-slate-50 p-2" data-testid="f307-f309-render-engine-selector">
        <div className="text-[11px] font-semibold text-slate-500 uppercase">Motor 3D</div>
        <Select value={renderEngine} onValueChange={(value) => setRenderEngine(value as Medical3DRenderEngine)}>
          <SelectTrigger className="h-8 text-xs bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEDICAL_3D_RENDER_STRATEGIES.map((strategy) => (
              <SelectItem key={strategy.id} value={strategy.id}>{strategy.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="rounded border bg-white p-2 text-[10px] leading-relaxed text-slate-600">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-800">{renderStrategy.status}</span>
            <Badge variant="outline" className="text-[9px]">{renderStrategy.id}</Badge>
          </div>
          <div>{renderStrategy.role}</div>
          <div className="mt-1 text-amber-700">{renderStrategy.activationGate}</div>
        </div>
        {VISOR_3D_BABYLON ? (
          <BabylonRuntimeSmokePreview
            scene={scene}
            enabled={open && hasGeometry}
            onStatusChange={setBabylonSmokeStatus}
            deepContract={babylonDeepContract}
          />
        ) : (
          <div
            className="rounded border border-amber-200 bg-amber-50 p-2 text-[10px] text-amber-900"
            data-testid="babylon-visor-en-revision"
          >
            Vista previa Babylon — {NOTA_VISOR_EN_REVISION}. El visor 3D activo es Three/R3F.
          </div>
        )}
        <div
          data-testid="f520-f524-deep-renderer-babylon-3d"
          className="rounded border border-cyan-100 bg-white p-2 text-[10px] leading-relaxed text-slate-650"
          title="F520-F524: Babylon profundo y renderer profundo con fallback estable"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-900">F520-F524 Deep renderer + Babylon</span>
            <Badge variant="outline" className="text-[9px]">{f520ToF524DeepRendererBabylon.status}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[9px]" data-testid="f521-babylon-deep-summary">
            <span className="rounded bg-cyan-50 px-1 py-0.5">Pick {f520ToF524DeepRendererBabylon.babylon.pickableEntities}</span>
            <span className="rounded bg-cyan-50 px-1 py-0.5">Cam {f520ToF524DeepRendererBabylon.babylon.cameraModes.length}</span>
            <span className="rounded bg-cyan-50 px-1 py-0.5">Over {f520ToF524DeepRendererBabylon.babylon.overlays.length}</span>
          </div>
          <div className="mt-1 text-amber-700" data-testid="f523-deep-activation-policy">
            Reemplazo de canvas base: {String(f520ToF524DeepRendererBabylon.activationPolicy.canReplaceCanvasBase)}. Babylon y renderer v2 quedan visuales hasta repetir QA/rollback.
          </div>
        </div>
        <Button size="sm" variant="outline" className="w-full h-8 justify-start text-xs bg-white" onClick={handleExportEngineHandoff}>
          <Download className="w-3.5 h-3.5 mr-2" /> Exportar handoff 3D
        </Button>
        <div
          className="rounded border bg-white p-2 text-[10px] leading-relaxed text-slate-600"
          data-testid="f315-unity-external-viewer-bridge"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="font-semibold text-slate-800">F459-F460 Unity bridge</span>
            <Badge variant="outline" className="text-[9px]">{unityLaunchPacket.readiness}</Badge>
          </div>
          <div>{unityLaunchPacket.viewer.url || 'URL pendiente por VITE_MEDICAL_3D_UNITY_WEBGL_URL'}</div>
          <div className="mt-1 text-amber-700">Handoff listo: geometria, materiales PBR, bookmarks y boundary visual-only. Three/R3F queda como fallback clinico visual.</div>
          <div className="mt-1 grid grid-cols-4 gap-1 text-[9px]" data-testid="f459-f460-unity-bridge-summary">
            <span className="rounded bg-slate-50 px-1 py-0.5">Muros {unityLaunchPacket.querySummary.walls}</span>
            <span className="rounded bg-slate-50 px-1 py-0.5">Eq {unityLaunchPacket.querySummary.equipment}</span>
            <span className="rounded bg-slate-50 px-1 py-0.5">Zonas {unityLaunchPacket.querySummary.zones}</span>
            <span className="rounded bg-slate-50 px-1 py-0.5">PBR {pbrMaterialDb.records.length}</span>
          </div>
        </div>
        <UnityWebglExportedBuildPreview
          contract={unityExportedBuildContract}
          onOpenExternal={handleOpenUnityExternalViewer}
          onExportHandoff={handleExportUnityHandoff}
        />
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" className="h-8 justify-start text-xs bg-white" onClick={handleExportUnityHandoff}>
            <Download className="w-3.5 h-3.5 mr-2" /> Unity JSON
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 justify-start text-xs bg-white"
            onClick={handleOpenUnityExternalViewer}
            disabled={!unityExportedBuildContract.viewerUrl}
          >
            <MonitorCog className="w-3.5 h-3.5 mr-2" /> Abrir Unity
          </Button>
        </div>
      </div>
    </>
  );
}
