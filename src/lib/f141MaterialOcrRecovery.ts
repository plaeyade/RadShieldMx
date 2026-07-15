export interface F141RecoveredMaterialDocument {
  id: string;
  title: string;
  source: string;
  pages: number;
  textLength: number;
  status: 'recovered-searchable' | 'partial-searchable';
  note: string;
}

export interface F141MaterialOcrRecoverySummary {
  phase: 'F141';
  status: 'ready';
  recoveredDocuments: F141RecoveredMaterialDocument[];
  dbPolicy: string[];
  canvasUxActions: string[];
  memoriaIaActions: string[];
  nextPhase: string;
  decision: string;
}

export function buildF141MaterialOcrRecoverySummary(): F141MaterialOcrRecoverySummary {
  return {
    phase: 'F141',
    status: 'ready',
    recoveredDocuments: [
      {
        id: 'bloques-hd-characterization',
        title: 'Caracterizacion de bloques HD',
        source: 'f138-bloques-hd-characterization',
        pages: 24,
        textLength: 25702,
        status: 'partial-searchable',
        note: 'Reuploaded PDF is searchable enough for material evidence; page 24 still has no extracted text.',
      },
      {
        id: 'scanpro-hd-materials',
        title: 'ScanPRO high-density material scan',
        source: 'f138-scanpro-hd-materials',
        pages: 10,
        textLength: 10711,
        status: 'partial-searchable',
        note: 'Searchable enough for RAG; two pages remain image-only and should keep a partial OCR warning.',
      },
    ],
    dbPolicy: [
      'Delete-and-replace only the f138-* material sources during material evidence refresh.',
      'Keep page_ref, hash tag and modality Materials on every recovered chunk.',
      'Treat vendor/lab values as cited evidence until reviewed before becoming calculation constants.',
    ],
    canvasUxActions: [
      'Surface material evidence confidence next to selected barrier material.',
      'Show OCR/searchable and partial-page status for material PDFs from the material toolbox and canvas side panel.',
      'Expose structural review flags for high-density blocks before final material assignment.',
    ],
    memoriaIaActions: [
      'Cite recovered material chunks by source and page when drafting material justification.',
      'Warn when density or TVL values come from extracted vendor/lab evidence requiring review.',
      'Use recovered characterization documents to support cost, constructability and structural notes while showing partial-page warnings.',
    ],
    nextPhase: 'F140 documentation suite, then F142 Memoria IA material-evidence workflow.',
    decision:
      'F141 closes the OCR blockers for the two reuploaded material PDFs and turns them into DB/RAG-ready evidence with partial-page warnings, without promoting extracted values into certified defaults.',
  };
}
