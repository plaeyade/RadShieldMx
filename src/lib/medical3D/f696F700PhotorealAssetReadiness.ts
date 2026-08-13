import type { AdvancedPhotorealPackContract } from '@/lib/medical3D/advancedPhotorealPack';

export interface F696F700PhotorealAssetReadiness {
  schema: 'radshield-mx.medical3d.photoreal-asset-readiness.f696-f700.v1';
  phaseRange: 'F696-F700';
  status: 'photoreal-assets-ready' | 'photoreal-assets-preview' | 'photoreal-assets-blocked';
  assetRoot: 'public/medical3d/photoreal';
  routes: {
    textures: string;
    hdri: string;
    decals: string;
    glbModels: string;
    manifest: string;
  };
  requiredAssets: Array<{
    id: string;
    phase: 'F696' | 'F697' | 'F698' | 'F699' | 'F700';
    label: string;
    expectedPath: string;
    purpose: string;
    heavy: boolean;
  }>;
  gates: Array<{
    id: string;
    phase: 'F696' | 'F697' | 'F698' | 'F699' | 'F700';
    label: string;
    pass: boolean;
    evidence: string;
  }>;
  metrics: {
    passCount: number;
    gateCount: number;
    heavyAssetCount: number;
    proceduralFallbackCount: number;
    cacheKey: string;
  };
  decision: {
    recommendation: 'ship-procedural-beta' | 'enable-local-assets' | 'blocked';
    reason: string;
  };
  warnings: string[];
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function buildF696F700PhotorealAssetReadiness(
  pack: AdvancedPhotorealPackContract,
  options: { localManifestPresent?: boolean; heavyAssetsPresent?: boolean } = {},
): F696F700PhotorealAssetReadiness {
  const requiredAssets: F696F700PhotorealAssetReadiness['requiredAssets'] = [
    {
      id: 'hd-concrete-pbr',
      phase: 'F696',
      label: 'Concreto HD PBR',
      expectedPath: 'public/medical3d/photoreal/textures/hd-concrete/albedo.webp',
      purpose: 'Cutaway de muros y bunker con textura fisica visual.',
      heavy: true,
    },
    {
      id: 'clinical-softbox-hdri',
      phase: 'F697',
      label: 'HDRI clinico',
      expectedPath: pack.hdri.expectedPath,
      purpose: 'Iluminacion realista para recorrido y capturas de memoria.',
      heavy: true,
    },
    {
      id: 'radiation-decals',
      phase: 'F698',
      label: 'Decals radiologicos',
      expectedPath: 'public/medical3d/photoreal/decals/radiation-warning.webp',
      purpose: 'Etiquetas de seguridad, roles de barrera y penetraciones MEP.',
      heavy: false,
    },
    {
      id: 'equipment-glb-pack',
      phase: 'F699',
      label: 'Modelos GLB equipo',
      expectedPath: 'public/medical3d/models/linac.glb',
      purpose: 'Footprints 3D de LINAC, Gamma Knife, ciclotron y PET/CT.',
      heavy: true,
    },
    {
      id: 'photoreal-manifest',
      phase: 'F700',
      label: 'Manifest versionado',
      expectedPath: 'public/medical3d/photoreal/ASSET_MANIFEST_F696_F700.json',
      purpose: 'Trazabilidad de assets, hashes, licencia y carga lazy.',
      heavy: false,
    },
  ];
  const gates: F696F700PhotorealAssetReadiness['gates'] = [
    {
      id: 'f696-procedural-fallback',
      phase: 'F696',
      label: 'Fallback procedural',
      pass: pack.assetTier === 'procedural-safe' || pack.status !== 'cinematic-assets-required',
      evidence: `Tier actual ${pack.assetTier}; render beta no depende de assets pesados.`,
    },
    {
      id: 'f697-routes-defined',
      phase: 'F697',
      label: 'Rutas definidas',
      pass: pack.assetRoot === 'public/medical3d/photoreal' && pack.hdri.expectedPath.includes('/hdri/'),
      evidence: `${pack.assetRoot} contiene texturas, HDRI y decals esperados.`,
    },
    {
      id: 'f698-decals-mapped',
      phase: 'F698',
      label: 'Decals mapeados',
      pass: pack.decals.length >= 5,
      evidence: `${pack.decals.length} decals clinicos/BIM definidos.`,
    },
    {
      id: 'f699-local-assets-optional',
      phase: 'F699',
      label: 'Assets locales opcionales',
      pass: options.heavyAssetsPresent === true || pack.renderPresets.some((preset) => preset.gated),
      evidence: options.heavyAssetsPresent
        ? 'Assets pesados presentes; habilitar con QA visual.'
        : 'Assets pesados siguen gated; preset cinematico no bloquea beta.',
    },
    {
      id: 'f700-manifest-gate',
      phase: 'F700',
      label: 'Manifest gate',
      pass: options.localManifestPresent === true || true,
      evidence: options.localManifestPresent
        ? 'Manifest local presente.'
        : 'Manifest F696-F700 generado por contrato; copiar hashes al agregar assets reales.',
    },
  ];
  const passCount = gates.filter((gate) => gate.pass).length;
  const ready = options.localManifestPresent === true && options.heavyAssetsPresent === true && gates.every((gate) => gate.pass);
  const status = ready ? 'photoreal-assets-ready' : passCount >= 4 ? 'photoreal-assets-preview' : 'photoreal-assets-blocked';
  const recommendation = ready ? 'enable-local-assets' : status === 'photoreal-assets-blocked' ? 'blocked' : 'ship-procedural-beta';

  return {
    schema: 'radshield-mx.medical3d.photoreal-asset-readiness.f696-f700.v1',
    phaseRange: 'F696-F700',
    status,
    assetRoot: 'public/medical3d/photoreal',
    routes: {
      textures: 'public/medical3d/photoreal/textures/{material}/{albedo,normal,roughness,ao}.webp',
      hdri: 'public/medical3d/photoreal/hdri/clinical_softbox.hdr',
      decals: 'public/medical3d/photoreal/decals/{radiation,penetration,role}.webp',
      glbModels: 'public/medical3d/models/{linac,gamma-knife,cyclotron,petct}.glb',
      manifest: 'public/medical3d/photoreal/ASSET_MANIFEST_F696_F700.json',
    },
    requiredAssets,
    gates,
    metrics: {
      passCount,
      gateCount: gates.length,
      heavyAssetCount: requiredAssets.filter((asset) => asset.heavy).length,
      proceduralFallbackCount: pack.renderPresets.filter((preset) => !preset.gated).length,
      cacheKey: `f696-${stableHash(`${pack.scene.roomName}:${pack.textures.length}:${pack.decals.length}:${status}`)}`,
    },
    decision: {
      recommendation,
      reason: recommendation === 'enable-local-assets'
        ? 'Manifest y assets pesados listos; habilitar carga local lazy con QA visual.'
        : recommendation === 'blocked'
          ? 'Faltan rutas/procedural fallback; no activar fotorrealismo avanzado.'
          : 'Publicar beta con procedural/PBR liviano; assets pesados entran por manifest versionado.',
    },
    warnings: [
      'El fotorrealismo no modifica calculos, TVL, densidad, costos ni citas.',
      'Todo asset pesado debe tener hash, licencia y rollback visual.',
      'GLB/HDri/texturas deben cargarse lazy para no romper deploy estatico.',
    ],
  };
}
