import fs from 'node:fs';

const checks = [
  {
    file: 'src/lib/f125CalculationEvidenceGate.ts',
    tokens: [
      'buildF125CalculationEvidenceGate',
      'buildF125CalculationEvidenceSection',
      'formula',
      'standard',
      'inputs',
      'outputs',
      'citation',
      'evidence',
      'implemented-calculation-memory-evidence-gate',
    ],
  },
  {
    file: 'src/lib/analyticMemoryEvidence.ts',
    tokens: [
      'buildF125CalculationEvidenceGate',
      'buildF125CalculationEvidenceSection',
      'ev-f125-calculation-memory-evidence-gate',
      'F125 gate calculo-memoria-evidencia',
    ],
  },
  {
    file: 'src/sections/dialogs/EvidencePackDialog.tsx',
    tokens: ['buildF125CalculationEvidenceGate', 'f125-calculation-evidence-gate', 'Resultados auditables'],
  },
  {
    file: 'src/sections/dialogs/MemoriaAIWizard.tsx',
    tokens: ['buildF125CalculationEvidenceGate', 'f125-memoria-evidence-gate', 'contrato calculo-memoria-evidencia'],
  },
  {
    file: 'src/hooks/usePDFGenerator.ts',
    tokens: ['buildF125CalculationEvidenceGate', 'F125 resultados auditables'],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: ['buildF125CalculationEvidenceGate', 'f125-calculation-evidence-summary', 'F125 Calculation evidence gate'],
  },
  {
    file: 'scripts/f125-calculation-evidence-gate.mjs',
    tokens: ['f125_calculation_evidence_gate.json', 'fase_125_calculation_evidence_gate.md', 'radshield-mx.calculation-memory-evidence-gate.f125'],
  },
  {
    file: 'outputs/f125_calculation_evidence_gate.json',
    tokens: ['"phase": "F125"', 'radshield-mx.calculation-memory-evidence-gate.f125', '"nextPhase": "F126"'],
  },
  {
    file: 'outputs/fase_125_calculation_evidence_gate.md',
    tokens: ['# F125 Calculation Memory Evidence Gate', 'Required fields', 'F126 release evidence hardening'],
  },
  {
    file: 'package.json',
    tokens: ['prepare:f125:calculation-evidence', 'test:f125:calculation-evidence'],
  },
];

const failures = [];

for (const check of checks) {
  if (!fs.existsSync(check.file)) {
    failures.push(`${check.file}: missing file`);
    continue;
  }
  const text = fs.readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) failures.push(`${check.file}: missing token "${token}"`);
  }
}

if (failures.length > 0) {
  console.error('F125 calculation evidence contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F125 calculation evidence contracts OK.');
