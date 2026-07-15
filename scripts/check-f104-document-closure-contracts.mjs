import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'scripts/f104-document-closure-manifest.mjs',
    tokens: [
      'f104_document_closure_manifest.json',
      'fase_104_document_rag_ocr_menu_closure.md',
      'f102Reconciliation',
      'exactDocumentDuplicates',
      'semanticDocumentDuplicates',
      'duplicateChunkGroups',
      'menuFinalGate',
      'staged-not-final',
    ],
  },
  {
    file: 'outputs/f104_document_closure_manifest.json',
    tokens: [
      '"phase": "F104"',
      '"preparedDocuments"',
      '"preparedChunks"',
      '"liveDbSeeded"',
      '"needsOcr"',
      '"missingSources"',
      '"menuFinalGate"',
      '"staged-not-final"',
    ],
  },
  {
    file: 'outputs/fase_104_document_rag_ocr_menu_closure.md',
    tokens: [
      'F104',
      'Documentos realmente listos',
      'Pendientes OCR',
      'Menus finales',
      'Diseno -> Equipos -> Blindaje -> Verificacion -> Reportes -> Evidencia -> Integraciones',
      'DATABASE_URL',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'test:f104:document-closure',
      'prepare:f104:document-closure',
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
  console.error('F104 document closure contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F104 document closure contracts OK');
