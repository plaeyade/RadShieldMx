import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const lib = read('src/lib/f581F585ExpandedNormativeNumericQa.ts');
const canvas = read('src/sections/CanvasArea.tsx');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const userManual = read('MANUAL_USUARIO_v99.md');
const versionManual = read('MANUAL_VERSIONES_v50.md');
const publicManual = read('public/manual_usuario.html');
const publicVersions = read('public/manual_versiones.html');
const e2e = read('e2e/f581-f585-expanded-normative-qa.spec.ts');
const pkg = JSON.parse(read('package.json'));

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

expect('builder exported', lib.includes('buildF581F585ExpandedNormativeNumericQa'));
expect('markdown formatter exported', lib.includes('formatF581F585ExpandedNormativeNumericQaMarkdown'));
expect('schema declared', lib.includes('radshield-mx.calc.normative-qa.f581-f585.v1'));
expect('phase range declared', lib.includes("phaseRange: 'F581-F585'"));
expect('NCRP151 covered', lib.includes("'NCRP151'"));
expect('NCRP147 covered', lib.includes("'NCRP147'"));
expect('IAEA covered', lib.includes("'IAEA-SRS47'"));
expect('UAQ covered', lib.includes("'UAQ'"));
expect('AAPM TG108 covered', lib.includes("'AAPM-TG108'"));
expect('clinical certification blocked', lib.includes('canClaimClinicalCertification: false'));
expect('DB-backed datasets required', lib.includes('requiresDbBackedDatasets: true'));
expect('physicist review required', lib.includes('requiresPhysicistReview: true'));
expect('distance warning exists', lib.includes('distancia menor a 0.3 m'));
expect('TVL warning exists', lib.includes('TVL no versionado'));
expect('density warning exists', lib.includes('material sin densidad validada'));
expect('canvas panel wired', canvas.includes('f581-f585-expanded-normative-qa'));
expect('canvas status wired', canvas.includes('f581-f585-status'));
expect('Update Center documents F581-F585', update.includes('F581-F585 QA normativo numerico ampliado'));
expect('package contract script exists', pkg.scripts?.['test:f581-f585:normative-qa'] === 'node scripts/check-f581-f585-expanded-normative-qa-contracts.mjs');
expect('package values script exists', pkg.scripts?.['test:f581-f585:normative-qa:values'] === 'node scripts/check-f581-f585-expanded-normative-qa-values.mjs');
expect('package e2e script exists', pkg.scripts?.['test:f581-f585:normative-qa:e2e'] === 'playwright test e2e/f581-f585-expanded-normative-qa.spec.ts --project=chromium');
expect('E2E captures screenshots', e2e.includes('00_normative_numeric_qa_panel.png') && e2e.includes('02_normative_numeric_qa_event.png'));
expect('Changelog updated', changelog.includes('F581-F585'));
expect('Manual usuario updated', userManual.includes('F581-F585'));
expect('Manual versiones updated', versionManual.includes('F581-F585'));
expect('Public manual updated', publicManual.includes('F581-F585'));
expect('Public versions updated', publicVersions.includes('F581-F585'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F581-F585 expanded normative QA contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('[F581-F585] Expanded normative QA contracts OK');
