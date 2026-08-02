export interface F501F504HeavyAssetsDbPrep {
  schema: 'radshield-mx.release.f501-f504.heavy-assets-db-prep.v1';
  phaseRange: 'F501-F504';
  status: 'prepared-gated';
  phases: Array<{
    phase: 'F501' | 'F502' | 'F503' | 'F504';
    title: string;
    exitCriteria: string;
  }>;
  database: {
    schemaDraft: 'db/f501_f504_regulatory_materials_schema.sql';
    requiredTables: string[];
    seedPolicy: 'schema-first-live-seed-later';
    blockedUntil: string[];
  };
  heavyAssets: {
    photorealRoot: 'public/medical3d/photoreal';
    unityRoot: 'public/unity/radshield-medical-3d';
    expectedPhotorealAssets: string[];
    expectedUnityBuildFiles: string[];
  };
  unityMissing: string[];
  releaseBoundary: string;
}

export function buildF501F504HeavyAssetsDbPrep(): F501F504HeavyAssetsDbPrep {
  return {
    schema: 'radshield-mx.release.f501-f504.heavy-assets-db-prep.v1',
    phaseRange: 'F501-F504',
    status: 'prepared-gated',
    phases: [
      {
        phase: 'F501',
        title: 'Schema DB regulatoria/materiales',
        exitCriteria: 'SQL revisable existe; F500 confirma tablas faltantes antes de aplicar migracion.',
      },
      {
        phase: 'F502',
        title: 'Asset intake fotorrealismo pesado',
        exitCriteria: 'Carpetas HDRI/textures/decals y manifiesto indican que assets reales pueden copiarse sin tocar calculo.',
      },
      {
        phase: 'F503',
        title: 'Unity WebGL real gate',
        exitCriteria: 'Auditoria detecta index.html, Build/*.loader.js, framework/data/wasm y TemplateData.',
      },
      {
        phase: 'F504',
        title: 'Release readback heavy assets',
        exitCriteria: 'Build pasa; F500 se repite despues de migracion/assets y mantiene rollback.',
      },
    ],
    database: {
      schemaDraft: 'db/f501_f504_regulatory_materials_schema.sql',
      requiredTables: ['regulatory_sources', 'material_constants', 'material_value_versions', 'material_source_links', 'document_chunks'],
      seedPolicy: 'schema-first-live-seed-later',
      blockedUntil: [
        'Apply reviewed F501 schema to target MySQL.',
        'Rerun F500_DB_READBACK=1 and confirm required tables exist.',
        'Resolve page/hash and review-required values before F501 live seed.',
      ],
    },
    heavyAssets: {
      photorealRoot: 'public/medical3d/photoreal',
      unityRoot: 'public/unity/radshield-medical-3d',
      expectedPhotorealAssets: [
        'hdri/clinical_softbox.hdr',
        'textures/hd-concrete/albedo.webp',
        'textures/hd-concrete/normal.webp',
        'textures/hd-concrete/roughness.webp',
        'textures/hd-concrete/ao.webp',
        'textures/lead-sheet/albedo.webp',
        'decals/radiation-warning.webp',
        'decals/penetration-tag.webp',
      ],
      expectedUnityBuildFiles: [
        'index.html',
        'Build/*.loader.js',
        'Build/*.framework.js or .framework.js.gz/.br',
        'Build/*.data or .data.gz/.br',
        'Build/*.wasm or .wasm.gz/.br',
        'TemplateData/*',
      ],
    },
    unityMissing: [
      'Unity WebGL exported index.html',
      'Build loader/framework/data/wasm files',
      'TemplateData assets',
      'VITE_MEDICAL_3D_UNITY_LOCAL_BUILD=true or VITE_MEDICAL_3D_UNITY_WEBGL_URL',
      'Browser smoke proving load, scene bridge and snapshot.',
    ],
    releaseBoundary:
      'F501-F504 prepares DB schema and heavy visual asset intake. It does not claim clinical certification, does not seed live rows, and does not make Unity real until exported build files are present.',
  };
}

export function formatF501F504HeavyAssetsDbPrepMarkdown(contract = buildF501F504HeavyAssetsDbPrep()): string {
  return [
    '# F501-F504 DB/ASSETS PESADOS',
    '',
    `Estado: ${contract.status}`,
    '',
    '## Fases',
    ...contract.phases.map((phase) => `- ${phase.phase}: ${phase.title} - ${phase.exitCriteria}`),
    '',
    '## DB',
    `Schema draft: ${contract.database.schemaDraft}`,
    `Politica seed: ${contract.database.seedPolicy}`,
    ...contract.database.blockedUntil.map((item) => `- ${item}`),
    '',
    '## Assets pesados esperados',
    ...contract.heavyAssets.expectedPhotorealAssets.map((item) => `- ${contract.heavyAssets.photorealRoot}/${item}`),
    '',
    '## Unity faltante',
    ...contract.unityMissing.map((item) => `- ${item}`),
    '',
    contract.releaseBoundary,
  ].join('\n');
}
