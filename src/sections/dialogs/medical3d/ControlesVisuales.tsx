import { Download, Eye, Navigation, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { babylonInstallOptions, lightingPresets, type Medical3DLightingPreset, type RealismAid } from './constantes';
import { AdvancedPhotorealPackPanel } from './PanelesUnityFotoreal';
import type { PanelMedical3DProps } from './tipos';

/** Interruptores de vista, recorrido WASD, fotorrealismo, materiales PBR, salida F408/F409 y ayudas visuales. */
export function ControlesVisuales({ estado, contratos, exportar }: PanelMedical3DProps) {
  const { applyVisualWorkflowPreset, babylonSmokeStatus, collisionEnabled, lightingPreset, mouseLookEnabled, pbrMaterialDb, photorealWalkthrough, realismAids, sceneHash, setCollisionEnabled, setLightingPreset, setMouseLookEnabled, setPhotorealWalkthrough, setShowCeiling, setShowClinicalDetail, setShowInspection, setWalkthrough, showCeiling, showClinicalDetail, showInspection, toggleRealismAid, walkthrough } = estado;
  const { advancedPhotorealPack, babylonContract, babylonParityContract, babylonSmokeContract, f408UnitySceneExport, f408UnityValidationWarnings, photorealAdvancedProfile } = contratos;
  const { handleExportAdvancedPhotorealPack, handleExportPbrMaterialDb, handleUpdatePbrMaterialDb } = exportar;
  return (
    <>
      <div className="flex items-center justify-between rounded border p-2">
        <span className="text-xs text-slate-600">Techo translucido</span>
        <Switch checked={showCeiling} onCheckedChange={setShowCeiling} />
      </div>

      <div className="flex items-center justify-between rounded border p-2">
        <span className="inline-flex items-center gap-2 text-xs text-slate-600">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          Detalle clinico
        </span>
        <Switch checked={showClinicalDetail} onCheckedChange={setShowClinicalDetail} />
      </div>

      <div className="flex items-center justify-between rounded border p-2">
        <span className="inline-flex items-center gap-2 text-xs text-slate-600">
          <Eye className="w-3.5 h-3.5 text-indigo-600" />
          Inspeccion visual
        </span>
        <Switch checked={showInspection} onCheckedChange={setShowInspection} />
      </div>

      <div className="flex items-center justify-between rounded border p-2">
        <span className="inline-flex items-center gap-2 text-xs text-slate-600">
          <Navigation className="w-3.5 h-3.5 text-cyan-600" />
          Recorrido WASD
        </span>
        <Switch checked={walkthrough} onCheckedChange={setWalkthrough} />
      </div>

      <div className="flex items-center justify-between rounded border p-2" data-testid="f324-pointer-lock-control">
        <span className="inline-flex items-center gap-2 text-xs text-slate-600">
          <Navigation className="w-3.5 h-3.5 text-violet-600" />
          Mouse-look
        </span>
        <Switch checked={mouseLookEnabled} onCheckedChange={setMouseLookEnabled} disabled={!walkthrough} />
      </div>

      <div className="space-y-2 rounded border border-slate-200 bg-white p-2" data-testid="f325-f330-photoreal-controls">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-xs text-slate-600">
            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            Colisiones
          </span>
          <Switch checked={collisionEnabled} onCheckedChange={setCollisionEnabled} disabled={!walkthrough} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-xs text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Recorrido fotoreal
          </span>
          <Switch checked={photorealWalkthrough} onCheckedChange={setPhotorealWalkthrough} disabled={!walkthrough} />
        </div>
        <Select value={lightingPreset} onValueChange={(value) => setLightingPreset(value as Medical3DLightingPreset)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clinical">Luz clinica</SelectItem>
            <SelectItem value="inspection">Luz inspeccion</SelectItem>
            <SelectItem value="warm">Luz recorrido</SelectItem>
          </SelectContent>
        </Select>
        <div className="rounded bg-slate-50 px-2 py-1 text-[10px] leading-relaxed text-slate-600">
          {lightingPresets[lightingPreset].label}. Hash visual: <span className="font-mono">{sceneHash}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-full justify-start text-xs"
          onClick={() => applyVisualWorkflowPreset('walkthrough')}
          data-testid="f461-photoreal-walkthrough-preset"
        >
          <Navigation className="w-3.5 h-3.5 mr-2" /> Preset recorrido fotoreal WASD
        </Button>
      </div>

      <div className="space-y-2 rounded border border-amber-100 bg-amber-50 p-2" data-testid="f461-photoreal-advanced-profile">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-amber-950 uppercase">F461 fotorrealismo avanzado</div>
            <div className="text-[9px] text-amber-900">Three/R3F + Babylon preview con ACES, PBR, sombras y recorrido.</div>
          </div>
          <Badge variant="outline" className="bg-white text-[9px]">{photorealAdvancedProfile.quality}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[9px] text-amber-950">
          <div className="rounded border border-amber-100 bg-white/85 px-1.5 py-1">DPR {photorealAdvancedProfile.dpr.join('-')}</div>
          <div className="rounded border border-amber-100 bg-white/85 px-1.5 py-1">ACES exp {photorealAdvancedProfile.exposure.toFixed(2)}</div>
          <div className="rounded border border-amber-100 bg-white/85 px-1.5 py-1">{photorealAdvancedProfile.shadowMap}</div>
          <div className="rounded border border-amber-100 bg-white/85 px-1.5 py-1">{photorealAdvancedProfile.envPreset}</div>
        </div>
        <div className="text-[9px] leading-relaxed text-amber-900">
          {photorealAdvancedProfile.warnings[0]} No modifica calculos ni memoria firmable.
        </div>
      </div>

      <AdvancedPhotorealPackPanel contract={advancedPhotorealPack} onExport={handleExportAdvancedPhotorealPack} />

      <div className="space-y-2 rounded border border-stone-200 bg-stone-50 p-2" data-testid="f462-pbr-material-gallery">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-stone-900 uppercase">F462 materiales PBR</div>
            <div className="text-[9px] text-stone-700">Fotos/swatch procedurales para acabados, carga visual y evidencia.</div>
          </div>
          <Badge variant="outline" className="bg-white text-[9px]">{pbrMaterialDb.version}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {pbrMaterialDb.records.slice(0, 6).map((material) => (
            <div key={material.id} className="overflow-hidden rounded border border-stone-200 bg-white text-[9px] text-stone-700">
              <div
                className="h-10 border-b border-stone-200"
                style={{
                  background:
                    material.family === 'lead' || material.family === 'steel'
                      ? `linear-gradient(135deg, ${material.color}, #f8fafc 42%, ${material.color})`
                      : `radial-gradient(circle at 25% 25%, #ffffff55, transparent 20%), repeating-linear-gradient(135deg, ${material.color}, ${material.color} 5px, #11182722 6px, ${material.color} 12px)`,
                }}
                title={`${material.name}: ${material.visualTexture}`}
              />
              <div className="p-1.5">
                <div className="font-semibold text-stone-900">{material.name}</div>
                <div>{material.density_kg_m3 ? `${material.density_kg_m3} kg/m3` : 'densidad pendiente'}</div>
                <div>R {material.roughness.toFixed(2)} / M {material.metalness.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" className="h-8 justify-start bg-white text-xs" onClick={handleUpdatePbrMaterialDb} data-testid="f463-update-pbr-db">
            <Sparkles className="w-3.5 h-3.5 mr-2" /> Actualizar DB
          </Button>
          <Button size="sm" variant="outline" className="h-8 justify-start bg-white text-xs" onClick={handleExportPbrMaterialDb} data-testid="f463-export-pbr-db">
            <Download className="w-3.5 h-3.5 mr-2" /> Export DB
          </Button>
        </div>
      </div>

      <div className="space-y-2 rounded border border-sky-100 bg-sky-50 p-2" data-testid="f463-wasd-visual-guide">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-sky-950 uppercase">F463 recorrido WASD</div>
            <div className="text-[9px] text-sky-900">Guia visual de inspeccion navegable y capturas.</div>
          </div>
          <Badge variant="outline" className="bg-white text-[9px]">{walkthrough ? 'ON' : 'OFF'}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-1 text-center text-[9px] text-sky-950">
          {['Q', 'W', 'E', 'A', 'S', 'D', 'R', 'Shift', 'Ctrl'].map((key) => (
            <span key={key} className="rounded border border-sky-100 bg-white/90 px-1.5 py-1 font-semibold">{key}</span>
          ))}
        </div>
        <div className="text-[9px] leading-relaxed text-sky-900">
          W/S avanza-retrocede, A/D lateral, Q/E gira, R/F altura, Shift acelera, Ctrl reduce velocidad. Mouse-look requiere activar recorrido.
        </div>
      </div>

      <div className="space-y-2 rounded border border-indigo-100 bg-indigo-50 p-2" data-testid="f409-f408-unity-scene-surface">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-indigo-950 uppercase">F409 / F408 salida 3D</div>
            <div className="text-[9px] text-indigo-900">Escena exportable para Evidence Pack, Memoria IA y visor externo.</div>
          </div>
          <Badge variant="outline" className="bg-white text-[9px]">{f408UnitySceneExport.status}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-1 text-[9px] text-indigo-950">
          <div className="rounded border border-indigo-100 bg-white/85 px-1.5 py-1">Muros {f408UnitySceneExport.walls.length}</div>
          <div className="rounded border border-indigo-100 bg-white/85 px-1.5 py-1">Equipos {f408UnitySceneExport.equipment.length}</div>
          <div className="rounded border border-indigo-100 bg-white/85 px-1.5 py-1">Zonas {f408UnitySceneExport.zones.length}</div>
        </div>
        <div className="text-[9px] leading-relaxed text-indigo-900">
          {f408UnityValidationWarnings[0] || 'Coordenadas en metros, Y-up y geometria lista para handoff externo.'}
        </div>
      </div>

      <div className="space-y-2 rounded border border-slate-200 bg-white p-2" data-testid="f363-three-r3f-realism-aids">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-slate-700 uppercase">Three/R3F ayudas visuales</div>
            <div className="text-[9px] text-slate-500">Capas no dosimetricas para inspeccion, evidencia y recorrido.</div>
          </div>
          <Badge variant="outline" className="text-[9px]">{Object.values(realismAids).filter(Boolean).length}/4</Badge>
        </div>
        {([
          ['materialBands', 'Bandas material/espesor', 'Color por tipo de barrera y espesor relativo.'],
          ['equipmentFootprints', 'Huellas de equipo', 'Footprint real para espacio libre y colision.'],
          ['beamGuides', 'Guias de haz/fuente', 'Visual no certificable para orientar isocentro/fuente.'],
          ['roomRulers', 'Reglas de sala', 'Cotas visuales de ancho y profundidad.'],
        ] as Array<[RealismAid, string, string]>).map(([id, label, description]) => (
          <button
            key={id}
            type="button"
            className={`w-full rounded border px-2 py-1.5 text-left text-[10px] transition ${realismAids[id] ? 'border-teal-200 bg-teal-50 text-teal-900' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
            onClick={() => toggleRealismAid(id)}
            aria-pressed={realismAids[id]}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{label}</span>
              <span>{realismAids[id] ? 'ON' : 'OFF'}</span>
            </div>
            <div className="mt-0.5 text-[9px] opacity-80">{description}</div>
          </button>
        ))}
      </div>

      <div className="space-y-2 rounded border border-violet-100 bg-violet-50 p-2" data-testid="f363-babylon-install-options">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-violet-900 uppercase">Babylon: reparacion/instalacion</span>
          <Badge variant="outline" className="bg-white text-[9px]">{babylonSmokeStatus === 'ready' ? 'runtime-smoke-ready' : babylonContract.readiness}</Badge>
        </div>
        <div className="text-[10px] leading-relaxed text-violet-900">
          Dependencias locales verificadas. F456-F458 agrega paridad de escena, medicion de rendimiento/fallback y export PNG visual.
        </div>
        <div className="rounded border border-violet-100 bg-white/85 p-2 text-[9px] text-violet-900">
          <div className="font-semibold">{babylonSmokeContract.status} / {babylonParityContract.status}</div>
          <div>{babylonSmokeContract.visualElements.join(' | ')}</div>
          <div className="mt-1" data-testid="f456-f458-babylon-parity-contract">
            Paridad: {babylonParityContract.parity.wallsFromScene} muros, {babylonParityContract.parity.equipmentFromScene} equipos, {babylonParityContract.parity.zonesFromScene} zonas. Export PNG: {babylonParityContract.exportGate.png ? 'ready' : 'review'}.
          </div>
        </div>
        <div className="space-y-1">
          {babylonInstallOptions.map((option) => (
            <div key={option.id} className="rounded border border-violet-100 bg-white/85 p-2 text-[9px] text-slate-700">
              <div className="font-semibold text-violet-900">{option.label}</div>
              <code className="mt-1 block break-words rounded bg-slate-50 px-1 py-0.5 font-mono text-[8px] text-slate-700">{option.command}</code>
              <div className="mt-1 text-slate-500">{option.useWhen}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
