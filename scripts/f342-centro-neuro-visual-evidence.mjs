import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f342_centro_neuro_visual_evidence');
const f339Path = path.join(root, 'outputs', 'f339_real_case_centro_neuro', 'f339_real_case_centro_neuro.json');
const f340Path = path.join(root, 'outputs', 'f340_centro_neuro_operator_trial', 'f340_centro_neuro_operator_trial.json');
const f341Path = path.join(root, 'outputs', 'f341_centro_neuro_calibrated_trial', 'f341_centro_neuro_calibrated_trial.json');
fs.mkdirSync(outDir, { recursive: true });

function readJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

function sha256(file) {
  return fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const f339 = readJson(f339Path);
const f340 = readJson(f340Path);
const f341 = readJson(f341Path);
const background = f340?.source?.renderedPage ?? 'outputs/f339_real_case_centro_neuro/centro_neuro_page-1.png';
const overlay = 'outputs/f340_centro_neuro_operator_trial/f340_centro_neuro_overlay.svg';
const sourceTerms = f341?.sourceTerms ?? [];
const pendingInputs = [
  ...((f341?.penetrationSchedule?.requiredItems ?? []).map((item) => ({ category: 'Penetracion', item }))),
  ...((f341?.occupancyMap?.suggestedDraftZones ?? []).map((item) => ({ category: 'Ocupacion', item: `${item.zone} (T draft ${item.factorDraft})` }))),
  { category: 'Material', item: 'TVL/densidad versionada para concreto alta densidad' },
  { category: 'Fuente', item: 'Termino fuente completo por equipo' },
];

const visualCards = [
  {
    title: 'Escala',
    value: f341?.drawingScale?.ratioLabel ?? 'pendiente',
    detail: `${f341?.provisionalScale?.metersPerPixel ?? 'n/a'} m/px provisional`,
    status: 'draft',
  },
  {
    title: 'Material',
    value: f341?.defaultMaterial?.label ?? 'pendiente',
    detail: f341?.defaultMaterial?.tvlStatus ?? 'pendiente',
    status: 'gated',
  },
  {
    title: 'Fuentes',
    value: `${sourceTerms.length} plantillas`,
    detail: sourceTerms.map((item) => item.equipment).join(' / '),
    status: 'pending-inputs',
  },
  {
    title: 'Salidas',
    value: 'Canvas + 3D + Memoria',
    detail: 'PDF, Evidence Pack y checklist CNSNS/UAQ',
    status: 'ready-for-smoke',
  },
];

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>F342 Centro Neuro Visual Evidence</title>
  <style>
    :root { color-scheme: light; font-family: Inter, Arial, sans-serif; background: #f8fafc; color: #0f172a; }
    body { margin: 0; padding: 24px; }
    .shell { max-width: 1400px; margin: 0 auto; display: grid; gap: 18px; }
    header { display: flex; justify-content: space-between; gap: 16px; align-items: end; }
    h1 { margin: 0; font-size: 28px; }
    .sub { color: #475569; font-size: 14px; }
    .cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .card { background: white; border: 1px solid #dbe3ef; border-radius: 8px; padding: 14px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
    .card b { display: block; font-size: 12px; text-transform: uppercase; color: #64748b; }
    .card strong { display: block; margin-top: 6px; font-size: 18px; }
    .card span { display: block; margin-top: 6px; color: #475569; font-size: 12px; line-height: 1.35; }
    .board { display: grid; grid-template-columns: 0.86fr 1.14fr; gap: 18px; align-items: start; }
    .plan { background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
    .plan img { width: 100%; display: block; border: 1px solid #e2e8f0; background: white; }
    .panel { display: grid; gap: 12px; }
    .equipment { background: white; border: 1px solid #dbe3ef; border-radius: 8px; padding: 14px; }
    .equipment h2 { margin: 0 0 10px; font-size: 16px; }
    .row { display: grid; grid-template-columns: 160px 1fr; gap: 10px; padding: 10px 0; border-top: 1px solid #edf2f7; }
    .tag { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 4px 8px; color: white; font-size: 12px; font-weight: 700; }
    .cy { background: #f97316; }
    .tx { background: #2563eb; }
    .nm { background: #10b981; }
    .pending { columns: 2; padding-left: 18px; color: #334155; font-size: 13px; }
    footer { color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <main class="shell">
    <header>
      <div>
        <h1>F342 Centro Neuro - Evidencia visual</h1>
        <div class="sub">Ciclotron + Gamma Knife/LGK + LINAC | escala 1:100 | concreto alta densidad draft</div>
      </div>
      <div class="sub">Estado: ${escapeHtml(f341?.status ?? 'gated')}</div>
    </header>
    <section class="cards">
      ${visualCards.map((card) => `<article class="card"><b>${escapeHtml(card.title)}</b><strong>${escapeHtml(card.value)}</strong><span>${escapeHtml(card.detail)}</span></article>`).join('\n      ')}
    </section>
    <section class="board">
      <article class="plan">
        <img src="../f340_centro_neuro_operator_trial/f340_centro_neuro_overlay.svg" alt="Overlay F340 Centro Neuro" />
      </article>
      <section class="panel">
        <article class="equipment">
          <h2>Fuentes por modalidad</h2>
          ${sourceTerms.map((source) => `<div class="row"><div><span class="tag ${source.modalityProfile.toLowerCase()}">${escapeHtml(source.modalityProfile)}</span></div><div><b>${escapeHtml(source.equipment)}</b><br/><span>${escapeHtml(source.sourceKind)}</span><br/><small>${escapeHtml(source.requiredFields.join(', '))}</small></div></div>`).join('\n          ')}
        </article>
        <article class="equipment">
          <h2>Pendientes antes de calculo firmable</h2>
          <ul class="pending">
            ${pendingInputs.map((item) => `<li><b>${escapeHtml(item.category)}:</b> ${escapeHtml(item.item)}</li>`).join('\n            ')}
          </ul>
        </article>
      </section>
    </section>
    <footer>
      Visual de revision. No certifica blindaje: faltan fuente exacta, ocupacion aprobada, penetraciones marcadas, TVL/densidad versionada y revision calificada.
    </footer>
  </main>
</body>
</html>
`;

const htmlPath = path.join(outDir, 'f342_visual_review.html');
fs.writeFileSync(htmlPath, html, 'utf8');

const gates = [
  { id: 'f339-ready', pass: f339?.status === 'real-case-centro-neuro-ready-for-operator-trial', evidence: 'outputs/f339_real_case_centro_neuro/f339_real_case_centro_neuro.json' },
  { id: 'f340-ready', pass: f340?.status === 'centro-neuro-operator-trial-ready', evidence: 'outputs/f340_centro_neuro_operator_trial/f340_centro_neuro_operator_trial.json' },
  { id: 'f341-ready', pass: f341?.status === 'centro-neuro-calibrated-trial-ready', evidence: 'outputs/f341_centro_neuro_calibrated_trial/f341_centro_neuro_calibrated_trial.json' },
  { id: 'visual-html-ready', pass: fs.existsSync(htmlPath), evidence: 'outputs/f342_centro_neuro_visual_evidence/f342_visual_review.html' },
  { id: 'overlay-ready', pass: fs.existsSync(path.join(root, overlay)), evidence: overlay },
  { id: 'background-ready', pass: fs.existsSync(path.join(root, background)), evidence: background },
  { id: 'sources-visible', pass: sourceTerms.length === 3, evidence: sourceTerms.map((item) => item.equipment).join(', ') },
  { id: 'pending-inputs-visible', pass: pendingInputs.length >= 10, evidence: 'penetrations, occupancy, material, source terms' },
];

const blockers = gates.filter((gate) => !gate.pass).map((gate) => `gate:${gate.id}`);
const manifest = {
  schema: 'radshield-mx.f342.centro-neuro-visual-evidence.v1',
  phase: 'F342',
  generatedAt: new Date().toISOString(),
  status: blockers.length === 0 ? 'centro-neuro-visual-evidence-ready' : 'centro-neuro-visual-evidence-gated',
  visualReviewHtml: 'outputs/f342_centro_neuro_visual_evidence/f342_visual_review.html',
  expectedBrowserScreenshots: [
    'outputs/f342_centro_neuro_browser_smoke/01_canvas_shell.png',
    'outputs/f342_centro_neuro_browser_smoke/02_update_center_f341.png',
    'outputs/f342_centro_neuro_browser_smoke/03_medical_3d.png',
    'outputs/f342_centro_neuro_browser_smoke/04_memoria_ai.png',
    'outputs/f342_centro_neuro_browser_smoke/05_evidence_pack.png',
    'outputs/f342_centro_neuro_browser_smoke/06_visual_review.png',
  ],
  visualCards,
  pendingInputs,
  gates,
  blockers,
  nextRecommendedPhase: blockers.length === 0
    ? 'F343: enter real source/occupancy/penetration values and run calculation preflight per equipment.'
    : 'Resolve visual evidence gates and repeat F342.',
};

fs.writeFileSync(path.join(outDir, 'f342_centro_neuro_visual_evidence.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
const md = [
  '# F342 Centro Neuro Visual Evidence',
  '',
  `Status: ${manifest.status}`,
  `Visual HTML: ${manifest.visualReviewHtml}`,
  '',
  '## Visual Cards',
  ...visualCards.map((card) => `- ${card.title}: ${card.value} (${card.detail})`),
  '',
  '## Expected Browser Screenshots',
  ...manifest.expectedBrowserScreenshots.map((item) => `- ${item}`),
  '',
  '## Next',
  manifest.nextRecommendedPhase,
  '',
].join('\n');
fs.writeFileSync(path.join(root, 'outputs', 'fase_342_centro_neuro_visual_evidence.md'), md, 'utf8');
console.log(`F342 ${manifest.status}: ${gates.filter((gate) => gate.pass).length}/${gates.length} gates.`);
if (blockers.length) process.exit(1);
