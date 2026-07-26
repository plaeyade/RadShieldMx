export interface F292CanvasSurfaceInput {
  hasMainCanvas: boolean;
  hasSidebar: boolean;
  hasImportFloorPlan: boolean;
  hasDxfRecovery: boolean;
  hasScaleCalibration: boolean;
  hasLayers: boolean;
  hasDimensionSchedule: boolean;
  hasEquipmentSymbols: boolean;
  hasHeatmapLegend: boolean;
  hasVisualExport: boolean;
  hasWorkflowPanelControls: boolean;
  hasMedical3DHandoff: boolean;
}

export interface F292FloorplanQaItem {
  id: string;
  label: string;
  status: 'ready' | 'guarded';
  evidence: string;
  operatorCheck: string;
}

export interface F292RealProjectFloorplanQa {
  schema: 'radshield-mx.f292.real-project-floorplan-qa.v1';
  phase: 'F292';
  status: 'real-project-floorplan-qa-ready' | 'real-project-floorplan-qa-guarded';
  readyCount: number;
  guardedCount: number;
  items: F292FloorplanQaItem[];
  realProjectEntryOrder: string[];
  highRiskRendererDecision: string;
}

export function buildF292RealProjectFloorplanQa(input: F292CanvasSurfaceInput): F292RealProjectFloorplanQa {
  const items: F292FloorplanQaItem[] = [
    {
      id: 'shell',
      label: 'canvas/sidebar visible',
      status: input.hasMainCanvas && input.hasSidebar ? 'ready' : 'guarded',
      evidence: 'Main canvas and stable sidebar are mandatory before real project entry.',
      operatorCheck: 'Open app, confirm sidebar and floorplan viewport are visible before loading plans.',
    },
    {
      id: 'plan-import',
      label: 'plan import path',
      status: input.hasImportFloorPlan && input.hasDxfRecovery ? 'ready' : 'guarded',
      evidence: 'Image/PDF base plan plus DXF recovery remain the supported path; native DWG stays external conversion.',
      operatorCheck: 'Load PNG/PDF or converted DXF and verify scale/layers before tracing barriers.',
    },
    {
      id: 'scale',
      label: 'scale calibration',
      status: input.hasScaleCalibration ? 'ready' : 'guarded',
      evidence: 'Scale must exist before thickness, dose, cost, mass and structural load are trusted.',
      operatorCheck: 'Calibrate with a known dimension and verify m/pixel in HUD.',
    },
    {
      id: 'cad-edition',
      label: 'CAD editing surfaces',
      status: input.hasLayers && input.hasDimensionSchedule && input.hasEquipmentSymbols ? 'ready' : 'guarded',
      evidence: 'Layers, dimension schedule and equipment symbols are required for a usable clinical floorplan.',
      operatorCheck: 'Trace barriers, place equipment footprint and confirm schedule updates.',
    },
    {
      id: 'dose-visuals',
      label: 'heatmap/isocontour visual QA',
      status: input.hasHeatmapLegend ? 'ready' : 'guarded',
      evidence: 'Heatmap/isocontour legend is visual QA only until numeric cases are accepted.',
      operatorCheck: 'Run calculation, enable heat/iso view and check regulatory legend before exporting.',
    },
    {
      id: 'export-handoff',
      label: 'visual export and 3D handoff',
      status: input.hasVisualExport && input.hasMedical3DHandoff ? 'ready' : 'guarded',
      evidence: 'Snapshots and medical 3D handoff are required for Memoria IA/PDF/Evidence Pack.',
      operatorCheck: 'Export canvas scene and open 3D inspection with same equipment/barriers.',
    },
    {
      id: 'panel-controls',
      label: 'movable/closable workflow panels',
      status: input.hasWorkflowPanelControls ? 'ready' : 'guarded',
      evidence: 'Panels must move, compact or close so they do not cover the floorplan during real layout work.',
      operatorCheck: 'Move/compact/cerrar panel Layout Blindaje Memoria and restore it from controls.',
    },
  ];

  const readyCount = items.filter((item) => item.status === 'ready').length;
  const guardedCount = items.length - readyCount;

  return {
    schema: 'radshield-mx.f292.real-project-floorplan-qa.v1',
    phase: 'F292',
    status: guardedCount === 0 ? 'real-project-floorplan-qa-ready' : 'real-project-floorplan-qa-guarded',
    readyCount,
    guardedCount,
    items,
    realProjectEntryOrder: [
      'Import plan or converted DXF',
      'Calibrate scale',
      'Trace controlled/adjacent areas',
      'Place equipment symbols and source metadata',
      'Assign materials and occupancy/use/design goals',
      'Run calculation and inspect heatmap/isocontours',
      'Export Memoria IA/PDF/Evidence/3D snapshots',
    ],
    highRiskRendererDecision:
      'Do not replace renderer base/event controller before F292 is ready. Only then consider flagged renderer v2 with rollback.',
  };
}
