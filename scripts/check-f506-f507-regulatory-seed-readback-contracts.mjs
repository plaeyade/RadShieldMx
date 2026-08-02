import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const lib = read('src/lib/f506F507RegulatorySeedReadback.ts');
const script = read('scripts/f506-f507-regulatory-seed-readback.mjs');
const pkg = JSON.parse(read('package.json'));
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const publicManual = read('public/manual_usuario.html');

const checks = [];
const expect = (label, ok) => checks.push({ label, ok });

expect('exports builder', lib.includes('buildF506F507RegulatorySeedReadback'));
expect('documents F506 readback flag', lib.includes('F506_DB_READBACK=1'));
expect('documents F507 seed flags', lib.includes('F507_SEED_LIVE=1') && lib.includes('F507_CONFIRM_APPROVED_ONLY=1'));
expect('script reads document_chunks', script.includes('FROM document_chunks') && script.includes('page_ref AS pageRef'));
expect('script writes review queue', script.includes('f506_unresolved_review_queue.csv'));
expect('script seeds only approved-reference rows', script.includes("row.reviewState === 'approved-reference'") && script.includes("row.allowedUse === 'calculation'"));
expect('script uses transaction rollback', script.includes('beginTransaction') && script.includes('rollback') && script.includes('commit'));
expect('script blocks overwrites', script.includes('already has') && script.includes('aborting to avoid overwrite'));
expect('package prepare script exists', Boolean(pkg.scripts['prepare:f506-f507:regulatory-seed-readback']));
expect('package test script exists', Boolean(pkg.scripts['test:f506-f507:regulatory-seed-readback']));
expect('Update Center documents F506/F507', update.includes('F506-F507 trazabilidad/seed regulatorio'));
expect('Changelog documents F506/F507', changelog.includes('F506-F507'));
expect('Version manual documents F506/F507', versions.includes('F506-F507'));
expect('User manual documents F506/F507', manual.includes('Addendum F506-F507'));
expect('Public manual documents F506/F507', publicManual.includes('F506-F507'));

const failed = checks.filter((check) => !check.ok);
if (failed.length) {
  console.error(`F506-F507 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F506-F507 regulatory seed readback contracts passed.');
