import type { F520F524DeepRendererBabylonContract } from '@/lib/f520F524DeepRendererBabylon';

export type F525F529Modality = 'TX' | 'NM' | 'DX' | 'CY';
export type F525F529PlacementStatus = 'ready' | 'review' | 'blocked';

export interface F525F529ClinicalPlacementPack {
  schema: 'radshield-mx.f525-f529.clinical-placement-pack.v1';
  phaseRange: 'F525-F529';
  status: 'placement-ready' | 'placement-review';
  defaultSelection: {
    modality: F525F529Modality;
    room: string;
    equipment: string;
    material: string;
    memoryProfile: string;
  };
  catalog: Array<{
    id: string;
    phase: 'F525' | 'F526' | 'F527' | 'F528' | 'F529';
    modality: F525F529Modality;
    room: string;
    equipment: string;
    material: string;
    footprint_m: [number, number];
    memoryProfile: string;
    evidenceRoute: string;
    action: 'select-placement' | 'open-3d' | 'handoff-memory' | 'export-visual';
    status: F525F529PlacementStatus;
  }>;
  handoff: {
    target: 'MedicalFloorPlan3DDialog';
    payloadFields: string[];
    canOpen3D: boolean;
    canWriteCanvasGeometry: false;
    rule: string;
  };
  qa: {
    requiredChecks: string[];
    rollback: string[];
  };
}

export function buildF525F529ClinicalPlacementPack(options: {
  deepLane?: F520F524DeepRendererBabylonContract;
  selectedModality?: F525F529Modality;
} = {}): F525F529ClinicalPlacementPack {
  const catalog: F525F529ClinicalPlacementPack['catalog'] = [
    {
      id: 'tx-linac-versa-hd',
      phase: 'F525',
      modality: 'TX',
      room: 'Bunker LINAC',
      equipment: 'Elekta Versa HD 15 MV',
      material: 'Concreto alta densidad',
      footprint_m: [3.2, 4.1],
      memoryProfile: 'Memoria TX LINAC',
      evidenceRoute: 'Canvas -> barreras primarias/secundarias -> NCRP151/IAEA -> Memoria IA',
      action: 'open-3d',
      status: 'ready',
    },
    {
      id: 'tx-gamma-knife-esprit',
      phase: 'F526',
      modality: 'TX',
      room: 'Sala Gamma Knife',
      equipment: 'Elekta Esprit Gamma Knife',
      material: 'Concreto + puerta blindada',
      footprint_m: [3.0, 3.2],
      memoryProfile: 'Memoria TX Gamma Knife',
      evidenceRoute: 'Canvas -> fuente Co-60 -> barreras/puerta -> memoria con evidencia',
      action: 'open-3d',
      status: 'ready',
    },
    {
      id: 'nm-pet-hotlab',
      phase: 'F527',
      modality: 'NM',
      room: 'Hot lab / PET uptake',
      equipment: 'PET/CT + fuente 511 keV',
      material: 'Plomo + concreto',
      footprint_m: [2.8, 3.6],
      memoryProfile: 'Memoria NM PET/CT',
      evidenceRoute: 'Canvas -> zonas controladas -> TG-108/NCRP -> anexos de dosis',
      action: 'handoff-memory',
      status: 'ready',
    },
    {
      id: 'dx-ct-room',
      phase: 'F528',
      modality: 'DX',
      room: 'Sala CT / RX',
      equipment: 'CT diagnostico',
      material: 'Tabique HD / plomo equivalente',
      footprint_m: [2.2, 3.0],
      memoryProfile: 'Memoria DX NCRP147',
      evidenceRoute: 'Canvas -> workload diagnostico -> NCRP147 -> reporte CNSNS/UAQ',
      action: 'select-placement',
      status: 'review',
    },
    {
      id: 'cy-kiube-18mev',
      phase: 'F529',
      modality: 'CY',
      room: 'Ciclotron KIUBE',
      equipment: 'Cyclone KIUBE 18 MeV',
      material: 'Concreto alta densidad + penetraciones MEP',
      footprint_m: [5.5, 7.0],
      memoryProfile: 'Memoria CY ciclotron',
      evidenceRoute: 'Canvas -> bunker/penetraciones -> neutrones/activacion -> evidencia',
      action: 'export-visual',
      status: 'review',
    },
  ];

  const selected = catalog.find((item) => item.modality === options.selectedModality) ?? catalog[0];
  const deepLane = options.deepLane;
  const deepReady = deepLane?.activationPolicy.canRunAsOverlay === true;
  const hasReview = catalog.some((item) => item.status === 'review');

  return {
    schema: 'radshield-mx.f525-f529.clinical-placement-pack.v1',
    phaseRange: 'F525-F529',
    status: hasReview ? 'placement-review' : 'placement-ready',
    defaultSelection: {
      modality: selected.modality,
      room: selected.room,
      equipment: selected.equipment,
      material: selected.material,
      memoryProfile: selected.memoryProfile,
    },
    catalog,
    handoff: {
      target: 'MedicalFloorPlan3DDialog',
      payloadFields: ['modality', 'room', 'equipment', 'material', 'footprint_m', 'memoryProfile', 'evidenceRoute'],
      canOpen3D: deepReady || Boolean(deepLane),
      canWriteCanvasGeometry: false,
      rule: 'F525-F529 registra seleccion y abre inspeccion 3D/memoria; no escribe geometria permanente ni reemplaza renderer base.',
    },
    qa: {
      requiredChecks: [
        'test:f525-f529:clinical-placement',
        'test:f520-f524:deep-renderer-babylon',
        'test:f517-f519:canvas-visual',
        'vite build --configLoader runner',
      ],
      rollback: [
        'Ocultar panel F525-F529 si obstruye canvas.',
        'Mantener Catalogo F517-F519 y boton Sembrar equipos + Render 3D.',
        'No persistir geometria generada hasta drag/drop profundo validado.',
      ],
    },
  };
}
