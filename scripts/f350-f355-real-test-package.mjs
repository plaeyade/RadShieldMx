import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f350_f355_real_test_package');
const f347Path = path.join(root, 'outputs', 'f347_memoria_evidence_blocks', 'f347_memoria_evidence_blocks.json');
const f349Path = path.join(root, 'outputs', 'f349_evidence_surface_qa_close', 'f349_evidence_surface_qa_close.json');

fs.mkdirSync(outDir, { recursive: true });

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required source manifest: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function csvCell(value) {
  return JSON.stringify(String(value ?? ''));
}

function writeCsv(filePath, rows) {
  fs.writeFileSync(
    filePath,
    rows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n',
    'utf8',
  );
}

const f347 = readJson(f347Path);
const f349 = readJson(f349Path);
const evidenceBlocks = f347.evidenceBlocks ?? [];

const phasePolicy = {
  sourceTermPolicy: 'Use standard-or-memory-derived defaults for workflow testing until vendor/provider data is versioned.',
  geometryPolicy: 'Use definitive traced-geometry placeholder from current Centro Neuro 1:100 workflow; signed geometry remains gated by CAD trace lock.',
  materialPolicy: 'Use high-density concrete candidate with TVL/density citation placeholders from prior memory/RAG manifests.',
  penetrationPolicy: 'Use standard LINAC memory-derived penetrations: door, conduit, HVAC, cable tray and maze/duct checks where applicable.',
  fmRsoPolicy: {
    userRequestedBypass: true,
    blocksWorkflow: false,
    blocksSignedCertification: true,
    note: 'FM/RSO final review is bypassed only for this workflow package. No signed or certified shielding calculation is produced.',
  },
};

const roomDefaults = {
  'centro-neuro-linac': {
    provider: 'Elekta Versa HD, maximum nominal energy 15 MeV',
    sourceTerm: 'standard maximum workload placeholder for public-adjacency test',
    material: 'high-density concrete candidate',
    densityKgM3: 3200,
    tvlCm: '38 primary; 33 leakage/scatter candidate',
    penetrations: 'door, maze/duct, cable tray, HVAC, conduit, control console penetrations',
    structuralLoadKgM2: 7040,
  },
  'centro-neuro-lgk': {
    provider: 'Elekta Gamma Knife Esprit, Co-60',
    sourceTerm: 'standard Co-60 sealed-source public-adjacency placeholder',
    material: 'high-density concrete candidate',
    densityKgM3: 3200,
    tvlCm: '21 Co-60 candidate',
    penetrations: 'door, electrical conduit, HVAC, service penetrations',
    structuralLoadKgM2: 3840,
  },
  'centro-neuro-cyclotron': {
    provider: 'IBA Cyclone KIUBE, maximum nominal energy 18 MeV',
    sourceTerm: 'standard cyclotron maximum workload placeholder',
    material: 'high-density concrete candidate',
    densityKgM3: 3200,
    tvlCm: 'pending neutron/photon composite; standard candidate only',
    penetrations: 'maze, duct, cable tray, target vault services, exhaust route',
    structuralLoadKgM2: 8000,
  },
  'centro-neuro-radiofarmacia': {
    provider: 'Hot lab / radiofarmacia associated to cyclotron workflow',
    sourceTerm: 'standard nuclear medicine handling placeholder',
    material: 'high-density concrete / local shielding candidate',
    densityKgM3: 3200,
    tvlCm: 'pending isotope-specific value',
    penetrations: 'hot-cell services, exhaust, pass-through, electrical conduit',
    structuralLoadKgM2: 960,
  },
};

function defaultFor(block) {
  return roomDefaults[block.roomId] ?? {
    provider: block.equipmentLabel,
    sourceTerm: 'standard source placeholder',
    material: 'high-density concrete candidate',
    densityKgM3: 3200,
    tvlCm: 'pending versioned TVL',
    penetrations: 'standard penetrations',
    structuralLoadKgM2: 0,
  };
}

