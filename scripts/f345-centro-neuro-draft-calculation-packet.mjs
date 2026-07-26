import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f345_centro_neuro_draft_calculation_packet');
const f344Path = path.join(root, 'outputs', 'f344_centro_neuro_public_occupancy_markup', 'f344_centro_neuro_public_occupancy_markup.json');
const f343Path = path.join(root, 'outputs', 'f343_centro_neuro_preflight', 'f343_centro_neuro_preflight.json');

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

const f344 = readJson(f344Path);
const f343 = readJson(f343Path);

const equipmentByRoom = new Map((f343?.equipmentPreflight ?? []).map((item) => [item.roomId, item]));
const rooms = f344?.rooms ?? [];
const barrierDrafts = f344?.barrierDrafts ?? [];

const roomMethodMap = {
  'centro-neuro-linac': {
    methodId: 'ncrp151-linac-primary-secondary-neutron-preflight',
    standard: 'NCRP 151 + neutron review for >10 MV',
    sourceTermRequired: 'approved Gy/week workload, use factors, leakage/scatter, isocenter and maze/door geometry',
    conservativeCheck: 'primary/secondary dominant check plus neutron flag',
  },
  'centro-neuro-lgk': {
    methodId: 'cobalt60-gamma-knife-decay-preflight',
    standard: 'Co-60 decay/source inventory plus site planning evidence',
    sourceTermRequired: 'number of Co-60 sources, activity/reference date, decay date and patients/week',
    conservativeCheck: 'Co-60 TVL check with public occupancy',
  },
  'centro-neuro-cyclotron': {
    methodId: 'cyclotron18mev-neutron-gamma-activation-preflight',
    standard: 'IAEA/NCRP particle accelerator shielding + vendor source term',
    sourceTermRequired: 'beam current, duty cycle, targets/isotopes, self-shielding and exhaust/duct route',
    conservativeCheck: 'neutron/prompt gamma critical path and penetration check',
  },
  'centro-neuro-radiofarmacia': {
    methodId: 'nuclear-medicine-hotlab-public-adjacency-preflight',
    standard: 'IAEA/NCRP nuclear medicine controlled-area workflow',
    sourceTermRequired: 'radionuclide inventory, activity schedule, hot-cell shielding and waste/storage assumptions',
    conservativeCheck: 'point-source/public-adjacency sanity check',
  },
};

function classifyBarrier(barrier) {
  const method = roomMethodMap[barrier.roomId] ?? roomMethodMap['centro-neuro-radiofarmacia'];
  const isVertical = barrier.side === 'floor' || barrier.side === 'ceiling';
  const isDoorMazeCandidate = barrier.side === 'west' || barrier.side === 'south';
  const warnings = [
    'signed thickness blocked',
    'geometry length/thickness not traced',
    'material TVL/density citation missing',
    'source term missing',
  ];

  if (barrier.roomId === 'centro-neuro-linac') warnings.push('15 MeV requires neutron review');
  if (barrier.roomId === 'centro-neuro-cyclotron') warnings.push('18 MeV cyclotron requires neutron/activation/exhaust review');
  if (barrier.roomId === 'centro-neuro-lgk') warnings.push('Co-60 activity and decay date required');
  if (isVertical) warnings.push('floor/ceiling needs vertical occupancy and structural review');
  if (isDoorMazeCandidate) warnings.push('door/maze/penetration path must be tagged if applicable');

  return {
    barrierId: barrier.barrierId,
    roomId: barrier.roomId,
    equipmentLabel: equipmentByRoom.get(barrier.roomId)?.label ?? rooms.find((room) => room.roomId === barrier.roomId)?.label ?? 'Radiofarmacia / hot lab context',
    modalityProfile: equipmentByRoom.get(barrier.roomId)?.modalityProfile ?? rooms.find((room) => room.roomId === barrier.roomId)?.modalityProfile ?? 'NM',
    side: barrier.side,
    adjacencyClass: barrier.adjacencyClass,
    occupancyFactorT: barrier.occupancyFactorT,
    designGoalP: barrier.designGoalP,
    scale: f344?.scalePolicy?.ratioLabel ?? '1:100',
    methodId: method.methodId,
    standard: method.standard,
    sourceTermRequired: method.sourceTermRequired,
    materialRequired: 'versioned TVL/HVL, density, page/hash and supplier/lab evidence',
    geometryRequired: 'traced barrier length, distance to point of interest, wall/floor/ceiling role and penetration tags',
    conservativeCheck: method.conservativeCheck,
    outputStatus: 'draft-input-row-ready-thickness-blocked',
    signedCalculationProduced: false,
    warnings,
  };
}

