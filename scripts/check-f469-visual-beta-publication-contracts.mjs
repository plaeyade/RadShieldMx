import fs from 'node:fs';
import path from 'node:path';

const outDir = path.join(process.cwd(), 'outputs', 'f469_visual_beta_publication_close');
const manifestPath = path.join(outDir, 'f469_visual_beta_publication_close.json');
const zipPath = path.join(outDir, 'radshield-mx-f469-visual-beta-publicable.zip');
const checklistPath = path.join(outDir, 'f469_post_deploy_checklist.csv');
const backlogPath = path.join(outDir, 'f469_post_beta_backlog.md');

const failures = [];
for (const file of [manifestPath, zipPath, checklistPath, backlogPath]) {
  if (!fs.existsSync(file)) failures.push(`missing ${file}`);
}

if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.status !== 'visual-beta-publicable') failures.push(`unexpected status ${manifest.status}`);
  for (const token of ['frontend estatico publicable', 'Babylon runtime/parity card validada', 'Unity handoff listo para build externo']) {
    if (!manifest.allowedClaims?.includes(token)) failures.push(`missing allowed claim ${token}`);
  }
  for (const token of ['calculo clinico certificado', 'DB regulatoria/materiales completa y versionada']) {
    if (!manifest.blockedClaims?.includes(token)) failures.push(`missing blocked claim ${token}`);
  }
}

if (fs.existsSync(zipPath) && fs.statSync(zipPath).size < 100_000) failures.push('zip package is unexpectedly small');

if (failures.length) {
  console.error('F469 visual beta publication check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(JSON.stringify({
  schema: 'radshield-mx.f469.visual-beta-publication-check.v1',
  status: 'passed',
  manifest: manifestPath,
  zip: zipPath,
  checklist: checklistPath,
  backlog: backlogPath,
}, null, 2));
