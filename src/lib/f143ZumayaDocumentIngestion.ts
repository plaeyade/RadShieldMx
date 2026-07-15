export interface F143DocumentIngestionItem {
  id: string;
  source: string;
  title: string;
  standard: string;
  kind: 'normative' | 'analytic-memory' | 'vendor-planning' | 'example-memory';
  status: 'db-ready';
  pages: number;
  chunks: number;
  use: string;
}

export interface F143ZumayaDocumentIngestionSummary {
  phase: 'F143';
  status: 'implemented-document-db-ingestion';
  documents: F143DocumentIngestionItem[];
  resolvedBlockers: string[];
  remainingDocumentGaps: string[];
  nextImprovements: string[];
  decision: string;
}

export function buildF143ZumayaDocumentIngestionSummary(): F143ZumayaDocumentIngestionSummary {
  return {
    phase: 'F143',
    status: 'implemented-document-db-ingestion',
    documents: [
      {
        id: 'ncrp-144-particle-accelerators',
        source: 'f143-ncrp-144-particle-accelerators',
        title: 'Radiation Protection for Particle Accelerators',
        standard: 'NCRP-144',
        kind: 'normative',
        status: 'db-ready',
        pages: 512,
        chunks: 0,
        use: 'Cyclotron/accelerator shielding, neutron/activation and particle accelerator protection context.',
      },
      {
        id: 'hahs-gamma-knife-ma-2025',
        source: 'f143-hahs-gamma-knife-ma-2025',
        title: '2505 MA Gamma Knife HAHS Pedregal V2',
        standard: 'MEMORIA-GAMMA-KNIFE',
        kind: 'analytic-memory',
        status: 'db-ready',
        pages: 25,
        chunks: 0,
        use: 'Analytic-memory pattern for Gamma Knife shielding and evidence phrasing.',
      },
      {
        id: 'zumaya-memoria-al',
        source: 'f143-zumaya-memoria-al',
        title: 'Entregable Memoria AL Zumaya',
        standard: 'MEMORIA-LINAC',
        kind: 'analytic-memory',
        status: 'db-ready',
        pages: 19,
        chunks: 0,
        use: 'Resolved historical OCR blocker for LINAC/accelerator analytic-memory examples.',
      },
      {
        id: 'ncrp-49-structural-shielding',
        source: 'f143-ncrp-49-structural-shielding',
        title: 'NCRP 49 Structural Shielding Design',
        standard: 'NCRP-49',
        kind: 'normative',
        status: 'db-ready',
        pages: 72,
        chunks: 0,
        use: 'Historical structural shielding reference and legacy comparison source.',
      },
      {
        id: 'iaea-srs-47-radiotherapy-facilities',
        source: 'f143-iaea-srs-47-radiotherapy-facilities',
        title: 'Radiation Protection in the Design of Radiotherapy Facilities',
        standard: 'IAEA-SRS-47',
        kind: 'normative',
        status: 'db-ready',
        pages: 145,
        chunks: 0,
        use: 'Radiotherapy facility design reference and structural/radiological design support.',
      },
      {
        id: 'elekta-esprit-site-planning',
        source: 'f143-elekta-esprit-site-planning',
        title: 'Elekta Esprit LGK Site Planning Guide',
        standard: 'ELEKTA-ESPRIT',
        kind: 'vendor-planning',
        status: 'db-ready',
        pages: 112,
        chunks: 0,
        use: 'Vendor planning evidence for Gamma Knife layout, footprint, utilities and room design.',
      },
      {
        id: 'braqui-co60-example',
        source: 'f143-braqui-co60-example',
        title: 'Ejemplo Braqui con Co-60',
        standard: 'MEMORIA-BRAQUI-CO60',
        kind: 'example-memory',
        status: 'db-ready',
        pages: 5,
        chunks: 0,
        use: 'Example memory pattern for Co-60 HDR/brachytherapy workflows.',
      },
    ],
    resolvedBlockers: [
      'NCRP-144 source is now available from local ZUMAYA folder.',
      'NCRP-49 now has searchable text and can be indexed.',
      'Memoria AL Zumaya now has searchable text and can be indexed.',
    ],
    remainingDocumentGaps: [
      'F143 chunks need live DB seed report to populate exact chunk counts.',
      'If final release requires full visual fidelity, render sample pages from vendor planning guides.',
      'Deduplicate IAEA SRS-47 against prior F75/F129 source before using both as canonical normative source.',
    ],
    nextImprovements: [
      'Add citation picker for NCRP-144/NCRP-49/IAEA-SRS-47 in Memoria IA.',
      'Add Gamma Knife Esprit vendor-planning fields to equipment/layout workflow.',
      'Add source priority rules: normative first, vendor planning second, example memories third.',
      'Add duplicate-source governance for IAEA SRS-47 and NCRP-147/NCRP-151 family.',
    ],
    decision:
      'F143 adds the newly provided ZUMAYA PDFs to the DB/RAG pipeline and resolves the historical OCR/missing-source blockers for NCRP-144, NCRP-49 and Memoria AL.',
  };
}
