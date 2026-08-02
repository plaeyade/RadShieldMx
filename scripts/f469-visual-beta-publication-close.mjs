import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import JSZip from 'jszip';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const screenshotsDir = path.join(root, 'outputs', 'f464_f468_visual_beta');
const outDir = path.join(root, 'outputs', 'f469_visual_beta_publication_close');
const zipPath = path.join(outDir, 'radshield-mx-f469-visual-beta-publicable.zip');
const manifestPath = path.join(outDir, 'f469_visual_beta_publication_close.json');
const checklistPath = path.join(outDir, 'f469_post_deploy_checklist.csv');
const backlogPath = path.join(outDir, 'f469_post_beta_backlog.md');
const reportPath = path.join(outDir, 'README_F469_VISUAL_BETA_PUBLICABLE.md');

function gitValue(args, fallback) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function walkFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function csvCell(value) {
  return JSON.stringify(String(value ?? ''));
}

async function zipDirectory(sourceDir, destination) {
  const zip = new JSZip();
  for (const file of walkFiles(sourceDir)) {
    zip.file(path.relative(sourceDir, file).replaceAll('\\', '/'), fs.readFileSync(file));
  }
  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  fs.writeFileSync(destination, content);
}

if (!fs.existsSync(distDir)) {
  throw new Error('dist/ is missing. Run npm run build before F469 publication close.');
}

fs.mkdirSync(outDir, { recursive: true });

const commit = gitValue(['rev-parse', '--short', 'HEAD'], 'unknown');
const branch = gitValue(['branch', '--show-current'], 'unknown');
const distFiles = walkFiles(distDir);
const screenshotFiles = fs.existsSync(screenshotsDir)
  ? walkFiles(screenshotsDir).filter((file) => /\.(png|json)$/i.test(file))
  : [];

await zipDirectory(distDir, zipPath);

const postDeployChecklist = [
  ['open-url', 'Abrir URL publica', 'required', 'Confirmar que no hay pantalla blanca ni assets mezclados por cache.'],
  ['canvas-visible', 'Canvas y sidebar visibles', 'required', 'Confirmar topbar, menu Archivo alineado, sidebar estable y canvas renderizado.'],
  ['medical-3d-open', 'Abrir Medical 3D', 'required', 'Confirmar F464-F468 RC visual beta visible.'],
  ['babylon-card', 'Babylon parity/runtime card', 'required', 'Confirmar estado ready/loading y preview no bloqueante.'],
  ['wasd-photoreal', 'Preset recorrido fotoreal WASD', 'required', 'Activar preset y confirmar guia WASD ON.'],
  ['pbr-db', 'Actualizar/exportar DB PBR', 'required', 'Actualizar TM/NIPOLL y exportar JSON visual.'],
  ['material-links', 'F465 materiales vinculados', 'required', 'Ver kg/m2, densidad y espesor por barrera.'],
  ['canvas-3d-sync', 'F466 sync canvas/3D', 'required', 'Ver targets barrier/source/region.'],
  ['memoria-visual', 'F467 Memoria IA visual', 'required', 'Ver secciones y disclaimers.'],
  ['export-beta-pack', 'Export F464-F468 beta', 'required', 'Descargar JSON del gate visual.'],
  ['blocked-claims', 'Claims bloqueados', 'required', 'No presentar como calculo clinico certificado ni DB regulatoria completa.'],
];

fs.writeFileSync(
  checklistPath,
  postDeployChecklist.map((row) => row.map(csvCell).join(',')).join('\n') + '\n',
  'utf8',
);

