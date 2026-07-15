import type { EvidenceSource } from './evidencePack';
import type { Medical3DMode, MedicalRoomPreset, MedicalScene } from './medical3D/sceneBuilder';

export type CadxIntegrationMode = 'external-ai-render-brief' | 'browser-design-engine' | 'manual-reference';

export interface CadxReadinessItem {
  id: string;
  label: string;
  status: 'ready' | 'planned' | 'external';
  note: string;
}

export interface CadxRenderBrief {
  schemaVersion: 'radshield-cadx-render-brief-v1';
  generatedBy: 'RadShield-MX Medical 3D Floor Plan';
  integrationMode: CadxIntegrationMode;
  generatedAt: string;
  sourceSite: 'https://cadxstudio.in/';
  room: {
    name: string;
    preset: MedicalRoomPreset;
    mode: Medical3DMode;
    dimensions_m: {
      width: number;
      depth: number;
      ceiling: number;
    };
  };
  clinicalIntent: string;
  stylePrompt: string;
  negativePrompt: string;
  geometrySummary: {
    barriers: number;
    primaryBarriers: number;
    secondaryBarriers: number;
    maxRequiredThickness_mm: number;
    equipment: string[];
    materials: string[];
  };
  complianceNotes: string[];
  checklist: CadxReadinessItem[];
}

export const CADX_STUDIO_EXTERNAL_NOTE =
  'CADx Studio queda como referencia/integracion externa para AI design/render en navegador; RadShield-MX exporta briefs auditables y mantiene calculos de blindaje separados del render generativo.';

export const CADX_STUDIO_READINESS_CHECKLIST: CadxReadinessItem[] = [
  {
    id: 'brief-export',
    label: 'Exportar brief de escena clinica',
    status: 'ready',
    note: 'RadShield-MX genera un JSON con geometria, sala, materiales y restricciones visuales.',
  },
  {
    id: 'obj-export',
    label: 'Exportar OBJ desde Medical 3D',
    status: 'ready',
    note: 'La geometria base se puede entregar a un flujo externo de visualizacion o render.',
  },
  {
    id: 'ai-render',
    label: 'Render AI en navegador externo',
    status: 'external',
    note: 'El motor generativo debe tratarse como visualizacion, no como fuente regulatoria.',
  },
  {
    id: 'regulated-output',
    label: 'Separacion calculo vs render',
    status: 'ready',
    note: 'Los espesores, dosis y resultados CNSNS/NCRP se validan en modulos de calculo, no en el render.',
  },
  {
    id: 'roundtrip',
    label: 'Round-trip visual con evidencia',
    status: 'planned',
    note: 'Fase futura: guardar capturas/render junto con Evidence Pack y revision BIM.',
  },
];

function presetIntent(preset: MedicalRoomPreset) {
  const intents: Record<MedicalRoomPreset, string> = {
    linac: 'Photorealistic radiotherapy LINAC bunker with shielding walls, treatment couch, gantry, warning light, console window and clean clinical finishes.',
    petct: 'Photorealistic PET/CT imaging suite with scanner gantry, patient table, shielded control area, injection workflow context and controlled access.',
    ct: 'Photorealistic CT imaging room with scanner, control window, clean flooring, ceiling lights and medical equipment layout.',
    gammaKnife: 'Photorealistic Gamma Knife treatment suite with shielded treatment room, patient table and controlled clinical workflow.',
    hdr: 'Photorealistic HDR brachytherapy suite with afterloader area, shielded barriers and controlled clinical room details.',
    radiofarmacia: 'Photorealistic radiopharmacy hot lab with shielded work cells, lead glass, stainless finishes and controlled workflow.',
  };
  return intents[preset];
}

function modeStyle(mode: Medical3DMode) {
  if (mode === 'dose') return 'include subtle translucent dose/isodose overlays without hiding architectural geometry';
  if (mode === 'technical') return 'technical review style with clear materials, edges, wall thickness cues and neutral lighting';
  return 'presentation render style with realistic clinical finishes, soft shadows and inspectable equipment';
}

export function buildCadxRenderBrief(input: {
  scene: MedicalScene;
  preset: MedicalRoomPreset;
  mode: Medical3DMode;
}): CadxRenderBrief {
  const materials = Array.from(new Set(input.scene.walls.map((wall) => wall.materialCode || 'default')));
  return {
    schemaVersion: 'radshield-cadx-render-brief-v1',
    generatedBy: 'RadShield-MX Medical 3D Floor Plan',
    integrationMode: 'external-ai-render-brief',
    generatedAt: new Date().toISOString(),
    sourceSite: 'https://cadxstudio.in/',
    room: {
      name: input.scene.roomName,
      preset: input.preset,
      mode: input.mode,
      dimensions_m: {
        width: Number(input.scene.bounds.width.toFixed(2)),
        depth: Number(input.scene.bounds.depth.toFixed(2)),
        ceiling: 3.1,
      },
    },
    clinicalIntent: presetIntent(input.preset),
    stylePrompt: `${presetIntent(input.preset)} Use ${modeStyle(input.mode)}. Preserve room proportions, wall locations and equipment placement from the source geometry.`,
    negativePrompt: 'Do not change shielding wall layout, do not invent dose values, do not show patients, PHI, logos, unsafe access, cluttered stock-photo composition or unrealistic radiation effects.',
    geometrySummary: {
      barriers: input.scene.walls.length,
      primaryBarriers: input.scene.review.primaryBarriers,
      secondaryBarriers: input.scene.review.secondaryBarriers,
      maxRequiredThickness_mm: Math.round(input.scene.review.maxRequiredThickness_mm),
      equipment: input.scene.equipment.map((item) => item.name),
      materials,
    },
    complianceNotes: [
      CADX_STUDIO_EXTERNAL_NOTE,
      'Render AI solo para comunicacion visual y revision espacial; no sustituye calculos NCRP/CNSNS.',
      'Validar manualmente cualquier visual externo antes de anexarlo a una memoria analitica.',
      'No exportar PHI ni informacion sensible de pacientes.',
    ],
    checklist: CADX_STUDIO_READINESS_CHECKLIST,
  };
}

export function createCadxEvidenceSource(brief: CadxRenderBrief): EvidenceSource {
  const now = new Date().toISOString();
  return {
    id: `ev-cadx-${Date.now()}`,
    title: `Brief AI render CADx: ${brief.room.name}`,
    url: brief.sourceSite,
    sourceType: 'technicalReport',
    capturedAt: now,
    author: 'RadShield-MX',
    publishedDate: now.slice(0, 10),
    claim: `Brief de visualizacion generado para ${brief.geometrySummary.barriers} barreras y ${brief.geometrySummary.equipment.length} equipos.`,
    excerpt: brief.stylePrompt,
    notes: CADX_STUDIO_EXTERNAL_NOTE,
    confidence: 'medium',
    tags: ['CADx Studio', 'AI render', 'Medical 3D', 'visualizacion'],
  };
}
