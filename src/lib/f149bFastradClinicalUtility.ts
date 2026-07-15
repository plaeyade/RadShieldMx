import { buildF149NormativeNumericQa } from './f149NormativeNumericQa';

export type F149bUtilityDomain = 'clinical' | 'normative' | 'constructive' | 'operational' | 'structural';
export type F149bPriority = 'now' | 'next' | 'later' | 'external-only';

export interface F149bFastradOpportunity {
  id: string;
  label: string;
  fastRadPattern: string;
  sourceEvidence: string;
  utilityDomains: F149bUtilityDomain[];
  priority: F149bPriority;
  radshieldAction: string;
  releaseImpact: string;
  guardrail: string;
}

export interface F149bExportSmokeSurface {
  surface: 'Memoria IA' | 'PDF Report' | 'Evidence Pack' | 'Update App';
  requiredPayload: string[];
  status: 'ready' | 'pending';
}

export interface F149bFastradClinicalUtilitySummary {
  phase: 'F149b';
  status: 'implemented-export-smoke';
  sourceUrl: string;
  sourceAccessedAt: string;
  sourceSummary: string;
  opportunities: F149bFastradOpportunity[];
  adoptedNow: string[];
  deferred: string[];
  rejectedForRadShield: string[];
  exportSmoke: {
    releaseReady: boolean;
    f149ReleaseReady: boolean;
    surfaces: F149bExportSmokeSurface[];
    missingSurfaces: string[];
  };
  decision: string;
  nextPhase: string;
}

export const F149B_FASTRAD_OPPORTUNITIES: F149bFastradOpportunity[] = [
  {
    id: 'sector-ray-tracing-critical-paths',
    label: 'Ray-tracing por sectores para rutas criticas',
    fastRadPattern: 'Sector analysis with slant/minimum path ray-tracing and critical crossed-thickness rays.',
    sourceEvidence: 'FASTRAD Modules: sector analysis can estimate quantities using isolated detectors or 2D/3D mappings and display critical rays.',
    utilityDomains: ['clinical', 'normative', 'operational'],
    priority: 'now',
    radshieldAction: 'Add a floorplan QA layer that samples rays from source to controlled-zone points and tags the limiting barrier path before report export.',
    releaseImpact: 'Improves explainability of why a wall, door, maze leg or roof point controls the analytic memory.',
    guardrail: 'Use as deterministic QA visualization; do not replace NCRP/IAEA calculation formulas without source-governed validation.',
  },
  {
    id: 'six-face-equivalent-thickness',
    label: 'Espesor equivalente por seis caras',
    fastRadPattern: 'Six faces equivalent thickness for +/-X, +/-Y and +/-Z detector directions.',
    sourceEvidence: 'FASTRAD Modules: six-face equivalent thickness dialog calculates dose-equivalent thickness in each of six directions.',
    utilityDomains: ['normative', 'constructive', 'structural'],
    priority: 'now',
    radshieldAction: 'Expose a 6-face room summary for walls, floor and ceiling: limiting direction, material stack, equivalent thickness and structural mass.',
    releaseImpact: 'Helps QA bunker/floorplan completeness and catches missing ceiling/floor checks before CNSNS-style reports.',
    guardrail: 'Equivalent thickness is a reporting abstraction; final approval must retain per-barrier method and citations.',
  },
  {
    id: 'spot-shielding-projection',
    label: 'Spot shielding sobre zonas criticas',
    fastRadPattern: 'Projection of crossed thicknesses on a box to optimize local shielding.',
    sourceEvidence: 'FASTRAD Modules: crossed-thickness rays can be projected onto a unit to build optimized spot shielding.',
    utilityDomains: ['constructive', 'operational', 'structural'],
    priority: 'next',
    radshieldAction: 'Add optional spot-shielding annotations on the canvas for doors, penetrations, ducts, wall joints and local lead/steel inserts.',
    releaseImpact: 'Useful for constructability and punch-list review, especially for penetrations and modular high-density blocks.',
    guardrail: 'Spot shielding suggestions must remain review-required until material/cost/structural evidence is attached.',
  },
  {
    id: 'depth-curve-material-comparison',
    label: 'Curvas profundidad-espesor por material',
    fastRadPattern: 'Depth curve calculations across shielding thicknesses and materials.',
    sourceEvidence: 'FASTRAD Modules: depth curve runs successive calculations by thickness and material and exports summary data.',
    utilityDomains: ['clinical', 'constructive', 'structural'],
    priority: 'next',
    radshieldAction: 'Extend material toolbox with curve outputs for dose target vs thickness/cost/weight/time for lead, concrete, barite, TM NIPOLL, Nelco and Verishield.',
    releaseImpact: 'Turns material selection into an auditable tradeoff instead of a static table.',
    guardrail: 'Vendor material curves must be labeled reviewed/unreviewed and cannot silently change TVL constants.',
  },
  {
    id: 'trajectory-and-interaction-viewer',
    label: 'Visualizador de trayectorias/dispersion',
    fastRadPattern: 'Particle trajectory visualization with interaction properties.',
    sourceEvidence: 'FASTRAD Modules: particle trajectories and interaction properties can be visualized in Forward/Reverse Monte Carlo.',
    utilityDomains: ['clinical', 'operational'],
    priority: 'later',
    radshieldAction: 'Add a non-certification educational overlay for scatter/leakage/neutron paths in the 3D medical inspection view.',
    releaseImpact: 'Improves training and design review but is not required for release candidate.',
    guardrail: 'Do not imply true Monte Carlo transport unless an external validated engine is connected.',
  },
  {
    id: 'scriptable-scenario-portfolio',
    label: 'Portafolio de escenarios scriptables',
    fastRadPattern: 'Scripting module for parameterized tasks, custom formats and repeatable execution.',
    sourceEvidence: 'FASTRAD Modules: scripting interface interacts with main entities and stores scripts in a portfolio.',
    utilityDomains: ['operational', 'normative'],
    priority: 'next',
    radshieldAction: 'Add scenario presets for LINAC, Gamma Knife, PET/CT, HDR and cyclotron with fixed inputs, citations and expected QA gates.',
    releaseImpact: 'Improves repeatability for deep-dive reviews and regression tests.',
    guardrail: 'Scripts should be declarative JSON scenarios, not arbitrary code, until permission/security review is complete.',
  },
  {
    id: 'forward-reverse-monte-carlo-engine',
    label: 'Monte Carlo forward/reverse completo',
    fastRadPattern: 'Forward and Reverse Monte Carlo particle transport with multi-threading and physics add-ons.',
    sourceEvidence: 'FASTRAD Modules: Monte Carlo transport calculates dose, flux and charge deposition using particle interactions with matter.',
    utilityDomains: ['clinical', 'normative'],
    priority: 'external-only',
    radshieldAction: 'Keep as external integration candidate through Geant4/PHITS/MCNP/validated service, not as in-browser core.',
    releaseImpact: 'High value for research-grade validation, but too large and regulated for immediate clinical release.',
    guardrail: 'Never claim clinical Monte Carlo parity unless validated engine, commissioning dataset and QA report are present.',
  },
];