const barrierCalculationRows = barrierDrafts.map(classifyBarrier);

const calculationGateStatus = [
  {
    gateId: 'scale-1-100',
    status: f344?.scalePolicy?.ratioLabel === '1:100' ? 'pass-for-draft' : 'blocked',
    evidence: f344?.scalePolicy?.ratioLabel ?? 'missing',
  },
  {
    gateId: 'public-occupancy',
    status: barrierCalculationRows.every((row) => row.adjacencyClass === 'publico en general' && row.occupancyFactorT === 1) ? 'pass-for-draft' : 'blocked',
    evidence: 'publico en general, T=1',
  },
  {
    gateId: 'source-term',
    status: 'pending-before-thickness',
    evidence: 'vendor/program source terms still required',
  },
  {
    gateId: 'material-citation',
    status: 'pending-before-thickness',
    evidence: 'TVL/HVL/density/page/hash still required',
  },
  {
    gateId: 'geometry-trace',
    status: 'pending-before-thickness',
    evidence: 'barrier lengths/distances/penetrations still required from canvas',
  },
  {
    gateId: 'fm-rso-final-review',
    status: 'final-release-gate',
    evidence: 'not a markup blocker; blocks signed report',
  },
];

const visualRooms = [
  { id: 'linac', x: 70, y: 70, w: 260, h: 155, fill: '#fee2e2', stroke: '#dc2626', title: 'Versa HD 15 MeV', tag: 'TX', note: 'NCRP 151 + neutrons' },
  { id: 'lgk', x: 370, y: 70, w: 245, h: 155, fill: '#ede9fe', stroke: '#7c3aed', title: 'Gamma Knife Esprit', tag: 'TX', note: 'Co-60 decay gate' },
  { id: 'cyclotron', x: 70, y: 270, w: 260, h: 170, fill: '#dbeafe', stroke: '#2563eb', title: 'Cyclone KIUBE 18 MeV', tag: 'CY', note: 'Neutron + exhaust' },
  { id: 'hotlab', x: 370, y: 270, w: 245, h: 170, fill: '#dcfce7', stroke: '#16a34a', title: 'Radiofarmacia / hot lab', tag: 'NM', note: 'Inventory pending' },
];

const visualSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="980" height="620" viewBox="0 0 980 620" role="img" aria-label="F345 Centro Neuro draft calculation visual progress">
  <rect width="980" height="620" fill="#f8fafc"/>
  <text x="42" y="44" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#0f172a">F345 Centro Neuro - draft calculation packet</text>
  <text x="42" y="68" font-family="Arial, sans-serif" font-size="13" fill="#475569">Scale 1:100 | adjacency publico en general | T=1 | signed thickness blocked until source/material/geometry gates pass</text>
  <g transform="translate(0,0)">
    ${visualRooms.map((room) => `
    <rect x="${room.x}" y="${room.y}" width="${room.w}" height="${room.h}" rx="8" fill="${room.fill}" stroke="${room.stroke}" stroke-width="3"/>
    <text x="${room.x + 18}" y="${room.y + 32}" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111827">${room.title}</text>
    <text x="${room.x + 18}" y="${room.y + 57}" font-family="Arial, sans-serif" font-size="13" fill="#334155">${room.note}</text>
    <circle cx="${room.x + room.w - 34}" cy="${room.y + 34}" r="20" fill="${room.stroke}"/>
    <text x="${room.x + room.w - 34}" y="${room.y + 39}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#ffffff">${room.tag}</text>
    <line x1="${room.x}" y1="${room.y}" x2="${room.x + room.w}" y2="${room.y}" stroke="${room.stroke}" stroke-width="5"/>
    <line x1="${room.x}" y1="${room.y + room.h}" x2="${room.x + room.w}" y2="${room.y + room.h}" stroke="${room.stroke}" stroke-width="5"/>
    <line x1="${room.x}" y1="${room.y}" x2="${room.x}" y2="${room.y + room.h}" stroke="${room.stroke}" stroke-width="5"/>
    <line x1="${room.x + room.w}" y1="${room.y}" x2="${room.x + room.w}" y2="${room.y + room.h}" stroke="${room.stroke}" stroke-width="5"/>
    <text x="${room.x + 18}" y="${room.y + room.h - 26}" font-family="Arial, sans-serif" font-size="12" fill="#475569">6 barriers drafted: N/S/E/W/floor/ceiling</text>`).join('')}
  </g>
  <g transform="translate(680,92)">
    <rect x="0" y="0" width="250" height="390" rx="10" fill="#ffffff" stroke="#cbd5e1"/>
    <text x="18" y="32" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#0f172a">Calculation gates</text>
    <text x="18" y="62" font-family="Arial, sans-serif" font-size="13" fill="#16a34a">PASS draft: scale 1:100</text>
    <text x="18" y="88" font-family="Arial, sans-serif" font-size="13" fill="#16a34a">PASS draft: publico/T=1</text>
    <text x="18" y="126" font-family="Arial, sans-serif" font-size="13" fill="#f97316">PENDING: source terms</text>
    <text x="18" y="152" font-family="Arial, sans-serif" font-size="13" fill="#f97316">PENDING: material TVL/density</text>
    <text x="18" y="178" font-family="Arial, sans-serif" font-size="13" fill="#f97316">PENDING: traced geometry</text>
    <text x="18" y="216" font-family="Arial, sans-serif" font-size="13" fill="#dc2626">FINAL GATE: FM/RSO review</text>
    <line x1="18" y1="244" x2="232" y2="244" stroke="#e2e8f0"/>
    <text x="18" y="274" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#0f172a">Output</text>
    <text x="18" y="300" font-family="Arial, sans-serif" font-size="13" fill="#475569">24 draft rows</text>
    <text x="18" y="326" font-family="Arial, sans-serif" font-size="13" fill="#475569">0 signed thicknesses</text>
    <text x="18" y="352" font-family="Arial, sans-serif" font-size="13" fill="#475569">Ready for F346 visual markup</text>
  </g>
  <text x="42" y="562" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Visual progress artifact: not a certified shielding result. It shows workflow readiness and blocked inputs.</text>
</svg>
`;

const visualHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>F345 Centro Neuro Draft Calculation Packet</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; }
    main { max-width: 1120px; margin: 0 auto; padding: 28px; }
    h1 { margin: 0 0 6px; font-size: 28px; }
    .sub { color: #475569; margin-bottom: 22px; }
    .panel { background: white; border: 1px solid #d8e0ea; border-radius: 8px; padding: 18px; margin: 18px 0; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .metric { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #ffffff; }
    .metric strong { display: block; font-size: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; }
    .blocked { color: #b45309; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <h1>F345 Centro Neuro - avance visual</h1>
    <div class="sub">Paquete draft de calculo por barrera. Escala 1:100, colindancia publico en general, T=1. Sin espesor firmable.</div>
    <div class="panel">${visualSvg.replace(/<\?xml[^>]*>\n?/, '')}</div>
    <div class="grid">
      <div class="metric"><span>Barreras draft</span><strong>${barrierCalculationRows.length}</strong></div>
      <div class="metric"><span>Salas / areas</span><strong>${rooms.length}</strong></div>
      <div class="metric"><span>Espesores firmables</span><strong>0</strong></div>
    </div>
    <div class="panel">
      <h2>Primeras barreras</h2>
      <table>
        <thead><tr><th>Barrera</th><th>Metodo</th><th>Estado</th><th>Advertencias</th></tr></thead>
        <tbody>
          ${barrierCalculationRows.slice(0, 10).map((row) => `<tr><td>${row.barrierId}</td><td>${row.methodId}</td><td class="blocked">${row.outputStatus}</td><td>${row.warnings.slice(0, 3).join('<br>')}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>
