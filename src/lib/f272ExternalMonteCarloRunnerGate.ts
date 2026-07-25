export interface F272ExternalMonteCarloEngine {
  id: 'gate-opengate' | 'geant4' | 'egsnrc-egs-brachy';
  role: string;
  status: 'runner-url-configured' | 'runner-contract-ready-waiting';
  requiredRuntimeEvidence: string[];
  inputArtifacts: string[];
  outputArtifacts: string[];
}

export interface F272ExternalMonteCarloRunnerGate {
  phase: 'F272';
  status: 'external-monte-carlo-runner-contract-ready';
  engines: F272ExternalMonteCarloEngine[];
  packageSchema: string;
  commonInputs: string[];
  commonOutputs: string[];
  clinicalControls: string[];
  releaseDecision: string;
}

export function buildF272ExternalMonteCarloRunnerGate(configuredUrls: Record<string, boolean> = {}): F272ExternalMonteCarloRunnerGate {
  return {
    phase: 'F272',
    status: 'external-monte-carlo-runner-contract-ready',
    packageSchema: 'radshield-mx.external-mc-runner.f272.v1',
    engines: [
      {
        id: 'gate-opengate',
        role: 'Preferred medical NM/PET/SPECT and radiotherapy research runner.',
        status: configuredUrls.GATE_RUNNER_URL ? 'runner-url-configured' : 'runner-contract-ready-waiting',
        requiredRuntimeEvidence: ['GATE/OpenGATE version', 'Geant4 version', 'physics list', 'seed', 'histories', 'actor/scoring configuration'],
        inputArtifacts: ['geometry.gdml', 'materials.json', 'sources.json', 'scoring.json', 'gate.py'],
        outputArtifacts: ['dose-map.npz', 'dose.csv', 'uncertainty.json', 'run-manifest.json'],
      },
      {
        id: 'geant4',
        role: 'General shielding/engineering transport runner for GDML and custom scoring.',
        status: configuredUrls.GEANT4_RUNNER_URL ? 'runner-url-configured' : 'runner-contract-ready-waiting',
        requiredRuntimeEvidence: ['Geant4 version', 'physics list', 'cross-section/data library', 'seed', 'threads', 'histories'],
        inputArtifacts: ['geometry.gdml', 'materials.gdml', 'source.mac', 'scoring.mac'],
        outputArtifacts: ['dose.csv', 'flux.csv', 'tracks.root optional', 'run-manifest.json'],
      },
      {
        id: 'egsnrc-egs-brachy',
        role: 'Photon/electron and brachytherapy specialized validation runner.',
        status: configuredUrls.EGSNRC_RUNNER_URL ? 'runner-url-configured' : 'runner-contract-ready-waiting',
        requiredRuntimeEvidence: ['EGSnrc version', 'egs_brachy version where used', 'source model hash', 'transport cutoffs', 'histories'],
        inputArtifacts: ['case.egsinp', 'geometry.egsgeom', 'source-model.json', 'materials.pegs4dat'],
        outputArtifacts: ['case.3ddose', 'statdose.csv', 'egsdat', 'run-manifest.json'],
      },
    ],
    commonInputs: ['floorplan geometry', 'equipment/source model', 'material map', 'controlled zones', 'scoring mesh', 'simulation objective'],
    commonOutputs: ['dose map', 'uncertainty', 'hotspot table', 'regulatory threshold comparison', 'engine manifest', 'input/output hashes'],
    clinicalControls: [
      'External MC is a verification/research adapter, not a certified clinical engine inside the static app.',
      'Every run must be reproducible by package hash, engine version, physics list/data library, seed and histories.',
      'Forward MC: source/equipment/floorplan -> dose/scoring.',
      'Reverse MC: target threshold/hotspot -> required shielding candidates, then re-check with deterministic NCRP/IAEA workflow.',
      'Signed reports require physicist/RSO review and numeric QA before claiming clinical acceptance.',
    ],
    releaseDecision:
      'F272 closes the external Monte Carlo contract. Live execution waits for external runners; the frontend can export/import manifests without bundling MC engines.',
  };
}

export function summarizeF272ExternalMonteCarloRunnerGate(): string {
  const gate = buildF272ExternalMonteCarloRunnerGate();
  return [
    'F272 EXTERNAL MONTE CARLO RUNNER GATE',
    `Status: ${gate.status}`,
    `Engines: ${gate.engines.map((engine) => `${engine.id}:${engine.status}`).join(' | ')}`,
    `Schema: ${gate.packageSchema}`,
    `Decision: ${gate.releaseDecision}`,
  ].join('\n');
}
