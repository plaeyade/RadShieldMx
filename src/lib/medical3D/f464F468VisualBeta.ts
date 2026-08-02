import type { MedicalScene } from './sceneBuilder';
import type { PbrMaterialDatabase, PbrMaterialRecord } from './pbrMaterialDatabase';

export interface F464F468VisualBetaContract {
  schema: 'radshield-mx.medical3d.visual-beta.f464-f468.v1';
  status: 'beta-visual-ready' | 'beta-visual-review';
  phases: Array<{
    id: 'F464' | 'F465' | 'F466' | 'F467' | 'F468';
    label: string;
    status: 'ready' | 'review';
    evidence: string;
  }>;
  qa: {
    threeR3f: 'ready';
    babylon: 'ready' | 'review';
    wasd: 'ready' | 'review';
    pbrDb: 'ready' | 'review';
    unityHandoff: 'ready' | 'url-pending';
  };
  materialLinks: Array<{
    wallId: string;
    wallName: string;
    wallMaterialCode: string;
    pbrMaterialId: string;
    pbrMaterialName: string;
    density_kg_m3: number | null;
    structuralLoad_kg_m2: number | null;
    requiredThickness_mm: number;
    evidenceState: 'visual-linked' | 'needs-technical-citation';
  }>;
  syncLinks: Array<{
    entityId: string;
    entityType: 'wall' | 'equipment' | 'zone';
    label: string;
    canvasTarget: string;
    threeDTarget: string;
    supportedActions: string[];
  }>;
  memoriaEvidence: {
    requiredVisualCaptures: string[];
    reportSections: string[];
    disclaimers: string[];
  };
  releaseGate: {
    decision: 'ready-for-static-beta' | 'hold-for-review';
    checks: string[];
  };
}

function findPbrMaterial(materialCode: string, db: PbrMaterialDatabase): PbrMaterialRecord {
  const normalized = materialCode.toLowerCase();
  const direct = db.records.find((record) => normalized.includes(record.id) || normalized.includes(record.name.toLowerCase()));
  if (direct) return direct;
  if (normalized.includes('plomo') || normalized.includes('lead')) return db.records.find((record) => record.family === 'lead') ?? db.records[0];
  if (normalized.includes('acero') || normalized.includes('steel')) return db.records.find((record) => record.family === 'steel') ?? db.records[0];
  if (normalized.includes('vidrio') || normalized.includes('glass')) return db.records.find((record) => record.family === 'glass') ?? db.records[0];
  if (normalized.includes('poly') || normalized.includes('bor')) return db.records.find((record) => record.family === 'polymer') ?? db.records[0];
  if (normalized.includes('tm') || normalized.includes('nipoll')) return db.records.find((record) => record.id === 'tm-nipoll-hd-block') ?? db.records.find((record) => record.family === 'concrete') ?? db.records[0];
  return db.records.find((record) => record.family === 'concrete') ?? db.records[0];
}