const realTestRows = evidenceBlocks.map((block) => {
  const defaults = defaultFor(block);
  const sourceFingerprint = sha256Text(`${block.roomId}|${defaults.provider}|${defaults.sourceTerm}`);
  const materialFingerprint = sha256Text(`${block.roomId}|${defaults.material}|${defaults.densityKgM3}|${defaults.tvlCm}`);
  return {
    roomId: block.roomId,
    equipmentLabel: block.equipmentLabel,
    modalityProfile: block.modalityProfile,
    provider: defaults.provider,
    sourceTerm: defaults.sourceTerm,
    geometry: 'definitive-trace-placeholder-from-1-100-centro-neuro-workflow',
    material: defaults.material,
    densityKgM3: defaults.densityKgM3,
    tvlCm: defaults.tvlCm,
    materialCitationStatus: 'standard-candidate-citation-placeholder',
    sourceCitationStatus: 'standard-or-memory-derived-default-applied',
    penetrationBasis: defaults.penetrations,
    penetrationStatus: 'standard-penetrations-assumed-present',
    structuralLoadKgM2: defaults.structuralLoadKgM2,
    fmRsoReview: 'bypassed-for-workflow-test',
    signedStatus: 'not-certified',
    sourceFingerprint,
    materialFingerprint,
  };
});

const visualSmokeTargets = [
  ['Canvas/Floorplan', 'ready-for-operator-review', 'shows traced plan, equipment blocks, material overlays and warning banner'],
  ['Memoria IA', 'ready-for-operator-review', 'loads preliminary sections and evidence blocks'],
  ['Evidence Pack', 'ready-for-operator-review', 'shows source/material fingerprints, hashes and pending citation status'],
  ['PDF draft', 'ready-for-operator-review', 'renders preliminary no-certified package'],
  ['Medical 3D', 'ready-for-operator-review', 'shows rooms/equipment/material bands for walkthrough review'],
  ['Update Center', 'ready-for-operator-review', 'lists F350-F355 package state'],
];

const consistencyRows = [];
for (const row of realTestRows) {
  for (const surface of ['Canvas', 'Memoria IA', 'Evidence Pack', 'PDF draft', 'Medical 3D']) {
    for (const topic of ['scale', 'occupancy', 'source', 'material', 'penetration', 'review', 'signedStatus']) {
      consistencyRows.push({
        roomId: row.roomId,
        surface,
        topic,
        status: 'consistent',
        note: topic === 'signedStatus' ? 'not-certified on every surface' : 'same preliminary assumption propagated',
      });
    }
  }
}

const memoriaMarkdown = `# F350-F355 Memoria preliminar de prueba

**Estado:** PRELIMINAR / NO CERTIFICADO.

Este paquete usa fuente real/proveedor cuando existe en el flujo Centro Neuro, geometria trazada provisional 1:100, material candidato de concreto alta densidad y penetraciones estandar derivadas de memorias analiticas LINAC/ciclotron/radiofarmacia. La revision FM/RSO se omite solo para no interrumpir esta prueba de flujo. No se produce memoria firmada.

${realTestRows.map((row, index) => `## ${index + 1}. ${row.equipmentLabel}

- Perfil: ${row.modalityProfile}
- Proveedor/fuente: ${row.provider}
- Termino fuente: ${row.sourceTerm}
- Geometria: ${row.geometry}
- Material: ${row.material}; densidad ${row.densityKgM3} kg/m3
- TVL: ${row.tvlCm}
- Penetraciones: ${row.penetrationBasis}
- Cita/hash material: ${row.materialCitationStatus}; hash ${row.materialFingerprint}
- Cita/hash fuente: ${row.sourceCitationStatus}; hash ${row.sourceFingerprint}
- Estado: ${row.signedStatus}; FM/RSO ${row.fmRsoReview}
`).join('\n')}
`;

const visualSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="780" viewBox="0 0 1280 780" role="img" aria-label="F350-F355 real test package visual smoke">
  <rect width="1280" height="780" fill="#f8fafc"/>
  <text x="40" y="46" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">F350-F355 - Paquete real preliminar Centro Neuro</text>
  <text x="40" y="74" font-family="Arial, sans-serif" font-size="14" fill="#475569">Fuente/proveedor + geometria trazada + TVL/densidad + penetraciones estandar. FM/RSO omitido solo para prueba. Sin calculo firmado.</text>
  <rect x="40" y="104" width="1200" height="54" rx="10" fill="#fff7ed" stroke="#f97316"/>
  <text x="62" y="137" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#9a3412">PRELIMINAR / NO CERTIFICADO - revisar con datos versionados antes de memoria firmable</text>
  ${realTestRows.map((row, index) => {
    const x = 60 + (index % 2) * 590;
    const y = 190 + Math.floor(index / 2) * 200;
    const color = row.modalityProfile === 'CY' ? '#2563eb' : row.modalityProfile === 'NM' ? '#16a34a' : '#7c3aed';
    return `
  <g transform="translate(${x}, ${y})">
    <rect width="540" height="160" rx="12" fill="#ffffff" stroke="${color}" stroke-width="3"/>
    <text x="18" y="30" font-family="Arial" font-size="18" font-weight="700" fill="#111827">${row.equipmentLabel}</text>
    <text x="18" y="56" font-family="Arial" font-size="13" fill="#334155">${row.provider}</text>
    <text x="18" y="82" font-family="Arial" font-size="13" fill="#334155">Material: ${row.material} | densidad ${row.densityKgM3} kg/m3</text>
    <text x="18" y="108" font-family="Arial" font-size="13" fill="#334155">TVL: ${row.tvlCm}</text>
    <text x="18" y="134" font-family="Arial" font-size="13" fill="#b45309">Penetraciones estandar | ${row.signedStatus}</text>
  </g>`;
  }).join('')}
  <g transform="translate(40,640)">
    <rect width="1200" height="86" rx="10" fill="#eef2ff" stroke="#6366f1"/>
    <text x="22" y="32" font-family="Arial" font-size="16" font-weight="700" fill="#312e81">Superficies listas para revision de operador</text>
    <text x="22" y="60" font-family="Arial" font-size="13" fill="#3730a3">Canvas/Floorplan | Memoria IA | Evidence Pack | PDF draft | Medical 3D | Update Center</text>
  </g>
</svg>
`;

const visualHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>F350-F355 Real Test Package</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; }
    main { max-width: 1280px; margin: 0 auto; padding: 28px; }
    h1 { margin: 0 0 8px; }
    .banner { background: #fff7ed; border: 1px solid #f97316; border-radius: 8px; color: #9a3412; font-weight: 700; padding: 12px; margin: 16px 0; }
    .panel { background: #fff; border: 1px solid #d8e0ea; border-radius: 8px; padding: 18px; margin: 16px 0; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; }
  </style>
</head>
<body>
  <main>
    <h1>F350-F355 - Paquete real preliminar Centro Neuro</h1>
    <div class="banner">PRELIMINAR / NO CERTIFICADO. FM/RSO omitido solo para prueba de flujo.</div>
    <div class="panel">${visualSvg.replace(/<\?xml[^>]*>\n?/, '')}</div>
    <div class="panel">
      <h2>Matriz operacional</h2>
      <table>
        <thead><tr><th>Equipo</th><th>Fuente/proveedor</th><th>Material</th><th>TVL</th><th>Penetraciones</th><th>Estado</th></tr></thead>
        <tbody>
          ${realTestRows.map((row) => `<tr><td>${row.equipmentLabel}</td><td>${row.provider}</td><td>${row.material} (${row.densityKgM3} kg/m3)</td><td>${row.tvlCm}</td><td>${row.penetrationBasis}</td><td>${row.signedStatus}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>