const postBetaBacklog = [
  '# F469 Post-Beta Backlog Priorizado',
  '',
  '## P0 - Babylon profundo',
  '- Reemplazar parity card por escena Babylon interactiva con picking, orbit/walk controls, materiales PBR reales, overlays de barrera/equipo/zona y export PNG.',
  '- Mantener Three/R3F como fallback estable hasta que Babylon pase E2E de canvas, menus, WASD y export.',
  '',
  '## P0 - Unity WebGL real',
  '- Integrar carpeta exportada de Unity WebGL solo cuando exista build real con `index.html`, `Build/*.data`, `Build/*.wasm`, `Build/*.framework.js` y `Build/*.loader.js`.',
  '- Consumir `medical_3d_unity_handoff_*.json`; Unity no debe escribir calculos firmables.',
  '',
  '## P1 - Fotorrealismo avanzado',
  '- Texturas reales versionadas, HDRI local, decals de acabados/puertas/MEP, cutaway cinematografico y presets de render para memoria.',
  '- Separar evidencia visual de evidencia tecnica: PBR no sustituye TVL, densidad validada ni hash documental.',
  '',
  '## P1 - Motor calculo QA',
  '- Casos numericos NCRP/IAEA/UAQ por DX, TX, NM, CY: LINAC 6/15 MV, CT/RX, Gamma Knife, PET/NM y ciclotron.',
  '- Comparar metodo base vs conservador y bloquear memoria firmable si falta formula, norma, inputs, outputs, advertencias o citas.',
  '',
  '## P1 - DB regulatoria/materiales',
  '- Migrar de DB PBR visual a DB tecnica versionada con TVL/HVL, densidad, incertidumbre, costo, carga estructural, proveedor, pagina, hash y vigencia.',
  '- Requiere seed live/restore probe y deduplicacion RAG antes de claims regulatorios fuertes.',
  '',
].join('\n');
fs.writeFileSync(backlogPath, postBetaBacklog, 'utf8');

const manifest = {
  schema: 'radshield-mx.visual-beta-publication-close.f469.v1',
  status: 'visual-beta-publicable',
  generatedAt: new Date().toISOString(),
  branch,
  commit,
  dist: {
    path: distDir,
    fileCount: distFiles.length,
    indexSha256: sha256File(path.join(distDir, 'index.html')),
  },
  package: {
    path: zipPath,
    sha256: sha256File(zipPath),
    format: 'static-spa-dist-zip',
    hostingTargets: ['Vercel static upload', 'Netlify static upload', 'nginx/static file server'],
  },
  evidence: {
    screenshotsDir,
    screenshots: screenshotFiles.map((file) => path.relative(root, file).replaceAll('\\', '/')),
  },
  commandsRequiredBeforePublish: [
    'npm run prepare:f464-f468:visual-beta',
    'npm run test:f464-f468:visual-beta',
    'npm run build',
    'npm run test:f464-f468:visual-beta:e2e',
    'npm run prepare:f469:visual-beta-publication',
    'npm run test:f469:visual-beta-publication',
  ],
  allowedClaims: [
    'frontend estatico publicable',
    'Medical 3D beta visual con Three/R3F',
    'Babylon runtime/parity card validada',
    'Unity handoff listo para build externo',
    'PBR DB visual actualizable/exportable',
    'evidencia visual para Memoria IA/PDF/Evidence Pack',
  ],
  blockedClaims: [
    'calculo clinico certificado',
    'Unity WebGL embebido real sin build exportado',
    'Babylon como renderer principal profundo',
    'DB regulatoria/materiales completa y versionada',
    'memoria analitica firmable sin QA numerico y revision profesional',
  ],
  postDeployChecklist: checklistPath,
  postBetaBacklog: backlogPath,
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  reportPath,
  [
    '# F469 Visual Beta Publicable',
    '',
    `Status: ${manifest.status}`,
    `Commit: ${commit}`,
    `Branch: ${branch}`,
    `ZIP: ${zipPath}`,
    `SHA256: ${manifest.package.sha256}`,
    '',
    '## Allowed Claims',
    ...manifest.allowedClaims.map((item) => `- ${item}`),
    '',
    '## Blocked Claims',
    ...manifest.blockedClaims.map((item) => `- ${item}`),
    '',
    '## Publish',
    'Subir el contenido de `dist/` o el ZIP a Vercel/Netlify como frontend estatico. Despues repetir `f469_post_deploy_checklist.csv` contra la URL publica.',
    '',
    '## Next',
    'Despues de publicar beta visual: Babylon profundo, Unity WebGL real, fotorrealismo avanzado, Motor calculo QA y DB regulatoria/materiales.',
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F469 visual beta publication package: ${zipPath}`);
