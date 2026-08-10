import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

const lib = read('src/lib/f591F620GeneralImprovements.ts');
const canvas = read('src/sections/CanvasArea.tsx');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const memoria = read('src/sections/dialogs/MemoriaAIWizard.tsx');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const userManual = read('MANUAL_USUARIO_v99.md');
const versionManual = read('MANUAL_VERSIONES_v50.md');
const publicManual = read('public/manual_usuario.html');
const publicVersions = read('public/manual_versiones.html');
const e2e = read('e2e/f591-f620-general-improvements.spec.ts');

expect('builder exported', lib.includes('buildF591F620GeneralImprovements'));
expect('formatter exported', lib.includes('formatF591F620GeneralImprovementsMarkdown'));
expect('schema declared', lib.includes('radshield-mx.general-improvements.f591-f620.v1'));
expect('phase range declared', lib.includes("phaseRange: 'F591-F620'"));
expect('compact inspector default declared', lib.includes("defaultQaInspectorMode: 'compact'"));
expect('clinical certification gate false', lib.includes('clinicalCertification: false'));

expect('canvas imports builder', canvas.includes('buildF591F620GeneralImprovements'));
expect('canvas stores inspector mode', canvas.includes('radshield_canvas_qa_inspector_mode_f591'));
expect('canvas panel wired', canvas.includes('f591-f620-general-improvements'));
expect('canvas toggle wired', canvas.includes('f591-toggle-qa-inspector'));
expect('canvas guards deep QA panels', canvas.includes("f591QaInspectorMode === 'expanded'"));

expect('Update Center documents F591-F620', update.includes('F591-F620 Mejoras generales prioritarias'));
expect('Memoria IA documents F611-F615 workflow', memoria.includes('f611-f615-memoria-productive-workflow'));
expect('Memoria IA generated text includes F591-F620', memoria.includes('MEJORAS GENERALES F591-F620'));

expect('package contract script exists', pkg.scripts?.['test:f591-f620:general-improvements'] === 'node scripts/check-f591-f620-general-improvements-contracts.mjs');
expect('package values script exists', pkg.scripts?.['test:f591-f620:general-improvements:values'] === 'node scripts/check-f591-f620-general-improvements-values.mjs');
expect('package e2e script exists', pkg.scripts?.['test:f591-f620:general-improvements:e2e'] === 'playwright test e2e/f591-f620-general-improvements.spec.ts --project=chromium');

expect('Changelog updated', changelog.includes('F591-F620'));
expect('Manual usuario updated', userManual.includes('F591-F620'));
expect('Manual versiones updated', versionManual.includes('F591-F620'));
expect('Public manual updated', publicManual.includes('F591-F620'));
expect('Public versions updated', publicVersions.includes('F591-F620'));
expect('E2E screenshots declared', e2e.includes('00_general_improvements_panel.png') && e2e.includes('03_general_improvements_memoria_ia.png'));

if (failures.length) {
  console.error(`F591-F620 general improvements contract failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log('[F591-F620] General improvements contracts OK');
