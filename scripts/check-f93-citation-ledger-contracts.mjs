import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/evidencePack.ts',
    tokens: [
      'EvidenceCitationLedgerEntry',
      'EvidenceVerificationStatus',
      'hashEvidenceExcerpt',
      'buildEvidenceCitationLedger',
      'ledgerComplete',
      'readyForDeepDive',
    ],
  },
  {
    file: 'src/sections/dialogs/EvidencePackDialog.tsx',
    tokens: [
      'f93-citation-ledger-summary',
      'f93-citation-fields',
      'F93_DROPDOWN_MIGRATION_DECISION',
      'verificationStatuses',
      'buildEvidenceCitationLedger',
    ],
  },
  {
    file: 'src/lib/f93ReleaseSafety.ts',
    tokens: [
      'F93_DROPDOWN_MIGRATION_DECISION',
      'defer-physical-move',
      'F92_REAL_WORKFLOW',
      'Smoke de paridad',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'F93 Citation ledger + dropdown decision',
      'safe menu migration gate',
      'enabled in Evidence Pack',
    ],
  },
  {
    file: 'package.json',
    tokens: ['test:f93:citation-ledger'],
  },
  {
    file: 'outputs/fase_93_citation_ledger_dropdown_decision.md',
    tokens: [
      'Fase 93',
      'Citation ledger',
      'defer-physical-move',
      'dropdowns',
    ],
  },
];

const missing = [];
for (const check of checks) {
  const text = readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) {
      missing.push(`${check.file}: ${token}`);
    }
  }
}

if (missing.length > 0) {
  console.error('F93 citation ledger + dropdown decision contract failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F93 citation ledger + dropdown decision contract OK');

