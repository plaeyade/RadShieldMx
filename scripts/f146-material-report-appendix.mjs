import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f146_material_report_appendix');
mkdirSync(outputDir, { recursive: true });

const output = {
  phase: 'F146',
  status: 'ready',
  generatedAt: new Date().toISOString(),
  implemented: [
    'Reusable F146 material appendix builder for floorPlan barriers and shielding layers.',
    'PDF Report preview and JSON export include F146 material appendix.',
    'Memoria IA exported text includes TVL, density, weight, cost, uncertainty, source/page/hash and warnings.',
    'Evidence Pack shows F146 material appendix summary and hashes.',
    'Update App exposes F146 status and report-section requirements.',
  ],
  requiredFields: [
    'barrierId',
    'materialCode',
    'thickness_mm',
    'TVL summary',
    'density_g_cm3',
    'weight_kg',
    'estimatedCostUSD',
    'citationSource',
    'citationPages',
    'citationHash',
    'evidenceStatus',
    'uncertaintyNote',
  ],
  policy: [
    'F146 does not silently change calculation constants.',
    'Commercial/vendor/lab material values remain review-required unless promoted through controlled review.',
    'Weights and costs are report estimates and require project quantity verification.',
    'Partial OCR warnings from F142 remain visible in report exports.',
  ],
  files: [
    'src/lib/f146MaterialReportAppendix.ts',
    'src/sections/dialogs/PdfReportDialog.tsx',
    'src/sections/dialogs/MemoriaAIWizard.tsx',
    'src/sections/dialogs/EvidencePackDialog.tsx',
    'src/sections/dialogs/UpdateAppDialog.tsx',
  ],
  decision:
    'F146 connects material evidence to report outputs so every barrier can carry TVL, density, weight, cost, uncertainty, source/page/hash and review warnings before F149 numeric QA.',
};

writeFileSync(path.join(outputDir, 'f146_material_report_appendix.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(
  path.join(root, 'outputs', 'fase_146_material_report_appendix.md'),
  [
    '# F146 Anexo De Materiales En Reportes',
    '',
    `Status: ${output.status}`,
    `Generated: ${output.generatedAt}`,
    '',
    '## Implementado',
    ...output.implemented.map((item) => `- ${item}`),
    '',
    '## Campos requeridos',
    ...output.requiredFields.map((item) => `- ${item}`),
    '',
    '## Politica',
    ...output.policy.map((item) => `- ${item}`),
    '',
    `Decision: ${output.decision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F146 material report appendix ${output.status}: ${output.requiredFields.length} required fields.`);
