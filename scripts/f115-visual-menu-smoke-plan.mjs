import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outputsDir = join(root, 'outputs');
mkdirSync(outputsDir, { recursive: true });

const plan = {
  phase: 'F115',
  generatedAt: new Date().toISOString(),
  status: 'planned-runtime-smoke',
  canonicalDropdowns: [
    'f96-migrated-design-dropdown',
    'f97-migrated-equipment-dropdown',
    'f107-migrated-shielding-dropdown',
    'f108-migrated-verification-dropdown',
    'f109-migrated-reports-dropdown',
    'f110-migrated-evidence-dropdown',
    'f116-migrated-integrations-dropdown',
  ],
  modalityProfiles: ['f113-profile-dx', 'f113-profile-tx', 'f113-profile-nm', 'f113-profile-cy'],
  dedupedLegacyZone: 'f114-deduped-legacy-menu-zone',
  expectedLegacyVisible: ['Archivo'],
  forbiddenLegacyVisible: ['Calcular', 'Fisica', 'Med. Nuclear', 'Normativa', 'Herramientas', 'Eficiencia'],
  screenshot: 'outputs/f115_visual_menu_smoke.png',
  result: 'outputs/f115_visual_menu_smoke_result.json',
};

const jsonPath = join(outputsDir, 'f115_visual_menu_smoke_plan.json');
const mdPath = join(outputsDir, 'fase_115_visual_menu_smoke.md');

const md = [
  '# F115 - Smoke visual de menus',
  '',
  '## Objetivo',
  '',
  'Validar en navegador la barra superior despues de F114/F116.',
  '',
  '## Requerido',
  '',
  ...plan.canonicalDropdowns.map((item) => `- Canonico: ${item}.`),
  ...plan.modalityProfiles.map((item) => `- Perfil: ${item}.`),
  '',
  '## Legacy visible permitido',
  '',
  ...plan.expectedLegacyVisible.map((item) => `- ${item}.`),
  '',
  '## Legacy visible prohibido',
  '',
  ...plan.forbiddenLegacyVisible.map((item) => `- ${item}.`),
  '',
].join('\n');

writeFileSync(jsonPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, `${md}\n`, 'utf8');

console.log(JSON.stringify({ ok: true, jsonPath, mdPath, status: plan.status }, null, 2));
