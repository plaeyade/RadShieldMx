import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f272_external_mc_runner_gate');
fs.mkdirSync(outputDir, { recursive: true });

const engine = (id, runnerEnv, role, inputArtifacts, outputArtifacts, requiredRuntimeEvidence) => ({
  id,
  role,
  status: process.env[runnerEnv] ? 'runner-url-configured' : 'runner-contract-ready-waiting',
  runnerEnv,
  runnerUrlConfigured: Boolean(process.env[runnerEnv]),
  requiredRuntimeEvidence,
  inputArtifacts,
  outputArtifacts,
});

const manifest = {
  phase: 'F272',
  schema: 'radshield-mx.external-mc-runner.f272.v1',
  generatedAt: new Date().toISOString(),
  status: 'external-monte-carlo-runner-contract-ready',
  liveRunnerCallsExecuted: false,
  packageSchema: 'radshield-mx.external-mc-runner.f272.v1',
  engines: [
    engine(
      'gate-opengate',
      'GATE_RUNNER_URL',
      'Preferred medical NM/PET/SPECT and radiotherapy research runner.',
      ['geometry.gdml', 'materials.json', 'sources.json', 'scoring.json', 'gate.py'],
      ['dose-map.npz', 'dose.csv', 'uncertainty.json', 'run-manifest.json'],
      ['GATE/OpenGATE version', 'Geant4 version', 'physics list', 'seed', 'histories', 'actor/scoring configuration'],
    ),
    engine(
      'geant4',
      'GEANT4_RUNNER_URL',
      'General shielding/engineering transport runner for GDML and custom scoring.',
      ['geometry.gdml', 'materials.gdml', 'source.mac', 'scoring.mac'],
      ['dose.csv', 'flux.csv', 'tracks.root optional', 'run-manifest.json'],
      ['Geant4 version', 'physics list', 'cross-section/data library', 'seed', 'threads', 'histories'],
    ),
    engine(
      'egsnrc-egs-brachy',
      'EGSNRC_RUNNER_URL',
      'Photon/electron and brachytherapy specialized validation runner.',
      ['case.egsinp', 'geometry.egsgeom', 'source-model.json', 'materials.pegs4dat'],
      ['case.3ddose', 'statdose.csv', 'egsdat', 'run-manifest.json'],
      ['EGSnrc version', 'egs_brachy version where used', 'source model hash', 'transport cutoffs', 'histories'],
    ),
  ],
  commonInputs: ['floorplan geometry', 'equipment/source model', 'material map', 'controlled zones', 'scoring mesh', 'simulation objective'],
  commonOutputs: ['dose map', 'uncertainty', 'hotspot table', 'regulatory threshold comparison', 'engine manifest', 'input/output hashes'],
  clinicalControls: [
    'External MC is a verification/research adapter, not a certified clinical engine inside the static app.',
    'Every run must be reproducible by package hash, engine version, physics list/data library, seed and histories.',
    'Forward MC: source/equipment/floorplan -> dose/scoring.',
    'Reverse MC: target threshold/hotspot -> required shielding candidates, then deterministic NCRP/IAEA re-check.',
    'Signed reports require physicist/RSO review and numeric QA before clinical acceptance.',
  ],
  outputContracts: ['mc-export-package.zip', 'run-manifest.json', 'dose-import.json', 'mc-qa-summary.json'],
  releaseDecision:
    'F272 is ready for external runner integration. No MC engine is bundled in the static app and no runner call was executed.',
};

fs.writeFileSync(path.join(outputDir, 'f272_external_mc_runner_gate.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_272_external_mc_runner_gate.md'),
  [
    '# F272 External Monte Carlo Runner Gate',
    '',
    `Status: ${manifest.status}`,
    `Live runner calls: ${manifest.liveRunnerCallsExecuted ? 'yes' : 'no'}`,
    '',
    '## Engines',
    ...manifest.engines.map((engineRow) => `- ${engineRow.id}: ${engineRow.status}; inputs=${engineRow.inputArtifacts.join(', ')}`),
    '',
    '## Clinical Controls',
    ...manifest.clinicalControls.map((item) => `- ${item}`),
    '',
    `Decision: ${manifest.releaseDecision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({
  status: manifest.status,
  engineCount: manifest.engines.length,
  liveRunnerCallsExecuted: manifest.liveRunnerCallsExecuted,
}, null, 2));
