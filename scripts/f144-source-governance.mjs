import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f144_source_governance');
mkdirSync(outputDir, { recursive: true });

const canonicalHierarchy = [
  'Normative sources define formulas, limits, routing and minimum regulatory methodology.',
  'Local/UAQ/CNSNS criteria constrain acceptance, report wording and inspection evidence.',
  'Analytic memories define report structure, phrasing, checklist order and QA examples only.',
  'Vendor planning guides define equipment footprint, clearances, utilities and installation evidence only.',
  'Material/vendor/lab PDFs define material evidence only until reviewed into a controlled material constant.',
];

const sources = [
  {
    id: 'ncrp-151-mv-radiotherapy',
    role: 'normative',
    priority: 1,
    status: 'canonical',
    source: 'data/pdf/ncrp_151.pdf + f143-zumaya-memoria-al',
    useFor: ['LINAC formulas', 'barrier method', 'W/U/T/P/d traceability'],
  },
  {
    id: 'iaea-srs-47-radiotherapy',
    role: 'normative',
    priority: 2,
    status: 'canonical',
    source: 'f143-iaea-srs-47-radiotherapy-facilities',
    useFor: ['facility-design cross-check', 'layout/safety narrative'],
  },
  {
    id: 'ncrp-144-particle-accelerators',
    role: 'normative',
    priority: 2,
    status: 'canonical',
    source: 'f143-ncrp-144-particle-accelerators',
    useFor: ['cyclotron/accelerator route', 'neutron/activation support'],
  },
  {
    id: 'ncrp-49-legacy-shielding',
    role: 'normative',
    priority: 3,
    status: 'supporting',
    source: 'f143-ncrp-49-structural-shielding',
    useFor: ['legacy comparison', 'historical assumptions'],
  },
  {
    id: 'hahs-gamma-knife-memory',
    role: 'analytic-memory',
    priority: 4,
    status: 'example-only',
    source: 'f143-hahs-gamma-knife-ma-2025',
    useFor: ['Gamma Knife memory structure', 'checklist style'],
  },
  {
    id: 'zumaya-linac-memory',
    role: 'analytic-memory',
    priority: 4,
    status: 'example-only',
    source: 'f143-zumaya-memoria-al',
    useFor: ['LINAC memory structure', 'evidence checklist'],
  },
  {
    id: 'elekta-esprit-site-planning',
    role: 'vendor-planning',
    priority: 5,
    status: 'supporting',
    source: 'f143-elekta-esprit-site-planning',
    useFor: ['Gamma Knife footprint', 'clearances', 'utilities'],
  },
  {
    id: 'tm-nipoll-contuplex-materials',
    role: 'material-evidence',
    priority: 6,
    status: 'review-required',
    source: 'f138/f141 material RAG + F142 material evidence',
    useFor: ['TVL/density/weight evidence', 'structural load warning', 'material appendix'],
  },
];

const memoryProfiles = [
  {
    modality: 'DIAGNOSTIC',
    requiredNormativeSources: ['NCRP 147', 'IPEM 109 where applicable', 'CNSNS/UAQ local acceptance'],
    supportingSources: ['CT/PET-CT/SPECT-CT manufacturer planning evidence', 'floorplan workload/occupancy evidence'],
    calculationMethodReview: 'Diagnostic route is additive; require NCRP 147/IPEM citation and F125 evidence before final numeric conclusions.',
  },
  {
    modality: 'LINAC',
    requiredNormativeSources: ['NCRP 151', 'IAEA SRS-47 as facility-design cross-check', 'CNSNS/UAQ local acceptance'],
    supportingSources: ['Zumaya LINAC memory as example only', 'material PDFs for selected barrier material evidence'],
    calculationMethodReview: 'No automatic formula update is required now; keep F125 gate and NCRP 151 routing.',
  },
  {
    modality: 'GAMMA_KNIFE',
    requiredNormativeSources: ['NCRP 151 / Co-60 shielding route', 'IAEA SRS-47 facility-design support', 'CNSNS/UAQ local acceptance'],
    supportingSources: ['HAHS Gamma Knife memory as example only', 'Elekta Esprit guide for footprint/planning evidence'],
    calculationMethodReview: 'Keep Co-60/Gamma Knife route review-required until model/source activity and normative citation are selected.',
  },
  {
    modality: 'BRAQUI_CO60',
    requiredNormativeSources: ['NCRP 151 where applicable', 'IAEA/CNSNS local radiotherapy safety guidance'],
    supportingSources: ['Ejemplo Braqui con Co-60 as example memory'],
    calculationMethodReview: 'No method change now; require source/activity/time/distance assumptions and evidence gate.',
  },
  {
    modality: 'NUCLEAR_MEDICINE',
    requiredNormativeSources: ['AAPM TG-108', 'NCRP 147/155 where applicable', 'ICRP adult/paediatric references', 'CNSNS/UAQ local acceptance'],
    supportingSources: ['PET/SPECT planning guides', 'prior PET/radiofarmacia memories as examples only', 'RAG chunks for radionuclide/activity/time assumptions'],
    calculationMethodReview: 'NM route is additive; require TG-108/NCRP/ICRP citation and F125 trace before release-ready results.',
  },
  {
    modality: 'CYCLOTRON',
    requiredNormativeSources: ['NCRP 144', 'IAEA accelerator/facility references', 'CNSNS/UAQ local acceptance'],
    supportingSources: ['Material RAG for dense blocks if used', 'structural overlay for heavy shielding load'],
    calculationMethodReview: 'Requires accelerator-specific neutron/activation QA before release.',
  },
];

