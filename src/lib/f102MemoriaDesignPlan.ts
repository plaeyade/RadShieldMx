import type { CanvasBarrierResult, CanvasSampleLine } from '@/hooks/useCanvas';
import type { FloorPlan, RadiationSource } from '@/types/radshield';

export type F102StepStatus = 'complete' | 'active' | 'pending' | 'blocked';

export interface F102MemoryDesignStep {
  id: string;
  title: string;
  status: F102StepStatus;
  action: string;
  evidence: string;
}

export interface F102MemoryDesignPlan {
  score: number;
  equipmentSummary: string;
  floorPlanSummary: string;
  recommendedStandard: string;
  steps: F102MemoryDesignStep[];
  missingInputs: string[];
  nextBestAction: string;
}

function classifySource(source?: RadiationSource | null) {
  const text = `${source?.name ?? ''} ${source?.modality?.name ?? ''} ${source?.modality?.category ?? ''} ${source?.modality?.standard ?? ''}`.toLowerCase();
  if (text.includes('pet') || text.includes('spect') || text.includes('nuclear') || text.includes('fdg')) return 'TG-108 / NCRP 147 adaptado';
  if (text.includes('cyclotron') || text.includes('ciclot')) return 'IAEA SRS 47 / NCRP 144';
  if (text.includes('linac') || text.includes('mv') || text.includes('therapy')) return 'NCRP 151';
  if (text.includes('ct') || text.includes('rx') || text.includes('radiograf') || text.includes('fluoro')) return 'NCRP 147';
  return source?.modality?.standard ?? 'NCRP 147/151 segun modalidad';
}

function status(ready: boolean, active = false, blocked = false): F102StepStatus {
  if (blocked) return 'blocked';
  if (ready) return 'complete';
  return active ? 'active' : 'pending';
}

export function buildF102MemoryDesignPlan(input: {
  floorPlan?: FloorPlan;
  selectedEquipmentName?: string;
  selectedEquipmentKey?: string;
  barrierResults?: CanvasBarrierResult[];
  sampleLines?: CanvasSampleLine[];
}): F102MemoryDesignPlan {
  const floorPlan = input.floorPlan;
  const barriers = floorPlan?.barriers ?? [];
  const sources = floorPlan?.sources ?? [];
  const regions = floorPlan?.occupiedRegions ?? [];
  const criticalPoints = floorPlan?.criticalPoints ?? [];
  const results = input.barrierResults ?? [];
  const sampleLines = input.sampleLines ?? [];
  const primarySource = sources[0];
  const equipmentSummary = input.selectedEquipmentName
    || primarySource?.name
    || primarySource?.modality?.name
    || 'Equipo no definido';
  const recommendedStandard = input.selectedEquipmentKey
    ? classifySource({ name: input.selectedEquipmentKey } as RadiationSource)
    : classifySource(primarySource);

  const hasLayout = Boolean(floorPlan?.imageUrl || barriers.length > 0);
  const hasEquipment = Boolean(input.selectedEquipmentKey || sources.length > 0);
  const hasScale = Boolean(floorPlan?.scale_m_per_pixel && floorPlan.scale_m_per_pixel > 0);
  const hasBarriers = barriers.length > 0;
  const hasZones = regions.length > 0 || criticalPoints.length > 0;
  const hasWorkload = sources.some((source) => Number(source.workloadValue) > 0 || Number(source.workloadHoursPerWeek) > 0);
  const hasCalculation = results.length > 0 || barriers.some((barrier) => Boolean(barrier.requiredThickness_mm || barrier.maxKerma));
  const hasEvidence = sampleLines.length > 0 || hasCalculation;

  const steps: F102MemoryDesignStep[] = [
    {
      id: 'layout',
      title: '1. Leer floorplan y escala',
      status: status(hasLayout && hasScale, hasLayout && !hasScale),
      action: hasScale ? 'Usar escala del plano para distancias y cotas.' : 'Calibrar escala antes de cerrar la memoria.',
      evidence: `${barriers.length} barreras, escala ${floorPlan?.scale_m_per_pixel ? `${floorPlan.scale_m_per_pixel} m/px` : 'pendiente'}.`,
    },
    {
      id: 'equipment',
      title: '2. Identificar equipo y fuente',
      status: status(hasEquipment),
      action: hasEquipment ? 'Confirmar fabricante, energia, modalidad y workload.' : 'Seleccionar equipo o sembrar una fuente en el plano.',
      evidence: `${sources.length} fuentes/equipos en canvas. Equipo guia: ${equipmentSummary}.`,
    },
    {
      id: 'zones',
      title: '3. Definir zonas controladas y ocupacion',
      status: status(hasZones, hasBarriers && !hasZones),
      action: hasZones ? 'Usar zonas/puntos para justificar T y P.' : 'Dibujar zona controlada y puntos criticos adyacentes.',
      evidence: `${regions.length} zonas, ${criticalPoints.length} puntos criticos.`,
    },
    {
      id: 'barriers',
      title: '4. Clasificar barreras por uso',
      status: status(hasBarriers),
      action: hasBarriers ? 'Separar primarias, secundarias, puerta, techo/suelo y laberinto.' : 'Dibujar barreras del recinto antes del calculo.',
      evidence: `${barriers.filter((b) => b.barrierType === 'primary').length} primarias, ${barriers.filter((b) => b.barrierType !== 'primary').length} secundarias.`,
    },
    {
      id: 'workload',
      title: '5. Completar carga de trabajo',
      status: status(hasWorkload, hasEquipment && !hasWorkload),
      action: hasWorkload ? 'Congelar W, U, T, P y supuestos clinicos.' : 'Capturar pacientes/semana, dosis, actividad o horas de uso.',
      evidence: `${sources.filter((source) => Number(source.workloadValue) > 0).length} fuentes con workload.`,
    },
    {
      id: 'calculation',
      title: '6. Ejecutar calculo y validar',
      status: status(hasCalculation, hasBarriers && hasEquipment && hasWorkload),
      action: hasCalculation ? 'Trazar resultado a formula, norma, entrada y salida.' : 'Ejecutar calculo de blindaje y revisar PASS/FAIL.',
      evidence: `${results.length} resultados canvas, ${barriers.filter((barrier) => barrier.requiredThickness_mm).length} barreras con espesor.`,
    },
    {
      id: 'evidence',
      title: '7. Preparar evidencia y anexos',
      status: status(hasEvidence, hasCalculation && !hasEvidence),
      action: hasEvidence ? 'Anexar Evidence Pack, heatmap, plano y tablas.' : 'Generar Evidence Pack con citas, lineas 0.3 m y capturas.',
      evidence: `${sampleLines.length} lineas de muestra / evidencia visual.`,
    },
  ];

  const missingInputs = steps
    .filter((step) => step.status !== 'complete')
    .map((step) => step.action);
  const completeCount = steps.filter((step) => step.status === 'complete').length;
  const score = Math.round((completeCount / steps.length) * 100);
  const nextBestAction = missingInputs[0] ?? 'Generar memoria analitica con trazabilidad completa.';

  return {
    score,
    equipmentSummary,
    floorPlanSummary: `${floorPlan?.name ?? 'Proyecto'}: ${barriers.length} barreras, ${sources.length} equipos/fuentes, ${regions.length} zonas.`,
    recommendedStandard,
    steps,
    missingInputs,
    nextBestAction,
  };
}
