import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const qa = read('src/lib/f199OutputSmokeQa.ts');
const designer = read('src/pages/ShieldingDesigner.tsx');
const appStore = read('src/stores/appStore.ts');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');
const userManual = read('MANUAL_USUARIO_v99.md');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');

const dialogSources = {
  memoriaAI: read('src/sections/dialogs/MemoriaAIWizard.tsx'),
  pdfReport: read('src/sections/dialogs/PdfReportDialog.tsx'),
  cnsns: read('src/sections/dialogs/CNSNSDialog.tsx'),
  evidencePack: read('src/sections/dialogs/EvidencePackDialog.tsx'),
  cnsnsChecklist: read('src/sections/dialogs/CNSNSChecklistDialog.tsx'),
  regulatoryReport: read('src/sections/dialogs/RegulatoryReportDialog.tsx'),
  batchReportExporter: read('src/sections/dialogs/BatchReportExporterDialog.tsx'),
};

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

const surfaces = [
  ['memoriaAI', 'e2e-open-memoria-ai', ['memoria-evidence-snapshot', 'f125-memoria-evidence-gate', 'f146-material-report-appendix-memoria', 'f149-normative-numeric-qa-memoria', 'f149c-monte-carlo-gateway-memoria']],
  ['pdfReport', 'e2e-open-pdf-report', ['pdf-report-dialog', 'pdf-report-evidence-f76', 'f146-material-report-appendix', 'f149-f149b-pdf-export-smoke', 'f149c-monte-carlo-gateway-pdf']],
  ['cnsns', 'e2e-open-cnsns-report', ['Generar Memoria Analitica CNSNS']],
  ['evidencePack', 'e2e-open-evidence-pack', ['f93-citation-ledger-summary', 'f125-calculation-evidence-gate', 'f126-release-evidence-hardening', 'f149c-monte-carlo-gateway-evidence']],
  ['cnsnsChecklist', 'e2e-open-cnsns-checklist', ['Checklist CNSNS']],
  ['regulatoryReport', 'e2e-open-regulatory-report', ['regulatory-report-dialog', 'regulatory-report-evidence-f76']],
  ['batchReportExporter', 'e2e-open-batch-report-exporter', ['batch-report-exporter-dialog']],
];

expect('F199 module exports builder', qa.includes('buildF199OutputSmokeQa'));
expect('F199 module exports output surface matrix', qa.includes('F199_OUTPUT_SURFACES'));
expect('F199 points next to F200', qa.includes("nextPhase: 'F200'"));

for (const [dialogName, openerTestId, signals] of surfaces) {
  expect(`F199 matrix includes ${dialogName}`, qa.includes(`dialogName: '${dialogName}'`));
  expect(`F199 matrix includes opener ${openerTestId}`, qa.includes(openerTestId));
  expect(`appStore has dialog ${dialogName}`, appStore.includes(`"${dialogName}"`) || appStore.includes(`'${dialogName}'`));
  expect(`ShieldingDesigner has LazyDialog ${dialogName}`, new RegExp(`LazyDialog\\s+name="${dialogName}"`).test(designer));
  expect(`ShieldingDesigner has hidden opener ${openerTestId}`, designer.includes(`data-testid="${openerTestId}"`));
  for (const signal of signals) {
    expect(`F199 matrix includes signal ${signal}`, qa.includes(signal));
    expect(`${dialogName} source includes signal ${signal}`, dialogSources[dialogName].includes(signal));
  }
}

expect('Package exposes F199 contract', pkg.scripts?.['test:f199:outputs'] === 'node scripts/check-f199-output-smoke-contracts.mjs');
expect('Package exposes F199 browser smoke', pkg.scripts?.['test:f199:outputs-smoke'] === 'node scripts/check-f199-output-smoke.mjs');
expect('Changelog documents F199', changelog.includes('F199'));
expect('Manual versions documents F199', manual.includes('F199'));
expect('User manual documents F199', userManual.includes('F199'));
expect('Update Center documents F199', update.includes('F199 Output smoke QA'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F199 output smoke contracts failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F199 output smoke contracts passed.');
