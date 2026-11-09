import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { lightingPresets, visualWorkflowPresets } from './constantes';
import { RoomScene } from './escena/RoomScene';
import type { PanelMedical3DProps } from './tipos';

/** Visor Three/R3F con sus insignias de estado y el panel de detalle de inspección. */
export function VisorMedical3D({ estado, contratos }: Pick<PanelMedical3DProps, 'estado' | 'contratos'>) {
  const {
    canvasWrapperRef, handleCanvasPointerLock, walkthrough, mouseLookEnabled, mouseLookLocked, hasGeometry, scene, mode,
    showCeiling, showClinicalDetail, collisionEnabled, photorealWalkthrough, lightingPreset, realismAids, showInspection,
    activeStation, activeStationId, f147Inspection, setInspectionTarget, inspectionTarget, visualWorkflow,
    visualWorkflowChecklist, renderStrategy, sceneHash,
  } = estado;
  const { photorealAdvancedProfile } = contratos;
  return (
    <main
      ref={canvasWrapperRef}
      className="relative min-w-0 h-full bg-[#eef3f5]"
      onClick={handleCanvasPointerLock}
      data-testid="f324-pointer-lock-workbench"
      title={walkthrough && mouseLookEnabled ? 'Click para capturar mouse. Esc para salir.' : undefined}
    >
      {hasGeometry ? (
        <Canvas
          className="h-full w-full"
          shadows
          dpr={photorealAdvancedProfile.dpr}
          camera={{ position: [7, 6, 9], fov: 45 }}
          gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFShadowMap; // Fase 8c: PCFSoftShadowMap está obsoleto en three (se degradaba a PCFShadowMap con aviso)
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = photorealAdvancedProfile.exposure;
            gl.outputColorSpace = THREE.SRGBColorSpace;
          }}
        >
          <Suspense fallback={null}>
            <RoomScene
              scene={scene}
              mode={mode}
              showCeiling={showCeiling}
              showClinicalDetail={showClinicalDetail}
              walkthrough={walkthrough}
              collisionEnabled={collisionEnabled}
              photorealWalkthrough={photorealWalkthrough && walkthrough}
              lightingPreset={lightingPreset}
              realismAids={realismAids}
              showInspection={showInspection}
              activeStation={activeStation}
              activeStationId={activeStationId}
              inspectionStations={f147Inspection.stations}
              onInspect={setInspectionTarget}
            />
          </Suspense>
        </Canvas>
      ) : (
        <div className="h-full flex items-center justify-center text-slate-500 text-sm">
          Agregue barreras o fuentes al plano para generar la escena medica.
        </div>
      )}

      <div className="absolute left-4 top-4 flex gap-2">
        <Badge className="bg-emerald-50/95 text-emerald-900 border-emerald-200 shadow-sm" variant="outline">
          F364: {visualWorkflowPresets.find((workflow) => workflow.id === visualWorkflow)?.label || visualWorkflow}
        </Badge>
        <Badge className="bg-emerald-50/95 text-emerald-900 border-emerald-200 shadow-sm" variant="outline">
          Checklist {visualWorkflowChecklist.filter((item) => item.status === 'ready').length}/{visualWorkflowChecklist.length}
        </Badge>
        <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
          {walkthrough ? 'WASD/flechas: recorrer' : 'Orbit: click + drag'}
        </Badge>
        <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
          {walkthrough ? 'Q/E: girar - Shift/Ctrl velocidad' : 'Zoom: scroll'}
        </Badge>
        {walkthrough && (
          <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
            R/F: altura camara
          </Badge>
        )}
        {walkthrough && mouseLookEnabled && (
          <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
            {mouseLookLocked ? 'Mouse capturado - Esc salir' : 'Click para mouse-look'}
          </Badge>
        )}
        <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
          {walkthrough ? 'Limites de sala activos' : 'Inspeccion por click'}
        </Badge>
        {walkthrough && collisionEnabled && (
          <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
            Colisiones activas
          </Badge>
        )}
        {photorealWalkthrough && walkthrough && (
          <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
            PBR + {lightingPresets[lightingPreset].label}
          </Badge>
        )}
        <Badge className="bg-white/90 text-slate-700 border shadow-sm" variant="outline">
          {renderStrategy.status === 'active' ? 'Render activo R3F' : `${renderStrategy.label}: adapter`}
        </Badge>
        <Badge className="bg-white/90 text-slate-700 border shadow-sm font-mono" variant="outline">
          {sceneHash}
        </Badge>
      </div>

      {inspectionTarget && (
        <div className="absolute right-4 top-4 w-72 rounded border bg-white/95 p-3 text-xs text-slate-700 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="font-semibold">{inspectionTarget.title}</div>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => setInspectionTarget(null)}>
              Cerrar
            </Button>
          </div>
          <div className="space-y-1">
            {inspectionTarget.details.map((detail) => <div key={detail}>{detail}</div>)}
          </div>
        </div>
      )}
    </main>
  );
}
