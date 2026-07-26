import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f291_calculation_real_case_hardening/f291_calculation_real_case_hardening.json'));
const csv = read('outputs/f291_calculation_real_case_hardening/f291_case_deviation_guardrails.csv');
const source = read('src/lib/f291CalculationRealCaseHardening.ts');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const changelog = read('CHANGELOG.md');
const pkg = JSON.parse(read('package.json'));

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F291 ready', manifest.status === 'calculation-real-case-hardening-ready');
expect('No live DB write', manifest.seedDbAutomatically === false && manifest.liveDbWritePerformed === false);
expect('Six cases retained', manifest.totalCases >= 6);
expect('Numeric QA has no fail', manifest.numericQa.fail === 0);
expect('Operator input remains explicit', manifest.operatorInputRequired >= 2);
expect('Engine guards include F192-F196', ['F192', 'F193', 'F194', 'F195', 'F196', 'F237'].every((token) => manifest.engineGuards.join(' ').includes(token)));
expect('CSV includes DX and NM hold', csv.includes('DX-CT-ROOM-001') && csv.includes('NM-PET-F18-001') && csv.includes('operator-input-required'));
expect('Source exports builder', source.includes('buildF291CalculationRealCaseHardening') && source.includes('calculation-real-case-hardening'));
expect('Update Center documents F291', update.includes('F291 Calculation real-case hardening'));
expect('Manual documents F291', manual.includes('Addendum F291'));
expect('Version manual documents F291', versions.includes('F291'));
expect('Changelog documents F291', changelog.includes('F291'));
expect('Package scripts F291', pkg.scripts?.['prepare:f291:calculation-real-case-hardening'] === 'node scripts/f291-calculation-real-case-hardening.mjs');

if (failures.length) {
  console.error('F291 calculation real-case hardening contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F291 calculation real-case hardening contracts passed.');
