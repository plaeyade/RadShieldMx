/**
 * Plano médico 3D (Three/R3F). Fase 8d: dividido en `./medical3d/` sin cambiar comportamiento:
 * - estado y escena: `useMedical3DEstado` (+ `useImportacionCadBim`), contratos visuales: `useContratosMedical3D`,
 *   exportaciones: `useExportacionesMedical3D`;
 * - paneles de la barra lateral: `PanelFlujoVisual`, `PanelesIntegracion`, `PanelMotor3D`, `ControlesVisuales`,
 *   `PanelesInspeccion`; visor: `VisorMedical3D` → `escena/RoomScene`.
 * Babylon sigue tras `VISOR_3D_BABYLON` (apagada por omisión) en `BabylonRuntimeSmokePreview`.
 */
import { Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { FloorPlan } from '@/types/radshield';
import { ControlesVisuales } from './medical3d/ControlesVisuales';
import { PanelFlujoVisual } from './medical3d/PanelFlujoVisual';
import { PanelMotor3D } from './medical3d/PanelMotor3D';
import { PanelesInspeccion } from './medical3d/PanelesInspeccion';
import { PanelesIntegracion } from './medical3d/PanelesIntegracion';
import { VisorMedical3D } from './medical3d/VisorMedical3D';
import { useContratosMedical3D } from './medical3d/useContratosMedical3D';
import { useExportacionesMedical3D } from './medical3d/useExportacionesMedical3D';
import { useMedical3DEstado } from './medical3d/useMedical3DEstado';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floorPlan: FloorPlan;
}

export default function MedicalFloorPlan3DDialog({ open, onOpenChange, floorPlan }: Props) {
  const estado = useMedical3DEstado(floorPlan);
  const contratos = useContratosMedical3D(estado);
  const exportar = useExportacionesMedical3D(estado, contratos);
  const panel = { estado, contratos, exportar };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[1200px] sm:max-w-[1200px] max-h-[92vh] p-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b bg-slate-50">
          <DialogTitle className="flex items-center justify-between gap-3 text-base">
            <span className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              Medical 3D Floor Plan
            </span>
            <span className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">Offline</Badge>
              <Badge variant="outline" className="text-[10px]">{estado.renderStrategy.label}</Badge>
              <Badge variant="outline" className="text-[10px]">CAD/BIM Fase 42</Badge>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[260px_minmax(0,1fr)] h-[72vh] min-h-[560px]">
          <aside className="border-r bg-white p-4 space-y-4 overflow-auto">
            <PanelFlujoVisual {...panel} />
            <PanelesIntegracion {...panel} />
            <PanelMotor3D {...panel} open={open} />
            <ControlesVisuales {...panel} />
            <PanelesInspeccion {...panel} />
          </aside>

          <VisorMedical3D estado={estado} contratos={contratos} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
