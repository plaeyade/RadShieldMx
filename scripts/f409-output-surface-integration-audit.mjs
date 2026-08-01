import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredMarkers = [
  ['src/lib/f409OutputSurfaceIntegration.ts', 'radshield-mx.f409.output-surface-integration.v1'],
  ['src/lib/f409OutputSurfaceIntegration.ts', 'buildF409OutputSurfaceIntegration'],
  ['src/lib/analyticMemoryEvidence.ts', 'ev-f409-output-surface-integration'],
  ['src/lib/analyticMemoryEvidence.ts', '7.4 INTEGRACION DE SALIDAS F409'],
  ['src/sections/dialogs/EvidencePackDialog.tsx', 'f409-output-surface-integration-evidence'],
  ['src/sections/dialogs/MemoriaAIWizard.tsx', '7.13 INTEGRACION F409'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f409-f408-unity-scene-surface'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F409 Output surfaces'],
  ['CHANGELOG.md', 'F409'],
  ['MANUAL_VERSIONES_v50.md', 'F409'],
  ['MANUAL_USUARIO_v99.md', 'F409'],
];

const failures = [];

for (const [relativePath, marker] of requiredMarkers) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${relativePath}: missing file`);
    continue;
  }
  const text = fs.readFileSync(fullPath, 'utf8');
  if (!text.includes(marker)) failures.push(`${relativePath}: missing marker "${marker}"`);
}

if (failures.length) {
  console.error('F409 output surface integration audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F409 output surface integration audit passed.');
