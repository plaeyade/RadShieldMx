import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f348_app_surface_evidence_handoff');
const f347Path = path.join(root, 'outputs', 'f347_memoria_evidence_blocks', 'f347_memoria_evidence_blocks.json');

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

const f347 = readJson(f347Path);
const blocks = f347?.evidenceBlocks ?? [];

const appSurfaces = [
  {
    surfaceId: 'canvas-evidence-sidebar',
    label: 'Canvas evidence sidebar',
    routeHint: 'ShieldingDesigner / right panel',
    purpose: 'Show selected room/barrier evidence block, warnings and missing citations while tracing.',
    consumes: ['evidenceBlockId', 'formulaTraceDraft', 'warnings', 'requiredData'],
    status: 'surface-contract-ready',
  },
  {
    surfaceId: 'memoria-ai-wizard',
    label: 'Memoria IA wizard',
    routeHint: 'MemoriaAIWizard',
    purpose: 'Seed preliminary analytical-memory sections per modality.',
    consumes: ['memoriaSectionDraft', 'formulaTraceDraft', 'requiredCitationIds'],
    status: 'surface-contract-ready',
  },
  {
    surfaceId: 'evidence-pack',
    label: 'Evidence Pack',
    routeHint: 'EvidencePackDialog',
    purpose: 'Package source hash, assumptions, warnings, citation checklist and no-signed-output proof.',
    consumes: ['sourcePdfSha256', 'evidenceHash', 'memoriaIaChecklist'],
    status: 'surface-contract-ready',
  },
  {
    surfaceId: 'pdf-report',
    label: 'PDF report draft',
    routeHint: 'PdfReportDialog',
    purpose: 'Render preliminary narrative with watermarks and final-gate checklist.',
    consumes: ['memoriaSectionDraft', 'reportHandoff', 'signedCalculationProduced'],
    status: 'surface-contract-ready',
  },
  {
    surfaceId: 'medical-3d-inspection',
    label: 'Medical 3D inspection',
    routeHint: 'MedicalFloorPlan3DDialog',
    purpose: 'Expose room/equipment context and blocked calculation status in visual inspection.',
    consumes: ['roomId', 'equipmentLabel', 'modalityProfile', 'warningCount'],
    status: 'surface-contract-ready',
  },
];

const surfaceBindings = blocks.flatMap((block) => appSurfaces.map((surface) => ({
  bindingId: `f348-${surface.surfaceId}-${block.roomId}`,
  surfaceId: surface.surfaceId,
  evidenceBlockId: block.evidenceBlockId,
  roomId: block.roomId,
  equipmentLabel: block.equipmentLabel,
  modalityProfile: block.modalityProfile,
  status: 'bound-preliminary-not-signed',
  requiredBeforeSigned: [
    'traced geometry',
    'source-term evidence',
    'TVL/density page/hash',
    'penetration resolution',
    'FM/RSO final review',
  ],
})));

const visualSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="720" viewBox="0 0 1160 720" role="img" aria-label="F348 app surface evidence handoff">
  <rect width="1160" height="720" fill="#f8fafc"/>
  <text x="42" y="46" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">F348 - App/report evidence surfaces</text>
  <text x="42" y="72" font-family="Arial, sans-serif" font-size="13" fill="#475569">Bloques F347 conectados a Canvas, Memoria IA, Evidence Pack, PDF y Medical 3D. Todo preliminar.</text>
  <g transform="translate(42,112)">
    ${appSurfaces.map((surface, index) => {
      const x = (index % 3) * 350;
      const y = Math.floor(index / 3) * 205;
      const color = ['#2563eb', '#7c3aed', '#16a34a', '#dc2626', '#f97316'][index];
      return `
      <rect x="${x}" y="${y}" width="315" height="155" rx="10" fill="#ffffff" stroke="${color}" stroke-width="3"/>
      <text x="${x + 16}" y="${y + 30}" font-family="Arial" font-size="17" font-weight="700" fill="#111827">${surface.label}</text>
      <text x="${x + 16}" y="${y + 55}" font-family="Arial" font-size="12" fill="#475569">${surface.routeHint}</text>
      <text x="${x + 16}" y="${y + 84}" font-family="Arial" font-size="12" fill="#334155">Bindings: ${blocks.length}</text>
      <text x="${x + 16}" y="${y + 112}" font-family="Arial" font-size="12" fill="#b45309">Preliminary / not signed</text>
      <text x="${x + 16}" y="${y + 136}" font-family="Arial" font-size="12" fill="#64748b">${surface.status}</text>`;
    }).join('')}
  </g>
  <g transform="translate(42,545)">
    <rect width="1060" height="105" rx="10" fill="#fff7ed" stroke="#f97316"/>
    <text x="18" y="32" font-family="Arial" font-size="17" font-weight="700" fill="#9a3412">F348 handoff</text>
    <text x="18" y="60" font-family="Arial" font-size="13" fill="#7c2d12">4 evidence blocks x 5 surfaces = ${surfaceBindings.length} bindings. Signed calculation remains false.</text>
    <text x="18" y="84" font-family="Arial" font-size="13" fill="#7c2d12">Next F349: QA all bindings, visual artifacts, docs and gate status before browser/deploy smoke.</text>
  </g>
