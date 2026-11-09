import { Camera, Download, RotateCcw, Sparkles, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CADX_STUDIO_EXTERNAL_NOTE } from '@/lib/cadxStudioIntegration';
import { CAD_CODE_VERIFY_EXTERNAL_NOTE } from '@/lib/cadCodeVerify';
import type { PanelMedical3DProps } from './tipos';

/** Inspección F92/F147, importación CAD/BIM, exportaciones y resumen de la escena. */
export function PanelesInspeccion({ estado, exportar }: PanelMedical3DProps) {
  const { activeFloorPlan, f147Inspection, f92Inspection, scene, setActiveStationId, setInspectionTarget, setShowInspection, setWalkthrough } = estado;
  const { cadError, cadSummary, clearCadImport, fileInputRef, handleCadImport, importedFloorPlan } = estado.cad;
  const { handleExportCadxBrief, handleExportF147Pack, handleExportOBJ, handleExportReviewJSON, handleExportVerifyPack, handleSnapshot } = exportar;
  return (
    <>
      <div
        data-testid="f92-3d-inspection-readiness"
        className="rounded border border-teal-100 bg-teal-50 p-2 text-xs text-teal-900 space-y-1"
        title={f92Inspection.reviewItems.join(' ') || 'Inspeccion 3D lista'}
      >
        <div className="flex items-center justify-between">
          <span className="font-bold">F92 inspeccion 3D</span>
          <Badge variant="outline" className="text-[9px] bg-white">
            {f92Inspection.inspectionReady ? 'ready' : 'draft'}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
          <span>Muros: {f92Inspection.walls}</span>
          <span>Equipos: {f92Inspection.equipment}</span>
          <span>Zonas: {f92Inspection.zones}</span>
          <span>Control: {f92Inspection.controlledZones}</span>
          <span className="col-span-2">
            Max espesor: {(f92Inspection.maxWallThickness_m * 1000).toFixed(1)} mm
          </span>
        </div>
        {f92Inspection.reviewItems.length > 0 && (
          <div className="text-[9px] text-amber-700">
            {f92Inspection.reviewItems.length} pendiente(s) antes de captura final.
          </div>
        )}
      </div>

      <div
        data-testid="f147-medical-3d-inspection"
        className="rounded border border-cyan-100 bg-cyan-50 p-2 text-xs text-cyan-950 space-y-2"
        title={f147Inspection.decision}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold">F147 inspeccion medica 3D</span>
          <Badge variant="outline" className="text-[9px] bg-white">
            {f147Inspection.stations.length} estaciones
          </Badge>
        </div>
        <div className="text-[10px] leading-relaxed">{f147Inspection.walkthroughMode}</div>
        <div className="space-y-1">
          {f147Inspection.stations.map((station) => (
            <button
              key={station.id}
              type="button"
              className="w-full rounded border border-cyan-100 bg-white/80 px-2 py-1 text-left hover:bg-white"
              onClick={() => {
                setWalkthrough(true);
                setShowInspection(true);
                setActiveStationId(station.id);
                setInspectionTarget({
                  type: 'zone',
                  id: station.id,
                  title: station.label,
                  details: [
                    station.purpose,
                    `Posicion: ${station.position.map((value) => value.toFixed(2)).join(', ')}`,
                    `Evidencia: ${station.evidence.join(', ')}`,
                  ],
                });
              }}
            >
              <div className="font-semibold text-[10px]">{station.label}</div>
              <div className="truncate text-[9px] text-cyan-800">{station.purpose}</div>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1 text-[9px]">
          {f147Inspection.qaChecklist.map((item) => (
            <div key={item.id} className="rounded bg-white/70 border border-cyan-100 px-1.5 py-1">
              <span className={item.status === 'ready' ? 'text-emerald-700' : 'text-amber-700'}>{item.status.toUpperCase()}</span>
              {' '}{item.label}
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" className="w-full h-8 justify-start text-xs bg-white" onClick={handleExportF147Pack}>
          <Download className="w-3.5 h-3.5 mr-2" /> Exportar F147 pack
        </Button>
      </div>

      <div className="rounded border bg-slate-50 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">CAD/BIM</div>
          {importedFloorPlan && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={clearCadImport}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Plano
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          data-testid="medical-cad-input"
          type="file"
          accept=".dxf,.ifc"
          className="hidden"
          onChange={handleCadImport}
        />
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 justify-start text-xs"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-3.5 h-3.5 mr-2" /> Importar DXF/IFC
        </Button>
        {cadSummary && (
          <div className="text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-700">{activeFloorPlan.name}</div>
            <div>Tipo: {cadSummary.kind.toUpperCase()}</div>
            <div>Entidades: {cadSummary.sourceEntities}</div>
            <div>Mapeadas: {cadSummary.mappedBarriers}</div>
            <div>Capas: {cadSummary.detectedLayers.length || 1}</div>
            {cadSummary.warnings.map((warning) => (
              <div key={warning} className="text-amber-700">{warning}</div>
            ))}
          </div>
        )}
        {cadError && <div className="text-xs text-red-600">{cadError}</div>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleSnapshot}>
          <Camera className="w-3.5 h-3.5 mr-1" /> PNG
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExportOBJ}>
          <Download className="w-3.5 h-3.5 mr-1" /> OBJ
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExportReviewJSON}>
          <Download className="w-3.5 h-3.5 mr-1" /> JSON
        </Button>
      </div>

      <div className="rounded border bg-teal-50 p-3 space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-teal-800 uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          CADx / AI Render
        </div>
        <div className="text-[11px] text-teal-900 leading-relaxed">
          {CADX_STUDIO_EXTERNAL_NOTE}
        </div>
        <Button size="sm" variant="outline" className="w-full h-8 justify-start text-xs bg-white" onClick={handleExportCadxBrief}>
          <Download className="w-3.5 h-3.5 mr-2" /> Exportar AI Brief
        </Button>
      </div>

      <div className="rounded border bg-indigo-50 p-3 space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-800 uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          CADCodeVerify
        </div>
        <div className="text-[11px] text-indigo-900 leading-relaxed">
          {CAD_CODE_VERIFY_EXTERNAL_NOTE}
        </div>
        <Button size="sm" variant="outline" className="w-full h-8 justify-start text-xs bg-white" onClick={handleExportVerifyPack}>
          <Download className="w-3.5 h-3.5 mr-2" /> Exportar Verify Pack
        </Button>
      </div>

      <div className="rounded border bg-slate-50 p-3 text-xs text-slate-600 space-y-2">
        <div className="font-semibold text-slate-700">{scene.roomName}</div>
        <div>Barreras: {scene.walls.length}</div>
        <div>Equipos: {scene.equipment.length}</div>
        <div>Zonas: {scene.zones.length}</div>
        <div>Primarias/sec.: {scene.review.primaryBarriers}/{scene.review.secondaryBarriers}</div>
        <div>Max. espesor: {Math.round(scene.review.maxRequiredThickness_mm)} mm</div>
        <div>Escala: {scene.floorScaleLabel}</div>
        <div>Area aprox.: {(scene.bounds.width * scene.bounds.depth).toFixed(1)} m2</div>
      </div>

      <div className="text-[11px] text-slate-500 leading-relaxed">
        El render es una visualizacion de revision. Los espesores y resultados regulatorios deben validarse en los modulos de calculo.
      </div>
    </>
  );
}
