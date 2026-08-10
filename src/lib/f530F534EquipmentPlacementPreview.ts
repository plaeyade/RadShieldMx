import type { F525F529ClinicalPlacementPack } from '@/lib/f525F529ClinicalPlacementPack';

export interface F530F534PlacementPoint {
  x: number;
  y: number;
  source: 'viewport-center' | 'context-menu' | 'manual' | 'drag';
}

export interface F530F534EquipmentPlacementPreview {
  schema: 'radshield-mx.f530-f534.equipment-placement-preview.v1';
  phaseRange: 'F530-F534';
  status: 'preview-ready' | 'preview-review';
  selected: {
    equipment: string;
    room: string;
    material: string;
    memoryProfile: string;
    modality: string;
  };
  ghost: {
    point: F530F534PlacementPoint;
    footprint_m: [number, number];
    footprint_px: [number, number];
    label: string;
    canRenderOnCanvas: boolean;
    canPersistGeometry: false;
  };
  properties: Array<{
    label: string;
    value: string;
    feeds: '3d' | 'memory' | 'evidence' | 'qa';
  }>;
  actions: Array<{
    phase: 'F530' | 'F531' | 'F532' | 'F533' | 'F534';
    label: string;
    effect: string;
    risk: 'low' | 'medium' | 'high';
  }>;
  qa: {
    requiredChecks: string[];
    rollback: string[];
  };
}

export function buildF530F534EquipmentPlacementPreview(options: {
  pack: F525F529ClinicalPlacementPack;
  point?: F530F534PlacementPoint;
  scale_m_per_pixel?: number;
}): F530F534EquipmentPlacementPreview {
  const selected = options.pack.catalog.find((item) => item.modality === options.pack.defaultSelection.modality) ?? options.pack.catalog[0];
  const scale = options.scale_m_per_pixel && options.scale_m_per_pixel > 0 ? options.scale_m_per_pixel : 0.01;
  const point = options.point ?? { x: 0, y: 0, source: 'viewport-center' as const };
  const footprint_px: [number, number] = [
    Math.max(Math.round(selected.footprint_m[0] / scale), 24),
    Math.max(Math.round(selected.footprint_m[1] / scale), 24),
  ];

  return {
    schema: 'radshield-mx.f530-f534.equipment-placement-preview.v1',
    phaseRange: 'F530-F534',
    status: selected.status === 'ready' ? 'preview-ready' : 'preview-review',
    selected: {
      equipment: selected.equipment,
      room: selected.room,
      material: selected.material,
      memoryProfile: selected.memoryProfile,
      modality: selected.modality,
    },
    ghost: {
      point,
      footprint_m: selected.footprint_m,
      footprint_px,
      label: `${selected.modality} ghost: ${selected.equipment}`,
      canRenderOnCanvas: true,
      canPersistGeometry: false,
    },
    properties: [
      { label: 'Equipo', value: selected.equipment, feeds: '3d' },
      { label: 'Sala', value: selected.room, feeds: 'memory' },
      { label: 'Material base', value: selected.material, feeds: 'evidence' },
      { label: 'Perfil de memoria', value: selected.memoryProfile, feeds: 'memory' },
      { label: 'Ruta de evidencia', value: selected.evidenceRoute, feeds: 'qa' },
    ],
    actions: [
      {
        phase: 'F530',
        label: 'Preview fantasma',
        effect: 'Muestra footprint y etiqueta del equipo sobre el canvas sin tocar floorPlan.sources.',
        risk: 'low',
      },
      {
        phase: 'F531',
        label: 'Confirmar punto',
        effect: 'Registra coordenada candidata para memoria/3D y actualiza ultimo comando.',
        risk: 'low',
      },
      {
        phase: 'F532',
        label: 'Propiedades inline',
        effect: 'Expone equipo, sala, material, footprint y perfil de memoria.',
        risk: 'low',
      },
      {
        phase: 'F533',
        label: 'Handoff memoria/3D',
        effect: 'Envia contexto al recorrido 3D y deja ruta plano -> equipo -> evidencia.',
        risk: 'medium',
      },
      {
        phase: 'F534',
        label: 'Gate persistencia CAD',
        effect: 'Bloquea escritura permanente hasta E2E de drag/drop, undo/redo y seleccion.',
        risk: 'high',
      },
    ],
    qa: {
      requiredChecks: [
        'test:f530-f534:equipment-placement-preview',
        'test:f525-f529:clinical-placement',
        'vite build --configLoader runner',
      ],
      rollback: [
        'Ocultar preview fantasma.',
        'Mantener selector TX/NM/DX/CY y handoff 3D F525-F529.',
        'No escribir floorPlan.sources desde F530-F534.',
      ],
    },
  };
}
