import fs from 'node:fs';
import path from 'node:path';

const outDir = path.join('outputs', 'f367_f370_release_integration');
fs.mkdirSync(outDir, { recursive: true });

const manifest = {
  phase: 'F367-F370',
  generatedAt: new Date().toISOString(),
  status: 'beta-release-integration-prepared',
  scope: [
    'F367 document surface integration for 3D visual evidence.',
    'F368 Unity WebGL as external viewer handoff.',
    'F369 formal external MC runner and advanced photorealism pack.',
    'F370 beta release decision with blocked claims.',
  ],
  outputs: [
    'medical_3d_visual_evidence_pack_*.json',
    'medical_3d_f367_f370_release_integration_*.json',
    'Memoria IA section F367-F370',
    'PDF Report section F367-F370',
    'Evidence Pack card F367-F370',
  ],
  externalEngines: ['GATE/OpenGATE', 'Geant4', 'EGSnrc/egs_brachy'],
  unityMode: 'external WebGL viewer by URL/handoff, not bundled in React',
  photorealism: 'Three/R3F PBR and visual evidence now; Babylon pending; Unity external optional',
  releaseDecision: 'frontend beta can be published with external runner manifests, not certified clinical MC',
  blockedClaims: [
    'Certified clinical Monte Carlo',
    'Native DWG in browser',
    'Babylon runtime active',
    'Signed shielding memory without professional review',
  ],
};

fs.writeFileSync(path.join(outDir, 'f367_f370_release_integration.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(
  path.join(outDir, 'f367_f370_release_integration.md'),
  [
    '# F367-F370 Release Integration',
    '',
    `Status: ${manifest.status}`,
    '',
    '## Scope',
    ...manifest.scope.map((item) => `- ${item}`),
    '',
    '## Outputs',
    ...manifest.outputs.map((item) => `- ${item}`),
    '',
    '## Blocked Claims',
    ...manifest.blockedClaims.map((item) => `- ${item}`),
    '',
    `Decision: ${manifest.releaseDecision}`,
    '',
  ].join('\n'),
);

console.log(`F367-F370 manifest written to ${outDir}`);