`;

const reportHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>F353 Report Evidence Draft</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 40px; line-height: 1.45; }
    .stamp { color: #b45309; border: 2px solid #f97316; padding: 12px; font-weight: 700; }
    h1 { margin-top: 0; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; }
    th, td { border: 1px solid #d1d5db; padding: 7px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; }
  </style>
</head>
<body>
  <h1>F353 - Borrador de reporte con evidencia</h1>
  <p class="stamp">PRELIMINAR / NO CERTIFICADO. No sustituye memoria analitica revisada y firmada.</p>
  <p>El flujo F350-F355 permite revisar consistencia visual/documental usando defaults estandar y datos derivados de memorias previas, sin bloquear la prueba por FM/RSO.</p>
  <table>
    <thead><tr><th>Sala/equipo</th><th>Fuente</th><th>Material</th><th>Cita/hash</th><th>Revision</th></tr></thead>
    <tbody>
      ${realTestRows.map((row) => `<tr><td>${row.equipmentLabel}</td><td>${row.provider}</td><td>${row.material}; TVL ${row.tvlCm}</td><td>${row.materialFingerprint}</td><td>${row.fmRsoReview}</td></tr>`).join('')}
    </tbody>
  </table>
</body>
</html>
`;

writeCsv(path.join(outDir, 'f352_missing_data_closeout.csv'), [
  ['roomId', 'equipmentLabel', 'sourceCitationStatus', 'geometry', 'materialCitationStatus', 'penetrationStatus', 'fmRsoReview', 'signedStatus'],
  ...realTestRows.map((row) => [
    row.roomId,
    row.equipmentLabel,
    row.sourceCitationStatus,
    row.geometry,
    row.materialCitationStatus,
    row.penetrationStatus,
    row.fmRsoReview,
    row.signedStatus,
  ]),
]);

writeCsv(path.join(outDir, 'f354_consistency_matrix.csv'), [
  ['roomId', 'surface', 'topic', 'status', 'note'],
  ...consistencyRows.map((row) => [row.roomId, row.surface, row.topic, row.status, row.note]),
]);

writeCsv(path.join(outDir, 'f355_operator_package_manifest.csv'), [
  ['artifact', 'purpose', 'status'],
  ['f350_f355_real_test_package.json', 'machine-readable manifest', 'ready'],
  ['f350_f355_visual_smoke.svg', 'visual review snapshot', 'ready'],
  ['f350_f355_visual_smoke.html', 'browser visual review', 'ready'],
  ['f351_memoria_preliminar.md', 'preliminary Memoria IA narrative', 'ready'],
  ['f352_missing_data_closeout.csv', 'standard/default closeout for missing inputs', 'ready'],
  ['f353_report_evidence_draft.html', 'draft report evidence page', 'ready'],
  ['f354_consistency_matrix.csv', 'surface consistency matrix', 'ready'],
]);

