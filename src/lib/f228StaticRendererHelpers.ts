import { getF228StaticHelperSummary } from '@/lib/canvas/renderStaticHelpers';

export interface F228StaticRendererHelpersInput {
  hasFloorPlanImage: boolean;
  scale: number;
  scale_m_per_pixel: number;
}

export function buildF228StaticRendererHelpers(input: F228StaticRendererHelpersInput) {
  const summary = getF228StaticHelperSummary();
  return {
    ...summary,
    phase: 'F228' as const,
    status: 'static-render-helpers-ready' as const,
    hasFloorPlanImage: input.hasFloorPlanImage,
    scaleReady: Number.isFinite(input.scale) && input.scale > 0,
    calibrationReady: Number.isFinite(input.scale_m_per_pixel) && input.scale_m_per_pixel > 0,
    operatorEvidence: [
      'background-grid helper activo en useCanvas.draw',
      'floorplan-image helper activo en useCanvas.draw',
      'hud-scale helper activo en useCanvas.draw',
    ],
    nextRendererStep:
      'F229 puede extraer regions-zones y barrier label helpers; no tocar selection-grips ni cad-overlays.',
  };
}
