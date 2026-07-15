import fs from 'node:fs';
import path from 'node:path';

const requiredFields = ['formula', 'standard', 'inputs', 'outputs', 'citation', 'evidence', 'status'];
const surfaces = ['MemoriaAIWizard', 'EvidencePackDialog', 'PDF report', 'UpdateAppDialog'];

const payload = {
  phase: 'F125',
  title: 'Calculation Memory Evidence Gate',
  status: 'implemented-calculation-memory-evidence-gate',
  schema: 'radshield-mx.calculation-memory-evidence-gate.f125',
  requiredFields,
  surfaces,
  qualityGate: {
    complete: 'Every result has formula, standard, inputs, outputs, citation, evidence and sample-linked QA status.',
    reviewRequired: 'Result exists but lacks linked sample-line evidence or final citation page/section.',
    missingResult: 'Barrier/result cannot be released until calculation is rerun or manually reviewed.',
  },
  nextPhase: 'F126',
};

fs.mkdirSync('outputs', { recursive: true });
fs.writeFileSync(path.join('outputs', 'f125_calculation_evidence_gate.json'), JSON.stringify(payload, null, 2));

const markdown = [
  '# F125 Calculation Memory Evidence Gate',
  '',
  'F125 closes the QA gap from F123 by requiring a traceable contract for every calculation result before analytic memory, Evidence Pack or PDF report release.',
  '',
  'Required fields:',
  '',
  ...requiredFields.map((field) => `- ${field}`),
  '',
  'Surfaces:',
  '',
  ...surfaces.map((surface) => `- ${surface}`),
  '',
  'Statuses:',
  '',
  `- complete: ${payload.qualityGate.complete}`,
  `- review-required: ${payload.qualityGate.reviewRequired}`,
  `- missing-result: ${payload.qualityGate.missingResult}`,
  '',
  'Next phase: F126 release evidence hardening.',
  '',
].join('\n');

fs.writeFileSync(path.join('outputs', 'fase_125_calculation_evidence_gate.md'), markdown);
console.log('F125 calculation evidence gate outputs written.');
