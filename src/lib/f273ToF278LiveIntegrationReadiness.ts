export type F273ToF278PhaseId = 'F273' | 'F274' | 'F275' | 'F276' | 'F277' | 'F278';

export interface F273ToF278PhaseSummary {
  phase: F273ToF278PhaseId;
  label: string;
  status:
    | 'ready'
    | 'ready-without-live-call'
    | 'waiting-for-sdk'
    | 'waiting-for-runner'
    | 'deferred-by-operator'
    | 'review-required';
  evidence: string[];
  nextAction: string;
}

export interface F273ToF278LiveIntegrationReadiness {
  phase: 'F273-F278';
  status: 'live-integration-readiness-gate';
  phases: F273ToF278PhaseSummary[];
  safetyRules: string[];
  releaseDecision: string;
}

export function buildF273ToF278LiveIntegrationReadiness(): F273ToF278LiveIntegrationReadiness {
  return {
    phase: 'F273-F278',
    status: 'live-integration-readiness-gate',
    phases: [
      {
        phase: 'F273',
        label: 'Credential validation',
        status: 'ready',
        evidence: ['Redacted env validation', 'Google service account file check', 'APS/AWS/Crossref/Semantic/GATE presence check'],
        nextAction: 'Keep secrets in backend/operator env only; never publish .env or service account files.',
      },
      {
        phase: 'F274',
        label: 'OCR live smoke preflight',
        status: 'waiting-for-sdk',
        evidence: ['Google/AWS credentials can be present', 'Live OCR requires provider SDK/adapter and explicit document-processing approval'],
        nextAction: 'Install server-side OCR adapters, then run a non-PHI fixture before processing real analytic memories.',
      },
      {
        phase: 'F275',
        label: 'APS DWG live smoke preflight',
        status: 'ready-without-live-call',
        evidence: ['DWG fixtures available from F270', 'APS credentials expected in backend env', 'No native DWG bytes in browser'],
        nextAction: 'Run APS token/conversion smoke from backend/operator runner and feed DXF/SVG to canvas.',
      },
      {
        phase: 'F276',
        label: 'Literature live metadata preflight',
        status: 'ready-without-live-call',
        evidence: ['Crossref mailto optional', 'Semantic Scholar key optional', 'No automatic methodology update'],
        nextAction: 'Run live metadata probes only for citation candidates; accepted citations still require reviewer status.',
      },
      {
        phase: 'F277',
        label: 'Monte Carlo external runner preflight',
        status: 'waiting-for-runner',
        evidence: ['GATE/OpenGATE preferred now', 'Geant4 and EGSnrc deferred by operator request'],
        nextAction: 'Expose a GATE/OpenGATE health endpoint, then test export/import manifest before any clinical claim.',
      },
      {
        phase: 'F278',
        label: 'Integrated live QA',
        status: 'review-required',
        evidence: ['Requires F274/F275/F276/F277 outputs', 'Requires DB-backed citation review and report smoke'],
        nextAction: 'After live provider smokes, rerun build, F200, and public URL smoke before replacing the deployed dist.',
      },
    ],
    safetyRules: [
      'Do not print or commit secrets.',
      'Do not send PHI/private plans to public frontend.',
      'Cloud OCR and APS conversion require explicit live-run approval because they may cost money and transmit documents.',
      'Geant4 and EGSnrc remain deferred for this lane.',
      'External Monte Carlo is verification/research support until numeric QA and physicist/RSO review are complete.',
    ],
    releaseDecision:
      'F273-F278 can validate configuration and prepare live smokes now. Actual OCR/DWG/MC execution must run from backend/operator adapters, not from the static frontend.',
  };
}

export function summarizeF273ToF278LiveIntegrationReadiness(): string {
  const gate = buildF273ToF278LiveIntegrationReadiness();
  return [
    'F273-F278 LIVE INTEGRATION READINESS',
    `Status: ${gate.status}`,
    `Phases: ${gate.phases.map((phase) => `${phase.phase}:${phase.status}`).join(' | ')}`,
    `Decision: ${gate.releaseDecision}`,
  ].join('\n');
}
