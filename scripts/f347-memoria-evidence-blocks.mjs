import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f347_memoria_evidence_blocks');
const f346Path = path.join(root, 'outputs', 'f346_standard_parameter_draft', 'f346_standard_parameter_draft.json');

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

const f346 = readJson(f346Path);
const rows = f346?.parameterizedRows ?? [];

const modalityLabels = {
  TX: 'Terapia / radiocirugia',
  CY: 'Ciclotron / produccion',
  NM: 'Medicina nuclear / radiofarmacia',
};

const grouped = rows.reduce((acc, row) => {
  const key = row.roomId;
  if (!acc[key]) acc[key] = [];
  acc[key].push(row);
  return acc;
}, {});

function buildEvidenceBlock(roomId, roomRows) {
  const sample = roomRows[0];
  const requiredCitationIds = new Set();
  const requiredData = new Set();
  const warnings = new Set();

  for (const row of roomRows) {
    for (const warning of row.warnings ?? []) warnings.add(warning);
    requiredCitationIds.add(row.tvlCitationStatus);
    requiredCitationIds.add(row.sourceCitationStatus);
    requiredData.add(row.geometryRequired);
    requiredData.add(row.materialRequired);
    requiredData.add(row.sourceTermRequired);
  }

  const maxStructuralLoad = Math.max(...roomRows.map((row) => Number(row.structuralLoadKgM2 || 0)));
  const tvlUses = [...new Set(roomRows.map((row) => `${row.tvlUse}:${row.tvlCmDraft ?? 'pending'}`))];
  const sides = roomRows.map((row) => row.side).join(', ');
  const blockerCount = [...warnings].filter((warning) => /blocked|required|missing|pending|replace|candidate|citation/i.test(warning)).length;

  return {
    evidenceBlockId: `f347-${roomId}-memoria-block`,
    roomId,
    equipmentLabel: sample.equipmentLabel,
    modalityProfile: sample.modalityProfile,
    modalityLabel: modalityLabels[sample.modalityProfile] ?? sample.modalityProfile,
    summary: `${sample.equipmentLabel} uses draft public-adjacency barriers (${sides}) with standard geometry/source/material parameters. This block is suitable for Memoria IA drafting only.`,
    memoriaSectionDraft: [
      `Equipo/area: ${sample.equipmentLabel}.`,
      `Perfil: ${modalityLabels[sample.modalityProfile] ?? sample.modalityProfile}.`,
      `Escala de trabajo: ${sample.scale}. Colindancia: ${sample.adjacencyClass}; T=${sample.occupancyFactorT}.`,
      `Metodo preliminar: ${sample.methodId}. Norma/metodologia: ${sample.standard}.`,
      `Material candidato: ${sample.materialId}; densidad draft ${sample.densityKgM3Draft} kg/m3.`,
      `TVL candidato: ${tvlUses.join('; ')}.`,
      `Carga estructural maxima draft: ${maxStructuralLoad} kg/m2.`,
      'Resultado: bloque preliminar no firmable; requiere citas versionadas, geometria trazada y revision final.',
    ],
    formulaTraceDraft: {
      formulaId: sample.methodId,
      standard: sample.standard,
      inputs: [
        'scale=1:100',
        'occupancy=publico en general',
        'T=1',
        'standard geometry',
        'standard source term placeholder',
        'high-density concrete candidate',
      ],
      outputs: [
        'draft evidence block',
        'structural load estimate',
        'citation checklist',
        'warnings',
      ],
      noThicknessOutput: true,
    },
    requiredData: [...requiredData],
    requiredCitationIds: [...requiredCitationIds],
    warningCount: [...warnings].length,
    blockerCount,
    warnings: [...warnings],
    status: 'memoria-evidence-draft-ready-not-signed',
  };
}

const evidenceBlocks = Object.entries(grouped).map(([roomId, roomRows]) => buildEvidenceBlock(roomId, roomRows));

