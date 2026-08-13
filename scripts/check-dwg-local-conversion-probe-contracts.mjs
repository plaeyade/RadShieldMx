import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const probe = spawnSync(process.execPath, ['scripts/dwg-local-conversion-probe.mjs'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  shell: false,
});

if (probe.status !== 0) {
  console.error(probe.stdout);
  console.error(probe.stderr);
  process.exit(probe.status ?? 1);
}

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/dwg_local_conversion_probe/dwg_local_conversion_probe.json'));
const dialog = read('src/sections/dialogs/DXFViewerDialog.tsx');
const pkg = read('package.json');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('Probe schema present', manifest.schema === 'radshield-mx.dwg-local-conversion-probe.v1');
expect('Known status', [
  'dwg-fixture-missing',
  'dwg-signature-invalid',
  'converter-not-configured',
  'conversion-failed-or-no-dxf',
  'conversion-output-ready',
].includes(manifest.status));
expect('Input path tracked', typeof manifest.input.path === 'string' && manifest.input.path.toLowerCase().endsWith('.dwg'));
expect('Input hash tracked when fixture exists', !manifest.input.exists || /^[a-f0-9]{64}$/.test(manifest.input.sha256));
expect('Valid fixture has DWG signature', !manifest.input.exists || manifest.input.signatureValid === true);
expect('Safe route goes through DXF', manifest.safeActivation.route.includes('DXF'));
expect('Canvas next step documented', manifest.safeActivation.canvasNextStep.includes('Aplicar al canvas'));
expect('No static VITE secret route', !manifest.safeActivation.env.some((item) => item.includes('VITE_')));
expect('Package exposes prepare command', pkg.includes('prepare:dwg-local-conversion'));
expect('Package exposes test command', pkg.includes('test:dwg-local-conversion'));
expect('DXF dialog mentions local converter command', dialog.includes('DWG_CONVERTER_COMMAND'));

if (manifest.status === 'converter-not-configured') {
  expect('No live conversion when converter is not configured', manifest.conversion.liveConversionExecuted === false);
}

if (manifest.status === 'conversion-output-ready') {
  expect('At least one DXF output exists', manifest.conversion.dxfOutputs.length > 0);
  for (const output of manifest.conversion.dxfOutputs) {
    expect(`DXF hash present for ${output.fileName}`, /^[a-f0-9]{64}$/.test(output.sha256));
  }
}

if (failures.length) {
  console.error('DWG local conversion probe contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('DWG local conversion probe contracts passed.');
