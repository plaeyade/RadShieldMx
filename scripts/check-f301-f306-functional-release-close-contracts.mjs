import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const manifest = JSON.parse(read('outputs/f301_f306_functional_release_close/f301_f306_functional_release_close.json'));
const preview = read('outputs/f301_f306_functional_release_close/external_engines_3d_process_preview.html');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');

const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };

expect('F301-F306 ready', manifest.status === 'functional-release-close-ready');
expect('No blockers', Array.isArray(manifest.blockers) && manifest.blockers.length === 0);
expect('All phases present', ['F301', 'F302', 'F303', 'F304', 'F305', 'F306'].every((phase) => JSON.stringify(manifest.phases).includes(phase)));
expect('3D options documented', ['React Three Fiber / Three.js', 'Babylon.js + WebGPU/WebXR', 'Unity WebGL', 'Unreal Pixel Streaming'].every((token) => JSON.stringify(manifest.realistic3dOptions).includes(token)));
expect('External motor flow documented', ['1 Floorplan', '2 Materials', '3 Case Pack', '4 Runner', '5 Results', '6 Evidence'].every((token) => JSON.stringify(manifest.externalMotorFlow).includes(token)));
expect('Preview includes process and 3D', preview.includes('Proceso grafico de motores externos') && preview.includes('Inspeccion 3D realista') && preview.includes('Three.js primary'));
expect('Docs updated', changelog.includes('F301-F306') && versions.includes('F301-F306') && manual.includes('Addendum F301-F306') && update.includes('F301-F306 Functional release close'));
expect('Package scripts F301-F306', pkg.scripts?.['prepare:f301-f306:functional-release-close'] === 'node scripts/f301-f306-functional-release-close.mjs' && pkg.scripts?.['test:f301-f306:functional-release-close'] === 'node scripts/check-f301-f306-functional-release-close-contracts.mjs');

if (failures.length) {
  console.error('F301-F306 contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F301-F306 functional release close contracts passed.');
