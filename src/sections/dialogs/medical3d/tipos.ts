import type { ContratosMedical3D } from './useContratosMedical3D';
import type { ExportacionesMedical3D } from './useExportacionesMedical3D';
import type { Medical3DEstado } from './useMedical3DEstado';

/** Props comunes de los paneles del diálogo Medical 3D. */
export interface PanelMedical3DProps {
  estado: Medical3DEstado;
  contratos: ContratosMedical3D;
  exportar: ExportacionesMedical3D;
  /** Diálogo abierto (habilita la vista previa Babylon cuando su bandera está activa). */
  open?: boolean;
}