const memoriaIaChecklist = [
  { item: 'Confirmar escala contra cota conocida', status: 'pending-before-signed-memory' },
  { item: 'Reemplazar geometria estandar por trazado CAD/canvas', status: 'pending-before-signed-memory' },
  { item: 'Reemplazar termino fuente estandar por proveedor/programa clinico', status: 'pending-before-signed-memory' },
  { item: 'Versionar TVL/densidad con documento, pagina y hash', status: 'pending-before-signed-memory' },
  { item: 'Marcar y resolver penetraciones', status: 'pending-before-signed-memory' },
  { item: 'Revisar carga estructural con ingenieria', status: 'pending-before-construction' },
  { item: 'Revision FM/RSO final', status: 'final-release-gate' },
];

const reportHandoff = {
  memoriaIaReady: true,
  pdfReady: true,
  evidencePackReady: true,
  signedCalculationProduced: false,
  handoffPolicy: 'Use evidence blocks for preliminary narrative and checklist only. Do not include candidate TVL values as final design data.',
  targetSections: [
    'Resumen ejecutivo',
    'Datos de entrada',
    'Geometria y ocupacion',
    'Termino fuente',
    'Materiales y carga estructural',
    'Metodo de calculo',
    'Advertencias y pendientes',
    'Checklist de cierre',
  ],
};

const visualSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="700" viewBox="0 0 1120 700" role="img" aria-label="F347 Memoria IA evidence block visual">
  <rect width="1120" height="700" fill="#f8fafc"/>
  <text x="42" y="46" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">F347 - Memoria IA evidence blocks</text>
  <text x="42" y="72" font-family="Arial, sans-serif" font-size="13" fill="#475569">Narrativa preliminar conectada a F346. Citas, geometria real y revision final siguen como gates.</text>
  <g transform="translate(42,112)">
    ${evidenceBlocks.map((block, index) => {
      const x = (index % 2) * 510;
      const y = Math.floor(index / 2) * 195;
      const color = block.modalityProfile === 'CY' ? '#2563eb' : block.modalityProfile === 'NM' ? '#16a34a' : '#7c3aed';
      return `
      <rect x="${x}" y="${y}" width="470" height="160" rx="10" fill="#ffffff" stroke="${color}" stroke-width="3"/>
      <text x="${x + 18}" y="${y + 30}" font-family="Arial" font-size="17" font-weight="700" fill="#111827">${block.equipmentLabel}</text>
      <text x="${x + 18}" y="${y + 56}" font-family="Arial" font-size="13" fill="#475569">${block.modalityLabel}</text>
      <text x="${x + 18}" y="${y + 84}" font-family="Arial" font-size="13" fill="#334155">Warnings: ${block.warningCount} | Blockers: ${block.blockerCount}</text>
      <text x="${x + 18}" y="${y + 112}" font-family="Arial" font-size="13" fill="#334155">Formula: ${block.formulaTraceDraft.formulaId}</text>
      <text x="${x + 18}" y="${y + 140}" font-family="Arial" font-size="13" fill="#b45309">Status: draft, not signed</text>`;
    }).join('')}
  </g>
  <g transform="translate(42,535)">
    <rect width="1020" height="108" rx="10" fill="#fff7ed" stroke="#f97316"/>
    <text x="18" y="30" font-family="Arial" font-size="17" font-weight="700" fill="#9a3412">Checklist final antes de memoria firmable</text>
    <text x="18" y="58" font-family="Arial" font-size="13" fill="#7c2d12">Escala/cota | geometria CAD | termino fuente proveedor | TVL/densidad con pagina/hash | penetraciones | carga estructural | FM/RSO</text>
    <text x="18" y="84" font-family="Arial" font-size="13" fill="#7c2d12">F347 produce narrativa y evidencia preliminar. No produce espesor firmado.</text>
  </g>
