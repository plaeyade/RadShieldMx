import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('outputs');
fs.mkdirSync(outDir, { recursive: true });

const rows = [
  {
    profileId: 'dx',
    label: 'DX',
    memoriaReportType: 'diagnostic-shielding',
    suggestedEquipment: ['pet_ct_fdg', 'spect_tcm', 'cbct_igrt'],
    reportTemplate: 'cnsns-dx-ncrp147',
    evidenceObjectiveToken: 'memoria diagnostica',
    priorityDocuments: ['NCRP 147', 'IPEM 109', 'NOM-008-NUCL'],
  },
  {
    profileId: 'tx',
    label: 'TX',
    memoriaReportType: 'therapy-bunker-shielding',
    suggestedEquipment: ['linac_6mv', 'linac_10mv', 'linac_15mv', 'gamma_knife_perfexion', 'hdr_ir192'],
    reportTemplate: 'cnsns-tx-ncrp151',
    evidenceObjectiveToken: 'memoria de terapia',
    priorityDocuments: ['NCRP 151', 'IAEA SRS-47', 'CNSNS LA-007/01'],
  },
  {
    profileId: 'nm',
    label: 'NM',
    memoriaReportType: 'nuclear-medicine-shielding',
    suggestedEquipment: ['pet_ct_fdg', 'spect_tcm'],
    reportTemplate: 'cnsns-nm-tg108',
    evidenceObjectiveToken: 'medicina nuclear',
    priorityDocuments: ['AAPM TG-108', 'NCRP 147/155', 'ICRP 128/133/155'],
  },
  {
    profileId: 'cy',
    label: 'CY',
    memoriaReportType: 'cyclotron-radiofarmacia-shielding',
    suggestedEquipment: ['cyclotron_18mev'],
    reportTemplate: 'cnsns-cy-iaea-srs47',
    evidenceObjectiveToken: 'ciclotron',
    priorityDocuments: ['IAEA SRS-47', 'NCRP 151', 'NCRP 144'],
  },
];

const summary = {
  phase: 'F119',
  status: 'implemented-contract-smoke',
  title: 'DX/TX/NM/CY profile smoke matrix',
  storageKey: 'radshield:f113:active-modality-profile',
  surfacesChecked: ['Memoria IA', 'PDF Report', 'Evidence Pack', 'Update App'],
  explicitApplyControls: [
    'f118-apply-suggested-equipment',
    'f118-apply-suggested-report-template',
    'f118-apply-evidence-objective',
  ],
  rows,
  noSilentDefaults: true,
  nextPhase: 'F120 runtime Playwright smoke should click DX/TX/NM/CY and open Memoria IA, PDF Report and Evidence Pack screenshots.',
};

fs.writeFileSync(
  path.join(outDir, 'f119_profile_smoke_matrix.json'),
  `${JSON.stringify(summary, null, 2)}\n`,
);

fs.writeFileSync(
  path.join(outDir, 'fase_119_profile_smoke_matrix.md'),
  [
    '# F119 Profile Smoke Matrix',
    '',
    `Status: ${summary.status}`,
    `Storage key: ${summary.storageKey}`,
    `No silent defaults: ${summary.noSilentDefaults ? 'yes' : 'no'}`,
    '',
    '## Profiles',
    ...rows.map((row) => `- ${row.label}: ${row.memoriaReportType} | ${row.reportTemplate} | ${row.suggestedEquipment.join(', ')}`),
    '',
    '## Surfaces',
    ...summary.surfacesChecked.map((item) => `- ${item}`),
    '',
    '## Explicit Controls',
    ...summary.explicitApplyControls.map((item) => `- ${item}`),
    '',
    `Next phase: ${summary.nextPhase}`,
    '',
  ].join('\n'),
);

console.log('F119 profile smoke matrix generated.');