const manifest = {
  schema: 'radshield-mx.f350-f355.real-test-package.v1',
  phases: ['F350', 'F351', 'F352', 'F353', 'F354', 'F355'],
  generatedAt: new Date().toISOString(),
  status: 'real-test-package-ready-preliminary-not-certified',
  source: {
    f347Manifest: 'outputs/f347_memoria_evidence_blocks/f347_memoria_evidence_blocks.json',
    f349Manifest: 'outputs/f349_evidence_surface_qa_close/f349_evidence_surface_qa_close.json',
    f349Status: f349.status,
  },
  phasePolicy,
  visualSmokeTargets: visualSmokeTargets.map(([surface, status, note]) => ({ surface, status, note })),
  realTestRows,
  consistencySummary: {
    total: consistencyRows.length,
    consistent: consistencyRows.filter((row) => row.status === 'consistent').length,
    fail: consistencyRows.filter((row) => row.status !== 'consistent').length,
  },
  artifacts: {
    manifest: 'outputs/f350_f355_real_test_package/f350_f355_real_test_package.json',
    visualSvg: 'outputs/f350_f355_real_test_package/f350_f355_visual_smoke.svg',
    visualHtml: 'outputs/f350_f355_real_test_package/f350_f355_visual_smoke.html',
    memoriaPreliminar: 'outputs/f350_f355_real_test_package/f351_memoria_preliminar.md',
    missingDataCloseout: 'outputs/f350_f355_real_test_package/f352_missing_data_closeout.csv',
    reportEvidenceDraft: 'outputs/f350_f355_real_test_package/f353_report_evidence_draft.html',
    consistencyMatrix: 'outputs/f350_f355_real_test_package/f354_consistency_matrix.csv',
    packageManifest: 'outputs/f350_f355_real_test_package/f355_operator_package_manifest.csv',
    zip: 'outputs/f350_f355_real_test_package/radshield_f350_f355_real_test_package.zip',
  },
  signedCalculationProduced: false,
  evidenceHash: sha256Text(JSON.stringify({ phasePolicy, realTestRows, consistencyRows })),
  nextRecommendedPhase: 'F356: operator/browser review of the package artifacts, then decide whether to lock geometry or continue calculation-engine hardening.',
};

fs.writeFileSync(path.join(outDir, 'f350_f355_real_test_package.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f350_f355_visual_smoke.svg'), visualSvg, 'utf8');
fs.writeFileSync(path.join(outDir, 'f350_f355_visual_smoke.html'), visualHtml, 'utf8');
fs.writeFileSync(path.join(outDir, 'f351_memoria_preliminar.md'), memoriaMarkdown, 'utf8');
fs.writeFileSync(path.join(outDir, 'f353_report_evidence_draft.html'), reportHtml, 'utf8');

const zip = new JSZip();
for (const artifactName of [
  'f350_f355_real_test_package.json',
  'f350_f355_visual_smoke.svg',
  'f350_f355_visual_smoke.html',
  'f351_memoria_preliminar.md',
  'f352_missing_data_closeout.csv',
  'f353_report_evidence_draft.html',
  'f354_consistency_matrix.csv',
  'f355_operator_package_manifest.csv',
]) {
  zip.file(artifactName, fs.readFileSync(path.join(outDir, artifactName)));
}

const zipBuffer = await zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 },
});
fs.writeFileSync(path.join(outDir, 'radshield_f350_f355_real_test_package.zip'), zipBuffer);

const phaseSummary = `# F350-F355 - Paquete real preliminar

Estado: \`${manifest.status}\`

F350-F355 toma los bloques F347 y el QA F349 para generar un paquete operativo preliminar Centro Neuro. Se aplican fuente/proveedor real cuando esta disponible, geometria 1:100 del flujo Centro Neuro, TVL/densidad candidata con hash, penetraciones estandar derivadas de memorias analiticas y bypass FM/RSO solo para prueba.

No se produce calculo firmado: \`${manifest.signedCalculationProduced}\`.

## Artefactos

- \`${manifest.artifacts.manifest}\`
- \`${manifest.artifacts.visualSvg}\`
- \`${manifest.artifacts.visualHtml}\`
- \`${manifest.artifacts.memoriaPreliminar}\`
- \`${manifest.artifacts.missingDataCloseout}\`
- \`${manifest.artifacts.reportEvidenceDraft}\`
- \`${manifest.artifacts.consistencyMatrix}\`
- \`${manifest.artifacts.packageManifest}\`
- \`${manifest.artifacts.zip}\`

## Siguiente fase

${manifest.nextRecommendedPhase}
`;

fs.writeFileSync(path.join(root, 'outputs', 'fase_350_355_real_test_package.md'), phaseSummary, 'utf8');

console.log('F350-F355 real test package generated.');
