import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f117ModalityHandoff.ts',
    tokens: [
      'buildF117ModalityHandoff',
      'buildF117ImplementationSummary',
      'radshield:f113:active-modality-profile',
      'Memoria IA',
      'PDF Report',
      'Evidence Pack',
      'RAG deep dive',
    ],
  },
  {
    file: 'src/sections/dialogs/MemoriaAIWizard.tsx',
    tokens: [
      'buildF117ModalityHandoff',
      'f117-modality-handoff-memoria',
      'PERFIL ACTIVO F117',
      'Consultas RAG sugeridas',
    ],
  },
  {
    file: 'src/sections/dialogs/EvidencePackDialog.tsx',
    tokens: [
      'buildF117ModalityHandoff',
      'f117-modality-handoff-evidence',
      'ev-f117-active-modality',
      'F117 modality handoff',
    ],
  },
  {
    file: 'src/sections/dialogs/PdfReportDialog.tsx',
    tokens: [
      'buildF117ModalityHandoff',
      'f117-modality-handoff-report',
      'f117_profile_handoff',
      'Perfil documental F117',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF117ImplementationSummary',
      'f117-modality-handoff-summary',
      'F117 Modality handoff',
      'F117 Perfiles a documentos',
    ],
  },
  {
    file: 'outputs/f117_modality_handoff.json',
    tokens: [
      '"phase": "F117"',
      '"handoffTargets"',
      '"activeProfileStorage": "radshield:f113:active-modality-profile"',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'prepare:f117:modality-handoff',
      'test:f117:modality-handoff',
    ],
  },
];

const missing = [];
for (const check of checks) {
  const text = readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) missing.push(`${check.file}: ${token}`);
  }
}

if (missing.length > 0) {
  console.error('F117 modality handoff contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F117 modality handoff contracts OK');
