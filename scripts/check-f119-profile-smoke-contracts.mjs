import fs from 'node:fs';

const checks = [
  {
    file: 'src/lib/f119ProfileSmoke.ts',
    tokens: [
      'buildF119ProfileSmokeSummary',
      'buildF117ModalityHandoff(profile.id)',
      'F117_ACTIVE_PROFILE_KEY',
      'implemented-contract-smoke',
      'F120 should add runtime Playwright smoke',
    ],
  },
  {
    file: 'src/lib/f117ModalityHandoff.ts',
    tokens: [
      "templateId: 'cnsns-dx-ncrp147'",
      "templateId: 'cnsns-tx-ncrp151'",
      "templateId: 'cnsns-nm-tg108'",
      "templateId: 'cnsns-cy-iaea-srs47'",
      "recommendedEquipmentKeys: ['pet_ct_fdg', 'spect_tcm', 'cbct_igrt']",
      "recommendedEquipmentKeys: ['linac_6mv', 'linac_10mv', 'linac_15mv', 'gamma_knife_perfexion', 'hdr_ir192']",
      "recommendedEquipmentKeys: ['cyclotron_18mev']",
    ],
  },
  {
    file: 'scripts/f118-profile-aware-preselection.mjs',
    tokens: [
      "profileStorageKey: 'radshield:f113:active-modality-profile'",
    ],
  },
  {
    file: 'src/sections/dialogs/MemoriaAIWizard.tsx',
    tokens: [
      'f117Handoff.memoriaDefaults.reportType',
      'f117Handoff.memoriaDefaults.recommendedEquipmentKeys',
      'f118-apply-suggested-equipment',
    ],
  },
  {
    file: 'src/sections/dialogs/PdfReportDialog.tsx',
    tokens: [
      'f117Handoff.reportDefaults.templateId',
      'f118-report-template-preselection',
      'f118-apply-suggested-report-template',
    ],
  },
  {
    file: 'src/sections/dialogs/EvidencePackDialog.tsx',
    tokens: [
      'f117Handoff.evidenceDefaults.objective',
      'f117Handoff.evidenceDefaults.priorityDocuments',
      'f118-apply-evidence-objective',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF119ProfileSmokeSummary',
      'f119-profile-smoke-summary',
      'F119 Profile smoke matrix',
      'F119 Smoke por perfil',
    ],
  },
  {
    file: 'outputs/f119_profile_smoke_matrix.json',
    tokens: [
      '"phase": "F119"',
      '"storageKey": "radshield:f113:active-modality-profile"',
      '"label": "DX"',
      '"label": "TX"',
      '"label": "NM"',
      '"label": "CY"',
      '"reportTemplate": "cnsns-dx-ncrp147"',
      '"reportTemplate": "cnsns-tx-ncrp151"',
      '"reportTemplate": "cnsns-nm-tg108"',
      '"reportTemplate": "cnsns-cy-iaea-srs47"',
      '"noSilentDefaults": true',
    ],
  },
  {
    file: 'outputs/fase_119_profile_smoke_matrix.md',
    tokens: [
      '# F119 Profile Smoke Matrix',
      'DX: diagnostic-shielding',
      'TX: therapy-bunker-shielding',
      'NM: nuclear-medicine-shielding',
      'CY: cyclotron-radiofarmacia-shielding',
      'Next phase: F120',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'prepare:f119:profile-smoke',
      'test:f119:profile-smoke',
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
  console.error('F119 profile smoke contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F119 profile smoke contracts OK.');
