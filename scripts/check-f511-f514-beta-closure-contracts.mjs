import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const lib = read('src/lib/f511F514BetaClosure.ts');
const script = read('scripts/f511-f514-beta-closure.mjs');
const pkg = JSON.parse(read('package.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const userManual = read('MANUAL_USUARIO_v99.md');
const publicManual = read('public/manual_usuario.html');

const checks = [];
const expect = (label, ok) => checks.push({ label, ok });

expect('exports F511-F514 builder', lib.includes('buildF511F514BetaClosure'));
expect('covers all beta closure phases', ['F511', 'F512', 'F513', 'F514'].every((phase) => lib.includes(phase) && script.includes(phase)));
expect('script packages dist zip', script.includes('radshield-mx-f511-f514-beta.zip') && script.includes('JSZip'));
expect('script checks F508-F510 DB QA', script.includes('post-seed-qa-pass') && script.includes('f510-live-seed-ready'));
expect('script writes post-deploy checklist', script.includes('f513_post_deploy_smoke_checklist.csv'));
expect('script blocks certified claims', script.includes('calculo clinico certificado') && script.includes('memoria analitica firmada'));
expect('package prepare script exists', pkg.scripts['prepare:f511-f514:beta-closure'] === 'node scripts/f511-f514-beta-closure.mjs');
expect('package test script exists', pkg.scripts['test:f511-f514:beta-closure'] === 'node scripts/check-f511-f514-beta-closure-contracts.mjs');
expect('Update Center documents F511-F514', update.includes('F511-F514 beta closure'));
expect('Changelog documents F511-F514', changelog.includes('F511-F514'));
expect('Version manual documents F511-F514', versions.includes('F511-F514'));
expect('User manual documents F511-F514', userManual.includes('Addendum F511-F514'));
expect('Public manual documents F511-F514', publicManual.includes('F511-F514'));

const failed = checks.filter((check) => !check.ok);
if (failed.length) {
  console.error(`F511-F514 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F511-F514 beta closure contracts passed.');