</svg>
`;

const visualHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>F347 Memoria IA Evidence Blocks</title>
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
    <h1>F347 - Memoria IA evidence blocks</h1>
    <div class="sub">Bloques preliminares por modalidad conectados a F346. Sin resultado firmable.</div>
    <div class="panel">${visualSvg.replace(/<\?xml[^>]*>\n?/, '')}</div>
    <div class="panel">
      <h2>Bloques de evidencia</h2>
      <table>
        <thead><tr><th>Bloque</th><th>Equipo</th><th>Metodo</th><th>Warnings</th><th>Estado</th></tr></thead>
        <tbody>
          ${evidenceBlocks.map((block) => `<tr><td>${block.evidenceBlockId}</td><td>${block.equipmentLabel}</td><td>${block.formulaTraceDraft.formulaId}</td><td>${block.warningCount}</td><td class="blocked">${block.status}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>
`;

const manifest = {
  schema: 'radshield-mx.f347.memoria-evidence-blocks.v1',
  phase: 'F347',
  generatedAt: new Date().toISOString(),
  status: 'memoria-evidence-blocks-ready-preliminary',
  source: {
    f346Manifest: 'outputs/f346_standard_parameter_draft/f346_standard_parameter_draft.json',
    sourcePdfSha256: f346?.source?.sourcePdfSha256 ?? null,
  },
  evidenceBlocks,
  memoriaIaChecklist,
  reportHandoff,
  visualArtifacts: {
    svg: 'outputs/f347_memoria_evidence_blocks/f347_memoria_evidence_visual.svg',
    html: 'outputs/f347_memoria_evidence_blocks/f347_memoria_evidence_visual.html',
  },
  signedCalculationProduced: false,
  evidenceHash: sha256Text(JSON.stringify({ evidenceBlocks, memoriaIaChecklist, reportHandoff })),
  nextRecommendedPhase: 'F348: expose these Memoria IA evidence blocks in the app/report surfaces and capture browser evidence.',
};

fs.writeFileSync(path.join(outDir, 'f347_memoria_evidence_blocks.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f347_memoria_evidence_visual.svg'), visualSvg, 'utf8');
fs.writeFileSync(path.join(outDir, 'f347_memoria_evidence_visual.html'), visualHtml, 'utf8');
fs.writeFileSync(
  path.join(outDir, 'f347_memoria_blocks.csv'),
  [
    ['evidenceBlockId', 'roomId', 'equipmentLabel', 'modalityProfile', 'formulaId', 'warningCount', 'blockerCount', 'status'].map(csvCell).join(','),
    ...evidenceBlocks.map((block) => [
      block.evidenceBlockId,
      block.roomId,
      block.equipmentLabel,
      block.modalityProfile,
      block.formulaTraceDraft.formulaId,
      block.warningCount,
      block.blockerCount,
      block.status,
    ].map(csvCell).join(',')),
  ].join('\n') + '\n',
  'utf8',
);
fs.writeFileSync(
  path.join(outDir, 'f347_memoria_checklist.csv'),
  [
    ['item', 'status'].map(csvCell).join(','),
    ...memoriaIaChecklist.map((item) => [item.item, item.status].map(csvCell).join(',')),
  ].join('\n') + '\n',
  'utf8',
);

const md = [
  '# F347 Memoria IA Evidence Blocks',
  '',
  `Status: ${manifest.status}`,
  `Evidence blocks: ${evidenceBlocks.length}`,
  `Signed calculation produced: ${manifest.signedCalculationProduced}`,
  '',
  '## Blocks',
  ...evidenceBlocks.map((block) => `- ${block.equipmentLabel}: ${block.formulaTraceDraft.formulaId}; warnings=${block.warningCount}; status=${block.status}.`),
  '',
  '## Checklist',
  ...memoriaIaChecklist.map((item) => `- ${item.item}: ${item.status}.`),
  '',
  '## Visual',
  '- `outputs/f347_memoria_evidence_blocks/f347_memoria_evidence_visual.svg`',
  '- `outputs/f347_memoria_evidence_blocks/f347_memoria_evidence_visual.html`',
  '',
  '## Next',
  manifest.nextRecommendedPhase,
  '',
].join('\n');

fs.writeFileSync(path.join(root, 'outputs', 'fase_347_memoria_evidence_blocks.md'), md, 'utf8');

console.log(`F347 ${manifest.status}: ${evidenceBlocks.length} evidence blocks, visual HTML/SVG ready.`);
