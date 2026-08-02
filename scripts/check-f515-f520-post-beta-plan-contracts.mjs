import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const lib = read('src/lib/f515F520PostBetaPlan.ts');
const script = read('scripts/f515-f520-post-beta-plan.mjs');
const pkg = JSON.parse(read('package.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const userManual = read('MANUAL_USUARIO_v99.md');
const publicManual = read('public/manual_usuario.html');

const checks = [];
const expect = (label, ok) => checks.push({ label, ok });

expect('exports F515-F520 builder', lib.includes('buildF515F520PostBetaPlan'));
expect('covers all post-beta phases', ['F515', 'F516', 'F517', 'F518', 'F519', 'F520'].every((phase) => lib.includes(phase) && script.includes(phase)));
expect('renderer/event controller is first track', lib.includes('Renderer base y eventos del canvas') && script.includes('eventControllerV2'));
expect('Babylon is gated and lazy/fallback', lib.includes('Babylon profundo real') && lib.includes('fallback') && script.includes('@babylonjs/core'));
expect('Unity exported build is not claimed without assets', lib.includes('Unity WebGL con build exportado real') && script.includes('awaiting-exported-build'));
expect('DB ENDF/XCOM/ICRU remains dataset gated', lib.includes('DB tecnica ENDF/XCOM/ICRU') && lib.includes('approved-reference'));
expect('numeric QA and RAG tracks are explicit', lib.includes('QA numerico NCRP/IAEA/UAQ') && lib.includes('Memorias reales para RAG/IA'));
expect('package prepare script exists', pkg.scripts['prepare:f515-f520:post-beta-plan'] === 'node scripts/f515-f520-post-beta-plan.mjs');
expect('package test script exists', pkg.scripts['test:f515-f520:post-beta-plan'] === 'node scripts/check-f515-f520-post-beta-plan-contracts.mjs');
expect('Update Center documents F515-F520', update.includes('F515-F520 post-beta'));
expect('Changelog documents F515-F520', changelog.includes('F515-F520'));
expect('Version manual documents F515-F520', versions.includes('F515-F520'));
expect('User manual documents F515-F520', userManual.includes('Addendum F515-F520'));
expect('Public manual documents F515-F520', publicManual.includes('F515-F520'));

const failed = checks.filter((check) => !check.ok);
if (failed.length) {
  console.error(`F515-F520 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F515-F520 post-beta plan contracts passed.');
