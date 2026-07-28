import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const json = (file) => JSON.parse(read(file));
const failures = [];
const expect = (label, ok) => {
  if (!ok) failures.push(label);
};

const lib = read('src/lib/f367F370ReleaseIntegration.ts');
const medical3d = read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');
const memoria = read('src/sections/dialogs/MemoriaAIWizard.tsx');
const pdf = read('src/sections/dialogs/PdfReportDialog.tsx');
const evidence = read('src/sections/dialogs/EvidencePackDialog.tsx');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const pkg = json('package.json');
const manifest = json('outputs/f367_f370_release_integration/f367_f370_release_integration.json');

expect('F367-F370 lib exposes builder and formatter', lib.includes('buildF367F370ReleaseIntegration') && lib.includes('formatF367F370ReleaseIntegrationText'));
expect('Unity formal lane present', lib.includes('unity-webgl-formal.f368.v1') && lib.includes('VITE_MEDICAL_3D_UNITY_WEBGL_URL'));
expect(
  'External engines formal lane present',
  lib.includes('buildF272ExternalMonteCarloRunnerGate') &&
    manifest.externalEngines.includes('GATE/OpenGATE') &&
    manifest.externalEngines.includes('EGSnrc/egs_brachy'),
);
expect('Photoreal advanced lane present', lib.includes('photoreal-advanced.f369.v1') && lib.includes('deferredEngine:') && lib.includes('babylon'));
expect('F370 release gate present', lib.includes('beta-release.f370.v1') && lib.includes('frontend-beta-ready-with-external-runners'));
expect('Medical 3D exports integration pack', medical3d.includes('f367-f370-medical-3d-release-integration') && medical3d.includes('handleExportF367F370Pack'));
expect('Memoria/PDF/Evidence surfaces connected', memoria.includes('f367-f370-release-integration-memoria') && pdf.includes('f367-f370-release-integration-pdf') && evidence.includes('f367-f370-release-integration-evidence'));
expect('Package scripts present', pkg.scripts?.['prepare:f367-f370:release-integration'] === 'node scripts/f367-f370-release-integration.mjs' && pkg.scripts?.['test:f367-f370:release-integration'] === 'node scripts/check-f367-f370-release-integration-contracts.mjs');
expect('Manifest generated', manifest.status === 'beta-release-integration-prepared' && manifest.externalEngines.includes('GATE/OpenGATE'));
expect('Docs and Update Center mention F367-F370', update.includes('F367-F370 Release integration') && changelog.includes('F367-F370') && versions.includes('F367-F370') && manual.includes('Addendum F367-F370'));

if (failures.length > 0) {
  console.error('F367-F370 release integration contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F367-F370 release integration contracts passed.');