const output = {
  phase: 'F144',
  status: 'ready',
  generatedAt: new Date().toISOString(),
  canonicalHierarchy,
  sourceCount: sources.length,
  canonicalCount: sources.filter((source) => source.status === 'canonical').length,
  sources,
  memoryProfiles,
  methodologyReview: [
    'No silent calculation change was applied in F144.',
    'Current calculation methodology remains valid when F125 evidence fields are complete.',
    'DX routes to NCRP 147/IPEM; TX routes to NCRP 151; NM routes to TG-108/NCRP/ICRP; CY routes to NCRP 144/IAEA.',
    'Material constants from TM NIPOLL/CONTUPLEX remain review-required until source/page/hash/value are approved.',
  ],
  duplicatePolicy: [
    'Prefer one canonical source per standard family in the citation picker.',
    'Keep duplicate PDFs only as alternate evidence with hash/page provenance.',
    'Use F143 searchable IAEA SRS-47 as canonical until a newer validated source supersedes it.',
    'Analytic memories are never canonical normative sources.',
    'Vendor guides are canonical only for equipment planning metadata.',
  ],
  remainingImprovements: [
    'Live citation picker backed by document_chunks.',
    'Live DX/TX/NM/CY citation picker in Memoria IA.',
    'Material appendix in PDF reports.',
    'Numeric QA cases against NCRP/IAEA/UAQ exemplars.',
    'Source-dedup DB table or manifest.',
  ],
  decision:
    'F144 closes source-governance for the current RAG set and integrates DX/TX/NM/CY analytic-memory guidance into Memoria IA without changing formulas automatically.',
};

writeFileSync(path.join(outputDir, 'f144_source_governance.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(
  path.join(root, 'outputs', 'fase_144_source_governance.md'),
  [
    '# F144 Source Governance + Memoria IA Profiles',
    '',
    `Status: ${output.status}`,
    `Generated: ${output.generatedAt}`,
    `Sources governed: ${output.sourceCount}`,
    `Canonical sources: ${output.canonicalCount}`,
    '',
    '## Hierarchy',
    ...canonicalHierarchy.map((item) => `- ${item}`),
    '',
    '## Sources',
    ...sources.map((source) => `- ${source.id} [${source.role}/${source.status}]: ${source.source}; use: ${source.useFor.join(', ')}`),
    '',
    '## Memory Profiles',
    ...memoryProfiles.map((profile) => `- ${profile.modality}: normative ${profile.requiredNormativeSources.join(' + ')}; support ${profile.supportingSources.join(' + ')}; review ${profile.calculationMethodReview}`),
    '',
    '## Methodology Review',
    ...output.methodologyReview.map((item) => `- ${item}`),
    '',
    '## Remaining Improvements',
    ...output.remainingImprovements.map((item) => `- ${item}`),
    '',
    `Decision: ${output.decision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F144 source governance ${output.status}: ${output.sourceCount} sources, ${output.memoryProfiles.length} memory profiles.`);