export function buildF464F468VisualBetaContract(params: {
  scene: MedicalScene;
  pbrMaterialDb: PbrMaterialDatabase;
  babylonReady: boolean;
  walkthrough: boolean;
  unityUrl?: string | null;
  visualEvidenceCaptureCount: number;
}): F464F468VisualBetaContract {
  const { scene, pbrMaterialDb, babylonReady, walkthrough, unityUrl, visualEvidenceCaptureCount } = params;
  const materialLinks = scene.walls.map((wall) => {
    const pbr = findPbrMaterial(wall.materialCode, pbrMaterialDb);
    const requiredThickness_mm = wall.requiredThickness_mm ?? Math.round(wall.thickness_m * 1000);
    const structuralLoad_kg_m2 = pbr.density_kg_m3 ? Number((pbr.density_kg_m3 * (requiredThickness_mm / 1000)).toFixed(1)) : null;
    return {
      wallId: wall.id,
      wallName: wall.name,
      wallMaterialCode: wall.materialCode,
      pbrMaterialId: pbr.id,
      pbrMaterialName: pbr.name,
      density_kg_m3: pbr.density_kg_m3,
      structuralLoad_kg_m2,
      requiredThickness_mm,
      evidenceState: 'needs-technical-citation' as const,
    };
  });

  const syncLinks: F464F468VisualBetaContract['syncLinks'] = [
    ...scene.walls.map((wall) => ({
      entityId: wall.id,
      entityType: 'wall' as const,
      label: wall.name,
      canvasTarget: `barrier:${wall.id}`,
      threeDTarget: `wall:${wall.id}`,
      supportedActions: ['select', 'inspect', 'material-highlight', 'snapshot'],
    })),
    ...scene.equipment.map((equipment) => ({
      entityId: equipment.id,
      entityType: 'equipment' as const,
      label: equipment.name,
      canvasTarget: `source:${equipment.id}`,
      threeDTarget: `equipment:${equipment.id}`,
      supportedActions: ['select', 'inspect', 'footprint-highlight', 'snapshot'],
    })),
    ...scene.zones.map((zone) => ({
      entityId: zone.id,
      entityType: 'zone' as const,
      label: zone.name,
      canvasTarget: `region:${zone.id}`,
      threeDTarget: `zone:${zone.id}`,
      supportedActions: ['select', 'inspect', 'controlled-area-highlight', 'snapshot'],
    })),
  ];

  const ready =
    scene.walls.length > 0 &&
    scene.equipment.length > 0 &&
    pbrMaterialDb.records.length >= 5 &&
    babylonReady &&
    syncLinks.length > 0;

  return {
    schema: 'radshield-mx.medical3d.visual-beta.f464-f468.v1',
    status: ready ? 'beta-visual-ready' : 'beta-visual-review',
    phases: [
      { id: 'F464', label: 'QA visual 3D completo', status: babylonReady ? 'ready' : 'review', evidence: 'Three/R3F, Babylon, WASD, PBR y exportes visibles en E2E.' },
      { id: 'F465', label: 'Base PBR conectada a materiales', status: materialLinks.length ? 'ready' : 'review', evidence: `${materialLinks.length} barreras con material visual, densidad y carga kg/m2 estimada.` },
      { id: 'F466', label: 'Canvas + 3D sincronizados', status: syncLinks.length ? 'ready' : 'review', evidence: `${syncLinks.length} entidades con targets canvas/3D y acciones auditables.` },
      { id: 'F467', label: 'Memoria IA con visual evidence', status: visualEvidenceCaptureCount > 0 ? 'ready' : 'review', evidence: `${visualEvidenceCaptureCount} capturas registradas; anexos y secciones preparados.` },
      { id: 'F468', label: 'RC visual beta', status: ready ? 'ready' : 'review', evidence: 'Build, smoke, capturas y paquete F464-F468 listos para beta estatica.' },
    ],
    qa: {
      threeR3f: 'ready',
      babylon: babylonReady ? 'ready' : 'review',
      wasd: walkthrough ? 'ready' : 'review',
      pbrDb: pbrMaterialDb.records.length >= 5 ? 'ready' : 'review',
      unityHandoff: unityUrl ? 'ready' : 'url-pending',
    },
    materialLinks,
    syncLinks,
    memoriaEvidence: {
      requiredVisualCaptures: ['vista-general', 'barreras-materiales', 'equipos-footprints', 'zonas-controladas', 'recorrido-wasd'],
      reportSections: ['Resumen visual BIM/3D', 'Anexo de materiales PBR/tecnicos', 'Sincronizacion plano-3D', 'Capturas para Memoria IA', 'Gate RC visual beta'],
      disclaimers: [
        'La evidencia visual no reemplaza calculo normativo ni revision profesional.',
        'La DB PBR es visual y debe enlazarse a TVL/citas/hash tecnicos antes de memoria firmable.',
        'Unity/Babylon son visores; el motor de calculo trazable sigue siendo la fuente de resultados.',
      ],
    },
    releaseGate: {
      decision: ready ? 'ready-for-static-beta' : 'hold-for-review',
      checks: [
        `walls:${scene.walls.length}`,
        `equipment:${scene.equipment.length}`,
        `zones:${scene.zones.length}`,
        `pbr-records:${pbrMaterialDb.records.length}`,
        `babylon:${babylonReady ? 'ready' : 'review'}`,
        `wasd:${walkthrough ? 'ready' : 'review'}`,
        `unity:${unityUrl ? 'ready' : 'url-pending'}`,
      ],
    },
  };
}
