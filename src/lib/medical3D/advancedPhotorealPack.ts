import type { MedicalScene } from './sceneBuilder';
import type { PbrMaterialDatabase } from './pbrMaterialDatabase';

export type PhotorealAssetTier = 'procedural-safe' | 'local-assets-ready' | 'cinematic-heavy-gated';

export interface AdvancedPhotorealPackContract {
  schema: 'radshield-mx.medical3d.advanced-photoreal-pack.f479-f483.v1';
  phaseRange: 'F479-F483';
  status: 'procedural-photoreal-ready' | 'asset-folder-ready' | 'cinematic-assets-required';
  assetTier: PhotorealAssetTier;
  assetRoot: 'public/medical3d/photoreal';
  scene: {
    roomName: string;
    walls: number;
    equipment: number;
    zones: number;
    materials: number;
  };
  hdri: {
    mode: 'procedural-softbox' | 'local-hdri';
    expectedPath: 'public/medical3d/photoreal/hdri/clinical_softbox.hdr';
    fallback: 'Three/R3F procedural lights';
  };
  textures: Array<{
    id: string;
    label: string;
    expectedMaps: string[];
    materialFamily: string;
  }>;
  decals: Array<{
    id: string;
    label: string;
    role: 'safety' | 'mep' | 'finish' | 'equipment' | 'evidence';
    placement: string;
  }>;
  renderPresets: Array<{
    id: 'inspection' | 'presentation' | 'cinematic';
    label: string;
    use: string;
    gated: boolean;
  }>;
  phases: Array<{
    id: 'F479' | 'F480' | 'F481' | 'F482' | 'F483';
    label: string;
    evidence: string;
  }>;
  warnings: string[];
}

export function buildAdvancedPhotorealPackContract(params: {
  scene: MedicalScene;
  pbrMaterialDb: PbrMaterialDatabase;
  photorealEnabled: boolean;
}): AdvancedPhotorealPackContract {
  const { scene, pbrMaterialDb, photorealEnabled } = params;
  const assetTier: PhotorealAssetTier = photorealEnabled ? 'procedural-safe' : 'procedural-safe';
  return {
    schema: 'radshield-mx.medical3d.advanced-photoreal-pack.f479-f483.v1',
    phaseRange: 'F479-F483',
    status: photorealEnabled ? 'procedural-photoreal-ready' : 'asset-folder-ready',
    assetTier,
    assetRoot: 'public/medical3d/photoreal',
    scene: {
      roomName: scene.roomName,
      walls: scene.walls.length,
      equipment: scene.equipment.length,
      zones: scene.zones.length,
      materials: pbrMaterialDb.records.length,
    },
    hdri: {
      mode: 'procedural-softbox',
      expectedPath: 'public/medical3d/photoreal/hdri/clinical_softbox.hdr',
      fallback: 'Three/R3F procedural lights',
    },
    textures: [
      { id: 'hd-concrete', label: 'Concreto alta densidad', expectedMaps: ['albedo', 'normal', 'roughness', 'ao'], materialFamily: 'concrete' },
      { id: 'lead-sheet', label: 'Plomo laminado', expectedMaps: ['albedo', 'roughness', 'metalness'], materialFamily: 'lead' },
      { id: 'steel-frame', label: 'Acero/marcos', expectedMaps: ['albedo', 'normal', 'roughness', 'metalness'], materialFamily: 'steel' },
      { id: 'clinical-floor', label: 'Piso clinico/acabado', expectedMaps: ['albedo', 'normal', 'roughness'], materialFamily: 'finish' },
      { id: 'tm-nipoll-block', label: 'TM/NIPOLL HD', expectedMaps: ['albedo', 'normal', 'roughness', 'ao'], materialFamily: 'concrete' },
    ],
    decals: [
      { id: 'radiation-warning', label: 'Simbolo radiacion / acceso controlado', role: 'safety', placement: 'puertas y zonas controladas' },
      { id: 'penetration-tag', label: 'Etiqueta penetracion MEP', role: 'mep', placement: 'ductos, sleeves y huecos sobre barrera' },
      { id: 'wall-role-label', label: 'Rol primaria/secundaria/laberinto', role: 'evidence', placement: 'cara superior/lateral de barrera' },
      { id: 'equipment-footprint', label: 'Footprint fabricante/equipo', role: 'equipment', placement: 'base de LINAC/Gamma Knife/Ciclotron' },
      { id: 'finish-swatch', label: 'Acabado clinico visible', role: 'finish', placement: 'piso, plafon y cara interior' },
    ],
    renderPresets: [
      { id: 'inspection', label: 'Inspeccion tecnica', use: 'contraste alto, etiquetas y materiales legibles', gated: false },
      { id: 'presentation', label: 'Presentacion', use: 'luz suave, cutaway limpio y capturas para memoria', gated: false },
      { id: 'cinematic', label: 'Cinematico', use: 'HDRI/texturas 2K/4K, DOF y recorrido comercial', gated: true },
    ],
    phases: [
      { id: 'F479', label: 'Texturas versionadas', evidence: 'Asset root y mapas PBR esperados por familia de material.' },
      { id: 'F480', label: 'HDRI/iluminacion', evidence: 'Softbox procedural activo y ruta HDRI local preparada.' },
      { id: 'F481', label: 'Decals clinicos/BIM', evidence: 'Radiacion, penetraciones, roles, footprints y acabados.' },
      { id: 'F482', label: 'Presets render', evidence: 'Inspeccion, presentacion y cinematografico con gate.' },
      { id: 'F483', label: 'QA/export visual', evidence: 'Contrato, UI, E2E, capturas y manuales.' },
    ],
    warnings: [
      'Photoreal assets are visual evidence only.',
      'Texture appearance must not override TVL, density, cost, structural load or citation authority.',
      'Cinematic assets should stay lazy-loaded and gated to protect the static deploy.',
    ],
  };
}
