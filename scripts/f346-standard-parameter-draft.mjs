import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f346_standard_parameter_draft');
const f345Path = path.join(root, 'outputs', 'f345_centro_neuro_draft_calculation_packet', 'f345_centro_neuro_draft_calculation_packet.json');

fs.mkdirSync(outDir, { recursive: true });

function readJson(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : null;
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function csvCell(value) {
  return JSON.stringify(String(value ?? ''));
}

const f345 = readJson(f345Path);
const barrierRows = f345?.barrierCalculationRows ?? [];

const standardGeometryProfiles = {
  'centro-neuro-linac': {
    roomClass: 'linac-bunker-standard-draft',
    roomLengthM: 8.5,
    roomWidthM: 7.5,
    roomHeightM: 3.8,
    sourceToWallM: 4.5,
    sourceToMazeM: 6.5,
    defaultWallThicknessCm: 220,
    notes: 'Draft LINAC geometry for workflow testing only; replace with traced CAD dimensions.',
  },
  'centro-neuro-lgk': {
    roomClass: 'gamma-knife-room-standard-draft',
    roomLengthM: 6.5,
    roomWidthM: 6,
    roomHeightM: 3.4,
    sourceToWallM: 3,
    sourceToMazeM: 4.5,
    defaultWallThicknessCm: 120,
    notes: 'Draft LGK geometry; replace with Elekta site planning and traced dimensions.',
  },
  'centro-neuro-cyclotron': {
    roomClass: 'cyclotron-vault-standard-draft',
    roomLengthM: 9,
    roomWidthM: 8,
    roomHeightM: 4.5,
    sourceToWallM: 4,
    sourceToMazeM: 7,
    defaultWallThicknessCm: 250,
    notes: 'Draft 18 MeV cyclotron vault; replace with vendor source-term and CAD dimensions.',
  },
  'centro-neuro-radiofarmacia': {
    roomClass: 'hotlab-standard-draft',
    roomLengthM: 5,
    roomWidthM: 4,
    roomHeightM: 3,
    sourceToWallM: 2,
    sourceToMazeM: 3,
    defaultWallThicknessCm: 30,
    notes: 'Draft NM/hot lab workflow; replace with source inventory and hot-cell shielding details.',
  },
};

const standardSourceTerms = {
  'centro-neuro-linac': {
    sourceTermId: 'std-versa-hd-15mev-max-workload-draft',
    equipment: 'Elekta Versa HD',
    modalityProfile: 'TX',
    nominalEnergyMeV: 15,
    workloadGyPerWeekDraft: 1000,
    useFactorPrimaryDraft: 0.25,
    leakageFractionDraft: 0.001,
    neutronReviewRequired: true,
    sourceCitationStatus: 'candidate-standard-placeholder',
    requiredCitationIds: ['NCRP-151-canonical', 'Elekta-VersaHD-site-planning-required'],
  },
  'centro-neuro-lgk': {
    sourceTermId: 'std-gamma-knife-esprit-cobalt60-draft',
    equipment: 'Elekta Gamma Knife Esprit',
    modalityProfile: 'TX',
    radionuclide: 'Co-60',
    activityStatus: 'manufacturer-current-source-inventory-required',
    patientsPerWeekDraft: 40,
    decayDateRequired: true,
    sourceCitationStatus: 'candidate-standard-placeholder',
    requiredCitationIds: ['Elekta-GammaKnife-Esprit-site-planning-required', 'Co60-decay-data-canonical'],
  },
  'centro-neuro-cyclotron': {
    sourceTermId: 'std-cyclone-kiube-18mev-max-production-draft',
    equipment: 'IBA Cyclone KIUBE',
    modalityProfile: 'CY',
    protonEnergyMeV: 18,
    beamCurrentUaDraft: 150,
    productionHoursPerWeekDraft: 40,
    neutronReviewRequired: true,
    activationReviewRequired: true,
    exhaustReviewRequired: true,
    sourceCitationStatus: 'candidate-standard-placeholder',
    requiredCitationIds: ['IBA-KIUBE-source-term-required', 'IAEA-particle-accelerator-shielding-canonical'],
  },
  'centro-neuro-radiofarmacia': {
    sourceTermId: 'std-hotlab-nm-public-adjacency-draft',
    equipment: 'Radiofarmacia / hot lab',
    modalityProfile: 'NM',
    inventoryStatus: 'radionuclide-inventory-required',
    designScenario: 'maximum daily production and waste/storage inventory',
    sourceCitationStatus: 'candidate-standard-placeholder',
    requiredCitationIds: ['IAEA-nuclear-medicine-design-canonical', 'facility-inventory-required'],
  },
};

const materialCandidate = {
  materialId: 'high-density-concrete-standard-draft',
  label: 'Concreto alta densidad',
  densityKgM3Draft: 3200,
  densityStatus: 'candidate-standard-placeholder',
  tvlStatus: 'candidate-values-require-citation-before-use',
  tvlCandidateByUse: [
    { use: 'Co-60 gamma', tvlCmDraft: 21, citationStatus: 'requires-page-hash' },
    { use: '15 MeV LINAC primary photon', tvlCmDraft: 38, citationStatus: 'requires-page-hash' },
    { use: '15 MeV LINAC leakage/scatter', tvlCmDraft: 33, citationStatus: 'requires-page-hash' },
    { use: '18 MeV cyclotron neutron/gamma', tvlCmDraft: null, citationStatus: 'requires-vendor-or-validated-neutron-data' },
  ],
  structuralLoadFormula: 'kg_per_m2 = density_kg_m3 * thickness_m',
  warning: 'Candidate TVL values are placeholders for workflow testing. They must be replaced by versioned, cited data before any signed calculation.',
};

const standardPenetrations = [
  { penetrationId: 'std-hvac-offset', type: 'HVAC duct offset', defaultStatus: 'assume-present-until-cleared', shieldingAction: 'tag route and equivalent shield lining' },
  { penetrationId: 'std-electrical-conduit', type: 'Electrical conduit bank', defaultStatus: 'assume-present-until-cleared', shieldingAction: 'tag sleeve and equivalent shielding' },
  { penetrationId: 'std-door-maze', type: 'Door/maze path', defaultStatus: 'assume-present-until-cleared', shieldingAction: 'door schedule, overlap and neutron/lead/poly stack if required' },
  { penetrationId: 'std-floor-ceiling-sleeve', type: 'Floor/ceiling sleeve', defaultStatus: 'assume-present-until-cleared', shieldingAction: 'tag vertical route and occupancy above/below' },
  { penetrationId: 'std-cyclotron-exhaust', type: 'Cyclotron target/exhaust route', defaultStatus: 'required-for-cyclotron-review', shieldingAction: 'delay/filtration route and activation assumptions' },
];

function sourceTermForRoom(roomId) {
  return standardSourceTerms[roomId] ?? standardSourceTerms['centro-neuro-radiofarmacia'];
}

function geometryForRoom(roomId) {
  return standardGeometryProfiles[roomId] ?? standardGeometryProfiles['centro-neuro-radiofarmacia'];
}

function tvlUseForRow(row) {
  if (row.roomId === 'centro-neuro-lgk') return 'Co-60 gamma';
  if (row.roomId === 'centro-neuro-linac' && (row.side === 'north' || row.side === 'east')) return '15 MeV LINAC primary photon';
  if (row.roomId === 'centro-neuro-linac') return '15 MeV LINAC leakage/scatter';
  if (row.roomId === 'centro-neuro-cyclotron') return '18 MeV cyclotron neutron/gamma';
  return 'NM hot lab inventory-specific';
}

const parameterizedRows = barrierRows.map((row) => {
  const geometry = geometryForRoom(row.roomId);
  const source = sourceTermForRoom(row.roomId);
  const tvlUse = tvlUseForRow(row);
  const tvlCandidate = materialCandidate.tvlCandidateByUse.find((item) => item.use === tvlUse) ?? null;
  const thicknessM = geometry.defaultWallThicknessCm / 100;
  const structuralLoadKgM2 = Number((materialCandidate.densityKgM3Draft * thicknessM).toFixed(1));
  const sourceDistanceM = row.side === 'floor' || row.side === 'ceiling'
    ? Number((geometry.roomHeightM / 2).toFixed(2))
    : row.side === 'south' || row.side === 'west'
      ? geometry.sourceToMazeM
      : geometry.sourceToWallM;
  const warnings = [
    ...row.warnings,
    'standard geometry used; replace with traced CAD values',
    'standard source term used; replace with vendor/program data',
    'candidate TVL/density used; replace with cited values',
    'penetrations assumed present until cleared',
    'FM/RSO final review still required',
  ];
  if (sourceDistanceM < 0.3) warnings.push('distance below 0.3 m blocked');
  if (tvlCandidate?.tvlCmDraft == null) warnings.push('no standard TVL candidate for this use');

  return {
    ...row,
    geometryProfileId: geometry.roomClass,
    standardRoomLengthM: geometry.roomLengthM,
    standardRoomWidthM: geometry.roomWidthM,
    standardRoomHeightM: geometry.roomHeightM,
    sourceDistanceM,
    standardThicknessCm: geometry.defaultWallThicknessCm,
    materialId: materialCandidate.materialId,
    densityKgM3Draft: materialCandidate.densityKgM3Draft,
    structuralLoadKgM2,
    tvlUse,
    tvlCmDraft: tvlCandidate?.tvlCmDraft ?? null,
    tvlCitationStatus: tvlCandidate?.citationStatus ?? 'requires-inventory-specific-citation',
    sourceTermId: source.sourceTermId,
    sourceCitationStatus: source.sourceCitationStatus,
    standardParameterStatus: 'standard-parameters-applied-for-draft',
    outputStatus: 'standard-draft-ready-final-review-blocked',
    signedCalculationProduced: false,
    warnings,
  };
});

const gates = [
  { gateId: 'geometry-standardized', status: 'pass-for-draft', evidence: 'standard room geometry profiles applied' },
  { gateId: 'source-term-standardized', status: 'pass-for-draft', evidence: 'standard maximum workload/source placeholders applied' },
  { gateId: 'material-tvl-density-standardized', status: 'pass-for-draft-only', evidence: 'candidate concrete density/TVL placeholders applied' },
  { gateId: 'penetrations-standardized', status: 'pass-for-draft-only', evidence: 'standard penetrations assumed present until cleared' },
  { gateId: 'citation-versioning', status: 'pending-before-signed-calc', evidence: 'page/hash/source citations required' },
  { gateId: 'fm-rso-final-review', status: 'final-release-gate', evidence: 'required before signed analytical memory' },
];

const visualSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="680" viewBox="0 0 1080 680" role="img" aria-label="F346 standard parameter draft visual">
  <rect width="1080" height="680" fill="#f8fafc"/>
  <text x="42" y="44" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="#0f172a">F346 - parametros estandar aplicados</text>
  <text x="42" y="70" font-family="Arial, sans-serif" font-size="13" fill="#475569">Geometria, fuentes, material, penetraciones y revision final quedan parametrizados para draft. No hay calculo firmable.</text>
  <g transform="translate(42,105)">
    <rect width="285" height="175" rx="10" fill="#fee2e2" stroke="#dc2626" stroke-width="3"/>
    <text x="18" y="32" font-family="Arial" font-size="18" font-weight="700" fill="#111827">Versa HD 15 MeV</text>
    <text x="18" y="58" font-family="Arial" font-size="13" fill="#334155">W draft 1000 Gy/week</text>
    <text x="18" y="82" font-family="Arial" font-size="13" fill="#334155">Room 8.5 x 7.5 x 3.8 m</text>
    <text x="18" y="106" font-family="Arial" font-size="13" fill="#334155">Concrete HD 3200 kg/m3</text>
    <text x="18" y="140" font-family="Arial" font-size="13" fill="#b45309">Neutron gate active</text>
  </g>
  <g transform="translate(365,105)">
    <rect width="285" height="175" rx="10" fill="#ede9fe" stroke="#7c3aed" stroke-width="3"/>
    <text x="18" y="32" font-family="Arial" font-size="18" font-weight="700" fill="#111827">Gamma Knife Esprit</text>
    <text x="18" y="58" font-family="Arial" font-size="13" fill="#334155">Co-60 inventory required</text>
    <text x="18" y="82" font-family="Arial" font-size="13" fill="#334155">Room 6.5 x 6.0 x 3.4 m</text>
    <text x="18" y="106" font-family="Arial" font-size="13" fill="#334155">T=1 public adjacency</text>
    <text x="18" y="140" font-family="Arial" font-size="13" fill="#b45309">Decay date gate active</text>
  </g>
  <g transform="translate(688,105)">
    <rect width="285" height="175" rx="10" fill="#dbeafe" stroke="#2563eb" stroke-width="3"/>
    <text x="18" y="32" font-family="Arial" font-size="18" font-weight="700" fill="#111827">Cyclone KIUBE 18 MeV</text>
    <text x="18" y="58" font-family="Arial" font-size="13" fill="#334155">150 uA, 40 h/week draft</text>
    <text x="18" y="82" font-family="Arial" font-size="13" fill="#334155">Room 9.0 x 8.0 x 4.5 m</text>
    <text x="18" y="106" font-family="Arial" font-size="13" fill="#334155">Exhaust/activation required</text>
    <text x="18" y="140" font-family="Arial" font-size="13" fill="#b45309">Neutron TVL pending</text>
  </g>
  <g transform="translate(42,335)">
    <rect width="610" height="218" rx="10" fill="#ffffff" stroke="#cbd5e1"/>
    <text x="18" y="34" font-family="Arial" font-size="18" font-weight="700" fill="#0f172a">Draft output matrix</text>
    <text x="18" y="66" font-family="Arial" font-size="14" fill="#475569">Rows: ${parameterizedRows.length} barriers</text>
    <text x="18" y="94" font-family="Arial" font-size="14" fill="#475569">Structural loads: concrete density x draft thickness</text>
    <text x="18" y="122" font-family="Arial" font-size="14" fill="#475569">Penetrations: HVAC, conduits, maze/door, floor/ceiling, cyclotron exhaust</text>
    <text x="18" y="150" font-family="Arial" font-size="14" fill="#475569">Citations: page/hash still required before signed use</text>
    <text x="18" y="188" font-family="Arial" font-size="14" font-weight="700" fill="#dc2626">Signed thicknesses: 0</text>
  </g>
  <g transform="translate(688,335)">
    <rect width="285" height="218" rx="10" fill="#ffffff" stroke="#cbd5e1"/>
    <text x="18" y="34" font-family="Arial" font-size="18" font-weight="700" fill="#0f172a">Gate status</text>
    <text x="18" y="68" font-family="Arial" font-size="13" fill="#16a34a">PASS draft: geometry</text>
    <text x="18" y="94" font-family="Arial" font-size="13" fill="#16a34a">PASS draft: source terms</text>
    <text x="18" y="120" font-family="Arial" font-size="13" fill="#f97316">DRAFT only: material TVL</text>
    <text x="18" y="146" font-family="Arial" font-size="13" fill="#f97316">DRAFT only: penetrations</text>
    <text x="18" y="172" font-family="Arial" font-size="13" fill="#dc2626">FINAL: citations + FM/RSO</text>
  </g>
  <text x="42" y="626" font-family="Arial" font-size="12" fill="#64748b">F346 standard parameters are workflow defaults. They require replacement or citation before final analytical memory.</text>
</svg>
`;

const visualHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>F346 Parametros Estandar Draft</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; }
    main { max-width: 1180px; margin: 0 auto; padding: 28px; }
    h1 { margin: 0 0 6px; font-size: 28px; }
    .sub { color: #475569; margin-bottom: 20px; }
    .panel { background: #fff; border: 1px solid #d8e0ea; border-radius: 8px; padding: 18px; margin: 18px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; }
    .blocked { color: #b45309; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <h1>F346 - parametros estandar aplicados</h1>
    <div class="sub">Draft visual con geometria, fuente, material, TVL/densidad candidata, penetraciones y revision final.</div>
    <div class="panel">${visualSvg.replace(/<\?xml[^>]*>\n?/, '')}</div>
    <div class="panel">
      <h2>Muestra de barreras parametrizadas</h2>
      <table>
        <thead><tr><th>Barrera</th><th>Fuente</th><th>Distancia</th><th>TVL draft</th><th>Carga kg/m2</th><th>Estado</th></tr></thead>
        <tbody>
          ${parameterizedRows.slice(0, 12).map((row) => `<tr><td>${row.barrierId}</td><td>${row.sourceTermId}</td><td>${row.sourceDistanceM} m</td><td>${row.tvlCmDraft ?? 'pendiente'}</td><td>${row.structuralLoadKgM2}</td><td class="blocked">${row.outputStatus}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>
`;

const manifest = {
  schema: 'radshield-mx.f346.standard-parameter-draft.v1',
  phase: 'F346',
  generatedAt: new Date().toISOString(),
  status: 'standard-parameters-applied-draft-only',
  source: {
    f345Manifest: 'outputs/f345_centro_neuro_draft_calculation_packet/f345_centro_neuro_draft_calculation_packet.json',
    sourcePdfSha256: f345?.source?.sourcePdfSha256 ?? null,
  },
  standardGeometryProfiles,
  standardSourceTerms,
  materialCandidate,
  standardPenetrations,
  gates,
  parameterizedRows,
  visualArtifacts: {
    svg: 'outputs/f346_standard_parameter_draft/f346_standard_parameter_visual.svg',
    html: 'outputs/f346_standard_parameter_draft/f346_standard_parameter_visual.html',
  },
  signedCalculationProduced: false,
  parameterHash: sha256Text(JSON.stringify({ standardGeometryProfiles, standardSourceTerms, materialCandidate, standardPenetrations, parameterizedRows })),
  nextRecommendedPhase: 'F347: connect standard-parameter draft to Memoria IA evidence blocks and prepare preliminary, non-signed calculation narratives.',
};

fs.writeFileSync(path.join(outDir, 'f346_standard_parameter_draft.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f346_standard_parameter_visual.svg'), visualSvg, 'utf8');
fs.writeFileSync(path.join(outDir, 'f346_standard_parameter_visual.html'), visualHtml, 'utf8');
fs.writeFileSync(
  path.join(outDir, 'f346_parameterized_barrier_matrix.csv'),
  [
    ['barrierId', 'roomId', 'sourceTermId', 'sourceDistanceM', 'standardThicknessCm', 'densityKgM3Draft', 'structuralLoadKgM2', 'tvlUse', 'tvlCmDraft', 'tvlCitationStatus', 'outputStatus'].map(csvCell).join(','),
    ...parameterizedRows.map((row) => [
      row.barrierId,
      row.roomId,
      row.sourceTermId,
      row.sourceDistanceM,
      row.standardThicknessCm,
      row.densityKgM3Draft,
      row.structuralLoadKgM2,
      row.tvlUse,
      row.tvlCmDraft ?? 'pending',
      row.tvlCitationStatus,
      row.outputStatus,
    ].map(csvCell).join(',')),
  ].join('\n') + '\n',
  'utf8',
);
fs.writeFileSync(
  path.join(outDir, 'f346_gate_status.csv'),
  [
    ['gateId', 'status', 'evidence'].map(csvCell).join(','),
    ...gates.map((gate) => [gate.gateId, gate.status, gate.evidence].map(csvCell).join(',')),
  ].join('\n') + '\n',
  'utf8',
);

const md = [
  '# F346 Standard Parameter Draft',
  '',
  `Status: ${manifest.status}`,
  `Parameterized barriers: ${parameterizedRows.length}`,
  `Signed calculation produced: ${manifest.signedCalculationProduced}`,
  '',
  '## Standard Parameters Applied',
  '- Geometry: standard draft room dimensions and source distances by modality.',
  '- Source term: maximum-workload placeholders for Versa HD, Gamma Knife Esprit, KIUBE and hot lab context.',
  '- Material: high-density concrete candidate density and TVL placeholders.',
  '- Penetrations: standard openings assumed present until cleared.',
  '- Review: FM/RSO remains final signed-release gate.',
  '',
  '## Visual',
  '- `outputs/f346_standard_parameter_draft/f346_standard_parameter_visual.svg`',
  '- `outputs/f346_standard_parameter_draft/f346_standard_parameter_visual.html`',
  '',
  '## Gates',
  ...gates.map((gate) => `- ${gate.gateId}: ${gate.status} (${gate.evidence}).`),
  '',
  '## Next',
  manifest.nextRecommendedPhase,
  '',
].join('\n');

fs.writeFileSync(path.join(root, 'outputs', 'fase_346_standard_parameter_draft.md'), md, 'utf8');

console.log(`F346 ${manifest.status}: ${parameterizedRows.length} rows, ${gates.length} gates, visual HTML/SVG ready.`);