</svg>
`;

const visualHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>F348 App Surface Evidence Handoff</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; }
    main { max-width: 1200px; margin: 0 auto; padding: 28px; }
    .panel { background: #fff; border: 1px solid #d8e0ea; border-radius: 8px; padding: 18px; margin: 18px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; }
    .warn { color: #b45309; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <h1>F348 - superficies de app/reporte</h1>
    <p>Handoff preliminar de evidencia F347 hacia Canvas, Memoria IA, Evidence Pack, PDF y Medical 3D.</p>
    <div class="panel">${visualSvg.replace(/<\?xml[^>]*>\n?/, '')}</div>
    <div class="panel">
      <h2>Bindings</h2>
      <table>
        <thead><tr><th>Surface</th><th>Equipo</th><th>Bloque</th><th>Estado</th></tr></thead>
        <tbody>
          ${surfaceBindings.map((binding) => `<tr><td>${binding.surfaceId}</td><td>${binding.equipmentLabel}</td><td>${binding.evidenceBlockId}</td><td class="warn">${binding.status}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>
`;

const manifest = {
  schema: 'radshield-mx.f348.app-surface-evidence-handoff.v1',
  phase: 'F348',
  generatedAt: new Date().toISOString(),
  status: 'app-surface-evidence-handoff-ready',
  source: {
    f347Manifest: 'outputs/f347_memoria_evidence_blocks/f347_memoria_evidence_blocks.json',
    sourcePdfSha256: f347?.source?.sourcePdfSha256 ?? null,
  },
  appSurfaces,
  surfaceBindings,
  signedCalculationProduced: false,
  visualArtifacts: {
    svg: 'outputs/f348_app_surface_evidence_handoff/f348_app_surface_handoff.svg',
    html: 'outputs/f348_app_surface_evidence_handoff/f348_app_surface_handoff.html',
  },
  handoffHash: sha256Text(JSON.stringify({ appSurfaces, surfaceBindings })),
  nextRecommendedPhase: 'F349: QA close the evidence-surface handoff and prepare browser/deploy smoke targets.',
};

fs.writeFileSync(path.join(outDir, 'f348_app_surface_evidence_handoff.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f348_app_surface_handoff.svg'), visualSvg, 'utf8');
fs.writeFileSync(path.join(outDir, 'f348_app_surface_handoff.html'), visualHtml, 'utf8');
fs.writeFileSync(
  path.join(outDir, 'f348_surface_bindings.csv'),
  [
    ['bindingId', 'surfaceId', 'evidenceBlockId', 'roomId', 'equipmentLabel', 'modalityProfile', 'status'].map(csvCell).join(','),
    ...surfaceBindings.map((binding) => [
      binding.bindingId,
      binding.surfaceId,
      binding.evidenceBlockId,
      binding.roomId,
      binding.equipmentLabel,
      binding.modalityProfile,
      binding.status,
    ].map(csvCell).join(',')),
  ].join('\n') + '\n',
  'utf8',
);

const md = [
  '# F348 App Surface Evidence Handoff',
  '',
  `Status: ${manifest.status}`,
  `Surfaces: ${appSurfaces.length}`,
  `Bindings: ${surfaceBindings.length}`,
  `Signed calculation produced: ${manifest.signedCalculationProduced}`,
  '',
  '## Surfaces',
  ...appSurfaces.map((surface) => `- ${surface.label}: ${surface.routeHint}; ${surface.status}.`),
  '',
  '## Visual',
  '- `outputs/f348_app_surface_evidence_handoff/f348_app_surface_handoff.svg`',
  '- `outputs/f348_app_surface_evidence_handoff/f348_app_surface_handoff.html`',
  '',
  '## Next',
  manifest.nextRecommendedPhase,
  '',
].join('\n');

fs.writeFileSync(path.join(root, 'outputs', 'fase_348_app_surface_evidence_handoff.md'), md, 'utf8');

console.log(`F348 ${manifest.status}: ${appSurfaces.length} surfaces, ${surfaceBindings.length} bindings.`);
