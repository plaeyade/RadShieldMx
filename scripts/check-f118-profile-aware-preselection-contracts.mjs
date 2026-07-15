import fs from 'node:fs';

const checks = [
  {
    file: 'src/lib/f118ProfileAwarePreselection.ts',
    tokens: [
      'buildF118ProfileAwarePreselectionSummary',
      'f118-apply-suggested-equipment',
      'f118-apply-suggested-report-template',
      'f118-apply-evidence-objective',
    ],
  },
  {
    file: 'src/sections/dialogs/MemoriaAIWizard.tsx',
    tokens: [
      'f118SuggestedEquipmentKey',
      'f118-apply-suggested-equipment',
      'handleEquipmentSelect(f118SuggestedEquipmentKey)',
    ],
  },
  {
    file: 'src/sections/dialogs/PdfReportDialog.tsx',
    tokens: [
      'reportTemplates',
      'f118-report-template-preselection',
      'f118-apply-suggested-report-template',
      'setTemplate(f117Handoff.reportDefaults.templateId)',
    ],
  },
  {
    file: 'src/sections/dialogs/EvidencePackDialog.tsx',
    tokens: [
      'f118-apply-evidence-objective',
      'updatePack({ objective: f117Handoff.evidenceDefaults.objective })',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF118ProfileAwarePreselectionSummary',
      'f118-profile-aware-preselection',
      'F118 Profile-aware preselection',
      'F118 Preseleccion confirmada',
    ],
  },
  {
    file: 'outputs/f118_profile_aware_preselection.json',
    tokens: [
      '"phase": "F118"',
      '"noSilentDefaults": true',
      'f118-apply-suggested-equipment',
      'f118-apply-suggested-report-template',
      'f118-apply-evidence-objective',
    ],
  },
  {
    file: 'outputs/fase_118_profile_aware_preselection.md',
    tokens: [
      '# F118 Profile-aware preselection',
      'No silent defaults: yes',
      'Next phase: F119',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'prepare:f118:profile-preselection',
      'test:f118:profile-preselection',
    ],
  },
];

const failures = [];

for (const check of checks) {
  if (!fs.existsSync(check.file)) {
    failures.push(`${check.file}: missing file`);
    continue;
  }
  const text = fs.readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) {
      failures.push(`${check.file}: missing token "${token}"`);
    }
  }
}

if (failures.length > 0) {
  console.error('F118 profile-aware preselection contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F118 profile-aware preselection contracts OK.');