const EXPORT_SMOKE_SURFACES: F149bExportSmokeSurface[] = [
  {
    surface: 'Memoria IA',
    status: 'ready',
    requiredPayload: ['F142 material evidence', 'F144 source governance', 'F146 material appendix', 'F148 memory profile', 'F149 numeric QA', 'F149b FASTRAD utility analysis'],
  },
  {
    surface: 'PDF Report',
    status: 'ready',
    requiredPayload: ['F146 material appendix', 'F149 numeric QA', 'F149b FASTRAD-informed QA notes'],
  },
  {
    surface: 'Evidence Pack',
    status: 'ready',
    requiredPayload: ['F149 numeric QA summary', 'F149b opportunities', 'release guardrails'],
  },
  {
    surface: 'Update App',
    status: 'ready',
    requiredPayload: ['F149b release state', 'adopted FASTRAD patterns', 'deferred/external-only decisions'],
  },
];

export function buildF149bFastradClinicalUtility(): F149bFastradClinicalUtilitySummary {
  const f149 = buildF149NormativeNumericQa();
  const missingSurfaces = EXPORT_SMOKE_SURFACES.filter((surface) => surface.status !== 'ready').map((surface) => surface.surface);
  const adoptedNow = F149B_FASTRAD_OPPORTUNITIES.filter((item) => item.priority === 'now').map((item) => item.label);
  const deferred = F149B_FASTRAD_OPPORTUNITIES
    .filter((item) => item.priority === 'next' || item.priority === 'later')
    .map((item) => `${item.label} (${item.priority})`);
  const rejectedForRadShield = F149B_FASTRAD_OPPORTUNITIES
    .filter((item) => item.priority === 'external-only')
    .map((item) => `${item.label}: ${item.guardrail}`);

  return {
    phase: 'F149b',
    status: 'implemented-export-smoke',
    sourceUrl: 'https://www.fastrad.net/modules/',
    sourceAccessedAt: '2026-07-15',
    sourceSummary:
      'FASTRAD modules emphasize 3D modeling, STEP/GDML exchange, sector ray-tracing, six-face equivalent thickness, 2D/3D mappings, Monte Carlo transport, depth curves and scripting. RadShield-MX should adopt the QA/UX patterns and keep true Monte Carlo as an external validated integration.',
    opportunities: F149B_FASTRAD_OPPORTUNITIES,
    adoptedNow,
    deferred,
    rejectedForRadShield,
    exportSmoke: {
      releaseReady: f149.releaseReady && missingSurfaces.length === 0,
      f149ReleaseReady: f149.releaseReady,
      surfaces: EXPORT_SMOKE_SURFACES,
      missingSurfaces,
    },
    decision:
      'Adopt FASTRAD-inspired sector QA, six-face equivalent thickness and export smoke now; defer spot shielding, material depth curves and scenario scripting to post-RC improvements; keep full Monte Carlo external.',
    nextPhase: 'F150 release candidate only after final smoke confirms Memoria IA, PDF Report, Evidence Pack and Update App carry F149/F149b evidence.',
  };
}

export function formatF149bFastradUtilityText(summary = buildF149bFastradClinicalUtility()): string {
  return [
    'F149B FASTRAD-INFORMED EXPORT SMOKE',
    `   Fuente revisada: ${summary.sourceUrl}`,
    `   Estado: ${summary.status}; releaseReady=${summary.exportSmoke.releaseReady ? 'si' : 'no'}.`,
    `   Adoptar ahora: ${summary.adoptedNow.join(' | ') || 'ninguno'}.`,
    `   Diferir: ${summary.deferred.join(' | ') || 'ninguno'}.`,
    `   Mantener externo: ${summary.rejectedForRadShield.join(' | ') || 'ninguno'}.`,
    ...summary.opportunities.map((item) => (
      `   - ${item.label}: ${item.priority.toUpperCase()} | ${item.radshieldAction} | Guardia: ${item.guardrail}`
    )),
    `   Decision: ${summary.decision}`,
  ].join('\n');
}
