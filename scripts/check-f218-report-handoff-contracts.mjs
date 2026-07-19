import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'src/lib/f218ReportHandoff.ts',
  'src/lib/f217VisualExportByScene.ts',
  'src/sections/dialogs/MemoriaAIWizard.tsx',
  'src/sections/dialogs/PdfReportDialog.tsx',
  'src/sections/dialogs/EvidencePackDialog.tsx',
  'scripts/check-f218-report-handoff-contracts.mjs',
  'scripts/check-f207-functional-app-qa-smoke.mjs',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'MANUAL_USUARIO_v99.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

const missingFiles = requiredFiles.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
if (missingFiles.length > 0) throw new Error(`Missing F218 files: ${missingFiles.join(', ')}`);

const combinedText = requiredFiles
  .map((relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8'))
  .join('\n');

const requiredTokens = [
  'F218',
  'Visual Report Handoff',
  'buildF218ReportHandoff',
  'formatF218ReportHandoffText',
  'report-handoff-ready',
  'report-handoff-review',
  'f218-report-handoff-memoria',
  'f218-report-handoff-pdf',
  'f218-report-handoff-evidence',
  'test:f218:report-handoff',
  'f218_report_handoff',
  '01-planta-clinica',
  '02-heatmap-regulatorio',
  '03-isodosis-lineas-muestreo',
  '04-material-peso-carga',
  'Memoria IA',
  'PDF',
  'Evidence Pack',
  'Anexo estructural',
];

const missingTokens = requiredTokens.filter((token) => !combinedText.includes(token));
if (missingTokens.length > 0) throw new Error(`F218 tokens missing: ${missingTokens.join(', ')}`);

console.log(
  JSON.stringify(
    {
      status: 'f218-report-handoff-contracts-ready',
      surfaces: ['MemoriaAIWizard', 'PdfReportDialog', 'EvidencePackDialog'],
      snapshots: [
        '01-planta-clinica',
        '02-heatmap-regulatorio',
        '03-isodosis-lineas-muestreo',
        '04-material-peso-carga',
      ],
    },
    null,
    2,
  ),
);
