import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'scripts/f161-manuales-in-extenso.mjs',
  'outputs/f161_manuales_in_extenso/f161_manuales_in_extenso.json',
  'outputs/f161_manuales_in_extenso/MANUAL_OPERACION_PREDEPLOY_F161.md',
  'outputs/fase_161_manuales_in_extenso.md',
  'MANUAL_USUARIO_v99.md',
  'MANUAL_VERSIONES_v50.md',
  'CHANGELOG.md',
  'package.json',
];

const tokens = [
  ['outputs/f161_manuales_in_extenso/MANUAL_OPERACION_PREDEPLOY_F161.md', 'Flujo operativo recomendado'],
  ['outputs/f161_manuales_in_extenso/MANUAL_OPERACION_PREDEPLOY_F161.md', 'Canvas y floorplan'],
  ['outputs/f161_manuales_in_extenso/MANUAL_OPERACION_PREDEPLOY_F161.md', 'Calculo y evidencia'],
  ['outputs/f161_manuales_in_extenso/MANUAL_OPERACION_PREDEPLOY_F161.md', 'RAG, documentos y OCR'],
  ['outputs/f161_manuales_in_extenso/MANUAL_OPERACION_PREDEPLOY_F161.md', 'DB y deploy'],
  ['outputs/f161_manuales_in_extenso/MANUAL_OPERACION_PREDEPLOY_F161.md', 'Update App y control de versiones'],
  ['MANUAL_USUARIO_v99.md', 'F161'],
  ['MANUAL_VERSIONES_v50.md', 'F161'],
  ['CHANGELOG.md', 'F161'],
  ['package.json', 'prepare:f161:manuales'],
  ['package.json', 'test:f161:manuales'],
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`);
}

for (const [file, token] of tokens) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing token file ${file}`);
    continue;
  }
  if (!fs.readFileSync(full, 'utf8').includes(token)) failures.push(`Missing token "${token}" in ${file}`);
}

const manifestPath = path.join(root, 'outputs', 'f161_manuales_in_extenso', 'f161_manuales_in_extenso.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F161') failures.push('F161 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.manuals-in-extenso.f161.v1') failures.push('F161 schema mismatch');
  if (manifest.status !== 'manuals-ready') failures.push('F161 manuals not ready');
  if (!manifest.manuals?.some((item) => item.includes('MANUAL_OPERACION_PREDEPLOY_F161'))) failures.push('F161 missing predeploy manual');
}

if (failures.length) {
  console.error('F161 manuals contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F161 manuals contracts OK.');
