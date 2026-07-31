import type { MedicalScene } from './sceneBuilder';

export type PhotorealQuality = 'standard' | 'inspection' | 'presentation';

export interface PhotorealAdvancedProfile {
  schema: 'radshield-mx.medical3d.photoreal-advanced.f388.v1';
  quality: PhotorealQuality;
  dpr: [number, number];
  toneMapping: 'ACESFilmicToneMapping';
  exposure: number;
  shadowMap: 'PCFSoftShadowMap';
  envPreset: 'clinical-softbox' | 'inspection-high-contrast' | 'presentation-warm';
  materialEvidence: string[];
  warnings: string[];
}

export function buildPhotorealAdvancedProfile(input: {
  scene: MedicalScene;
  enabled: boolean;
  lightingPreset: 'clinical' | 'inspection' | 'warm';
  walkthrough: boolean;
}): PhotorealAdvancedProfile {
  const denseScene = input.scene.walls.length + input.scene.equipment.length > 40;
  const quality: PhotorealQuality = !input.enabled
    ? 'standard'
    : input.walkthrough
      ? 'presentation'
      : 'inspection';
  const exposure = input.lightingPreset === 'inspection' ? 1.04 : input.lightingPreset === 'warm' ? 0.96 : 1;
  return {
    schema: 'radshield-mx.medical3d.photoreal-advanced.f388.v1',
    quality,
    dpr: denseScene ? [1, 1.35] : quality === 'presentation' ? [1, 1.75] : [1, 1.5],
    toneMapping: 'ACESFilmicToneMapping',
    exposure,
    shadowMap: 'PCFSoftShadowMap',
    envPreset:
      input.lightingPreset === 'inspection'
        ? 'inspection-high-contrast'
        : input.lightingPreset === 'warm'
          ? 'presentation-warm'
          : 'clinical-softbox',
    materialEvidence: [
      'procedural concrete/lead/steel/glass textures',
      'PBR roughness/metalness by shielding material',
      'scene hash carried to PNG/OBJ/JSON evidence',
    ],
    warnings: [
      'Photoreal output is visual evidence only.',
      'No photoreal render changes shielding calculations.',
      'Use deterministic calculations, citations and RSO/FM review for signed analytic memory.',
    ],
  };
}
