import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import JSZip from 'jszip';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f511_f514_beta_closure');
const distDir = path.join(root, 'dist');
const zipPath = path.join(outDir, 'radshield-mx-f511-f514-beta.zip');
fs.mkdirSync(outDir, { recursive: true });

const evidencePaths = [
  'outputs/f508_f509_post_seed_qa/f508_f509_summary.md',
  'outputs/f510_diagnostic_pet_tvl_promotion/f510_summary.md',
  'dist/index.html',
  'public/manual_usuario.html',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'MANUAL_USUARIO_v99.md',
];

const checklistRows = [
  ['load', 'Abrir URL beta', 'required', 'Confirmar que no hay pantalla blanca y que los assets cargan.'],
  ['file-menu', 'Menu Archivo', 'required', 'Confirmar alineacion, abrir/cerrar y acciones visibles.'],
  ['canvas', 'Canvas y sidebar', 'required', 'Confirmar canvas visible, sidebar estable, acceso rapido y paneles no obstructivos.'],
  ['update-center', 'Update Center', 'required', 'Confirmar entradas F510 y F511-F514.'],
  ['manual', 'Manual HTML', 'required', 'Confirmar version F511-F514 y addendum beta.'],
  ['db-qa', 'DB-backed QA', 'required', 'Confirmar F508-F510 pass 6/6 y 108 valores approved/calculation.'],
  ['calc-basic', 'Calculo basico', 'required', 'Ejecutar flujo preliminar y verificar warnings beta/no certificado.'],
  ['memoria', 'Memoria IA/reporte', 'recommended', 'Export preliminar con citas/evidencia si el caso tiene datos suficientes.'],
];

function gitValue(args, fallback) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function sha256File(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    else files.push(full);
  }
  return files;
}

function csvCell(value) {
  return JSON.stringify(String(value ?? ''));
}

function textIncludes(relativePath, pattern) {
  const file = path.join(root, relativePath);
  return fs.existsSync(file) && pattern.test(fs.readFileSync(file, 'utf8'));
}

async function zipDist() {
  const zip = new JSZip();
  for (const file of walkFiles(distDir)) {
    zip.file(path.relative(distDir, file).replaceAll('\\', '/'), fs.readFileSync(file));
  }
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  fs.writeFileSync(zipPath, buffer);
}

const f508Pass = textIncludes('outputs/f508_f509_post_seed_qa/f508_f509_summary.md', /Estado:\s*post-seed-qa-pass/i)
  && textIncludes('outputs/f508_f509_post_seed_qa/f508_f509_summary.md', /material_value_versions:\s*108/i)
  && textIncludes('outputs/f508_f509_post_seed_qa/f508_f509_summary.md', /pass,\s*35\.4 mm/i)
  && textIncludes('outputs/f508_f509_post_seed_qa/f508_f509_summary.md', /pass,\s*0\.54 mm/i);
const f510Ready = textIncludes('outputs/f510_diagnostic_pet_tvl_promotion/f510_summary.md', /Estado:\s*f510-live-seed-ready/i);
const manualReady = textIncludes('public/manual_usuario.html', /F510/i) && textIncludes('MANUAL_USUARIO_v99.md', /Addendum F510/i);
const updateReady = textIncludes('src/sections/dialogs/UpdateAppDialog.tsx', /F510 PET\/DX TVL exactos/i);
const distReady = fs.existsSync(path.join(distDir, 'index.html'));

if (distReady) await zipDist();

const publicUrl = process.env.PUBLIC_DEPLOY_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || '';
const evidence = evidencePaths.map((relativePath) => {
  const full = path.join(root, relativePath);
  return {
    path: relativePath,
    present: fs.existsSync(full),
    sha256: sha256File(full),
  };
});

const blockers = [
  ...(!distReady ? ['dist/index.html missing; run npm run build.'] : []),
  ...(!f508Pass ? ['F508-F509 DB-backed QA is not pass with 108 values.'] : []),
  ...(!f510Ready ? ['F510 live seed summary is not ready.'] : []),
  ...(!manualReady ? ['Manuals are not updated to F510/F511-F514.'] : []),
  ...(!updateReady ? ['Update Center does not include F510.'] : []),
  ...evidence.filter((item) => !item.present).map((item) => `Missing evidence: ${item.path}`),
];

const status = blockers.length
  ? 'beta-closure-blocked'
  : publicUrl
    ? 'beta-release-ready-with-url'
    : 'beta-package-ready-awaiting-public-url';

const checklistPath = path.join(outDir, 'f513_post_deploy_smoke_checklist.csv');
fs.writeFileSync(checklistPath, checklistRows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n', 'utf8');

const manifest = {
  schema: 'radshield-mx.beta-closure.f511-f514.v1',
  phaseRange: 'F511-F514',
  generatedAt: new Date().toISOString(),
  status,
  branch: gitValue(['branch', '--show-current'], 'unknown'),
  commit: gitValue(['rev-parse', '--short', 'HEAD'], 'unknown'),
  phases: {
    F511: f508Pass && f510Ready && manualReady && updateReady ? 'pass' : 'blocked',
    F512: distReady && fs.existsSync(zipPath) ? 'pass' : 'blocked',
    F513: publicUrl ? 'ready-for-public-smoke' : 'ready-awaiting-url',
    F514: blockers.length ? 'blocked' : 'beta-approved',
  },
  publicUrl: publicUrl || null,
  package: distReady ? { path: path.relative(root, zipPath).replaceAll('\\', '/'), sha256: sha256File(zipPath) } : null,
  evidence,
  allowedClaims: [
    'frontend beta estatico publicable',
    'DB-backed QA material pass F508-F510',
    'canvas/floorplan listo para prueba real de usuario',
    'Memoria IA preliminar con evidencia y advertencias',
    'manual y Update Center sincronizados con beta',
  ],
  blockedClaims: [
    'memoria analitica firmada',
    'calculo clinico certificado',
    'dictamen final de proteccion radiologica',
    'Unity WebGL real sin build exportado validado',
    'Babylon como renderer principal sin QA profundo',
  ],
  blockers,
  postDeployChecklist: path.relative(root, checklistPath).replaceAll('\\', '/'),
  nextPhase: 'Post-beta: prueba real de usuario, correcciones bloqueantes y renderer profundo en rama separada.',
};

fs.writeFileSync(path.join(outDir, 'f511_f514_beta_closure_manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f511_f514_beta_closure_summary.md'), [
  '# F511-F514 BETA CLOSURE',
  '',
  `Estado: ${manifest.status}`,
  `Commit: ${manifest.commit}`,
  `ZIP: ${manifest.package?.path ?? 'pendiente'}`,
  `URL publica: ${manifest.publicUrl ?? 'pendiente'}`,
  '',
  '## Fases',
  ...Object.entries(manifest.phases).map(([phase, phaseStatus]) => `- ${phase}: ${phaseStatus}`),
  '',
  '## Claims permitidos',
  ...manifest.allowedClaims.map((item) => `- ${item}`),
  '',
  '## Claims bloqueados',
  ...manifest.blockedClaims.map((item) => `- ${item}`),
  '',
  '## Bloqueos',
  ...(blockers.length ? blockers.map((item) => `- ${item}`) : ['- Ninguno.']),
  '',
  `Siguiente paso: ${manifest.nextPhase}`,
  '',
].join('\n'), 'utf8');

console.log(`F511-F514 generated. status=${status} blockers=${blockers.length}`);
if (blockers.length) process.exit(1);
