import { readFileSync } from 'node:fs';

const contract = readFileSync('src/lib/medical3D/f464F468VisualBeta.ts', 'utf8');
const dialog = readFileSync('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'utf8');

const requiredContractTokens = [
  'F464F468VisualBetaContract',
  'materialLinks',
  'syncLinks',
  'memoriaEvidence',
  'releaseGate',
  'ready-for-static-beta',
  'needs-technical-citation',
];

const requiredDialogTokens = [
  'buildF464F468VisualBetaContract',
  'handleExportF464F468BetaPack',
  'f464-f468-visual-beta',
  'f465-material-technical-links',
  'f466-canvas-3d-sync-map',
  'f467-memoria-visual-evidence',
  'f468-export-visual-beta-pack',
];

const missing = [
  ...requiredContractTokens.filter((token) => !contract.includes(token)).map((token) => `contract:${token}`),
  ...requiredDialogTokens.filter((token) => !dialog.includes(token)).map((token) => `dialog:${token}`),
];

if (missing.length) {
  console.error('F464-F468 visual beta contract check failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log(JSON.stringify({
  schema: 'radshield-mx.f464-f468.visual-beta-contract-check.v1',
  status: 'passed',
  checks: [...requiredContractTokens, ...requiredDialogTokens],
}, null, 2));