`;

const manifest = {
  schema: 'radshield-mx.f345.centro-neuro-draft-calculation-packet.v1',
  phase: 'F345',
  generatedAt: new Date().toISOString(),
  status: 'draft-calculation-packet-ready-thickness-blocked',
  source: {
    f344Manifest: 'outputs/f344_centro_neuro_public_occupancy_markup/f344_centro_neuro_public_occupancy_markup.json',
    f343Manifest: 'outputs/f343_centro_neuro_preflight/f343_centro_neuro_preflight.json',
    sourcePdfSha256: f344?.source?.sourcePdfSha256 ?? f343?.source?.sourcePdfSha256 ?? null,
  },
  scale: f344?.scalePolicy ?? null,
  publicOccupancyPolicy: f344?.publicOccupancyPolicy ?? null,
  fmReviewPolicy: f344?.fmReviewPolicy ?? null,
  calculationGateStatus,
  barrierCalculationRows,
  visualArtifacts: {
    svg: 'outputs/f345_centro_neuro_draft_calculation_packet/f345_visual_progress.svg',
    html: 'outputs/f345_centro_neuro_draft_calculation_packet/f345_visual_progress.html',
  },
  signedCalculationProduced: false,
  packetHash: sha256Text(JSON.stringify({ calculationGateStatus, barrierCalculationRows })),
  nextRecommendedPhase: 'F346: reflect this draft packet inside the app canvas/report surfaces and capture browser screenshots of the visual progress.',
};

fs.writeFileSync(path.join(outDir, 'f345_centro_neuro_draft_calculation_packet.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f345_visual_progress.svg'), visualSvg, 'utf8');
fs.writeFileSync(path.join(outDir, 'f345_visual_progress.html'), visualHtml, 'utf8');
fs.writeFileSync(
  path.join(outDir, 'f345_barrier_draft_calculation_matrix.csv'),
  [
    ['barrierId', 'roomId', 'equipmentLabel', 'modalityProfile', 'side', 'adjacencyClass', 'occupancyFactorT', 'designGoalP', 'scale', 'methodId', 'standard', 'outputStatus', 'warnings'].map(csvCell).join(','),
    ...barrierCalculationRows.map((row) => [
      row.barrierId,
      row.roomId,
      row.equipmentLabel,
      row.modalityProfile,
      row.side,
      row.adjacencyClass,
      row.occupancyFactorT,
      row.designGoalP,
      row.scale,
      row.methodId,
      row.standard,
      row.outputStatus,
      row.warnings.join('; '),
    ].map(csvCell).join(',')),
  ].join('\n') + '\n',
  'utf8',
);
fs.writeFileSync(
  path.join(outDir, 'f345_calculation_gate_status.csv'),
  [
    ['gateId', 'status', 'evidence'].map(csvCell).join(','),
    ...calculationGateStatus.map((gate) => [gate.gateId, gate.status, gate.evidence].map(csvCell).join(',')),
  ].join('\n') + '\n',
  'utf8',
);

const md = [
  '# F345 Centro Neuro Draft Calculation Packet',
  '',
  `Status: ${manifest.status}`,
  `Barrier draft rows: ${barrierCalculationRows.length}`,
  `Signed calculation produced: ${manifest.signedCalculationProduced}`,
  '',
  '## Visual',
  '- `outputs/f345_centro_neuro_draft_calculation_packet/f345_visual_progress.svg`',
  '- `outputs/f345_centro_neuro_draft_calculation_packet/f345_visual_progress.html`',
  '',
  '## Gates',
  ...calculationGateStatus.map((gate) => `- ${gate.gateId}: ${gate.status} (${gate.evidence}).`),
  '',
  '## Draft Scope',
  '- Creates one calculation input row for each public-adjacency barrier.',
  '- Keeps all rows blocked before thickness until source term, material citation and traced geometry are complete.',
  '- Adds method IDs and standards so Memoria IA, PDF and Evidence Pack can cite the future calculation path.',
  '',
  '## Next',
  manifest.nextRecommendedPhase,
  '',
].join('\n');

fs.writeFileSync(path.join(root, 'outputs', 'fase_345_centro_neuro_draft_calculation_packet.md'), md, 'utf8');

console.log(`F345 ${manifest.status}: ${barrierCalculationRows.length} barriers, ${calculationGateStatus.length} gates, visual HTML/SVG ready.`);
