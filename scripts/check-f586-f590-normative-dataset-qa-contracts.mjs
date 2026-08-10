import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const lib = read('src/lib/f586F590NormativeDatasetQa.ts');
const canvas = read('src/sections/CanvasArea.tsx');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const userManual = read('MANUAL_USUARIO_v99.md');
const versionManual = read('MANUAL_VERSIONES_v50.md');
const publicManual = read('public/manual_usuario.html');
const publicVersions = read('public/manual_versiones.html');
const e2e = read('e2e/f586-f590-normative-dataset-qa.spec.ts');
const pkg = JSON.parse(read('package.json'));

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

expect('builder exported', lib.includes('buildF586F590NormativeDatasetQa'));
expect('markdown formatter exported', lib.includes('formatF586F590NormativeDatasetQaMarkdown'));
expect('schema declared', lib.includes('radshield-mx.calc.normative-dataset-qa.f586-f590.v1'));
expect('phase range declared', lib.includes("phaseRange: 'F586-F590'"));
expect('F586 source phase exists', lib.includes("'F586'") && lib.includes('Fuente canonica por norma'));
expect('F587 hash/page phase exists', lib.includes("'F587'") && lib.includes('Hash y pagina'));
expect('F588 tolerance phase exists', lib.includes("'F588'") && lib.includes('Tolerancia por norma'));
expect('F589 modality matrix exists', lib.includes("'F589'") && lib.includes('Matriz modalidad-barrera'));
expect('F590 promotion gate exists', lib.includes("'F590'") && lib.includes('Gate de promocion'));
expect('document chunks required', lib.includes('requiresDocumentChunks: true'));
expect('page hash review required', lib.includes('requiresPageHashReview: true'));
expect('clinical certification blocked', lib.includes('canClaimClinicalCertification: false'));
expect('canvas panel wired', canvas.includes('f586-f590-normative-dataset-qa'));
expect('canvas gates wired', canvas.includes('f586-f590-gates'));
expect('Update Center documents F586-F590', update.includes('F586-F590 Dataset normativo QA'));
expect('package contract script exists', pkg.scripts?.['test:f586-f590:normative-dataset-qa'] === 'node scripts/check-f586-f590-normative-dataset-qa-contracts.mjs');
expect('package values script exists', pkg.scripts?.['test:f586-f590:normative-dataset-qa:values'] === 'node scripts/check-f586-f590-normative-dataset-qa-values.mjs');
expect('package e2e script exists', pkg.scripts?.['test:f586-f590:normative-dataset-qa:e2e'] === 'playwright test e2e/f586-f590-normative-dataset-qa.spec.ts --project=chromium');
expect('E2E captures screenshots', e2e.includes('00_normative_dataset_panel.png') && e2e.includes('02_normative_dataset_update_center.png'));
expect('Changelog updated', changelog.includes('F586-F590'));
expect('Manual usuario updated', userManual.includes('F586-F590'));
expect('Manual versiones updated', versionManual.includes('F586-F590'));
expect('Public manual updated', publicManual.includes('F586-F590'));
expect('Public versions updated', publicVersions.includes('F586-F590'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F586-F590 normative dataset QA contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('[F586-F590] Normative dataset QA contracts OK');
