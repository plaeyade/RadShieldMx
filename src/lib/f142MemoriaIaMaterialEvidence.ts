export interface F142MaterialCitation {
  source: string;
  title: string;
  pages: string;
  chunks: number;
  use: string;
  tvlEvidence?: string;
  densityEvidence?: string;
  weightEvidence?: string;
  uncertaintyNote?: string;
  warning?: string;
}

export interface F142MemoriaIaMaterialEvidence {
  phase: 'F142';
  status: 'implemented-memoria-material-evidence';
  citations: F142MaterialCitation[];
  requiredMemorySections: string[];
  aiInstructions: string[];
  pendingDocuments: string[];
  nextImprovements: string[];
  decision: string;
}

export function buildF142MemoriaIaMaterialEvidence(): F142MemoriaIaMaterialEvidence {
  return {
    phase: 'F142',
    status: 'implemented-memoria-material-evidence',
    citations: [
      {
        source: 'f138-bloques-hd-characterization',
        title: 'Caracterizacion de bloques HD',
        pages: 'p.1-p.23 searchable; p.24 partial',
        chunks: 29,
        use: 'Mechanical/structural characterization for high-density blocks.',
        densityEvidence: 'Use as characterization evidence; extract final density only from reviewed page/table.',
        weightEvidence: 'Use for structural load notes after page-level review.',
        uncertaintyNote: 'Keep uncertainty from source/lab method where available; otherwise mark as vendor/lab evidence pending review.',
        warning: 'Page 24 has no extracted text; keep partial-page warning.',
      },
      {
        source: 'f138-scanpro-hd-materials',
        title: 'ScanPRO high-density material scan',
        pages: 'p.1, p.3-p.9 searchable; p.2/p.10 partial',
        chunks: 12,
        use: 'Material scan/source review and vendor/lab evidence support.',
        densityEvidence: 'Use only searchable pages for density/material claims.',
        uncertaintyNote: 'Partial OCR means claims from pages 2 and 10 must be manually reviewed.',
        warning: 'Pages 2 and 10 have no extracted text; cite only searchable pages unless manually reviewed.',
      },
      {
        source: 'f138-tmnipol-tvl-2021',
        title: 'TMNIPOL reporte determinacion TVL 2021',
        pages: 'page-level chunks',
        chunks: 17,
        use: 'TVL evidence for material justification; not a certified default until reviewed.',
        tvlEvidence: 'Use as TVL evidence for TM NIPOLL/high-density material comparison.',
        densityEvidence: 'Resolve density/table context before promoting to material constants.',
        uncertaintyNote: 'Report uncertainty and measurement conditions alongside any TVL value.',
      },
      {
        source: 'f138-tmnipol-td-375-tvl-2020',
        title: 'Reporte final TVL bloques alta densidad TD-375',
        pages: 'page-level chunks',
        chunks: 18,
        use: 'TVL/density evidence and cross-check for dense block families.',
        tvlEvidence: 'Use for TD-375 TVL comparison and interpolation review.',
        densityEvidence: 'Use as supporting density evidence for high-density block family.',
        uncertaintyNote: 'Keep separate from NCRP/IAEA normative values until reviewed.',
      },
    ],
    requiredMemorySections: [
      'Material selected per barrier with density/thickness/cost/schedule/structural impact.',
      'TVL, density, weight and uncertainty table for each non-standard material.',
      'Formula, standard, inputs, outputs and citation for each calculation result.',
      'Vendor/lab evidence section separated from certified regulatory references.',
      'OCR/searchability warning where source pages remain partial.',
      'Structural review note when kg/m2, kg/ml or installation method require engineer sign-off.',
    ],
    aiInstructions: [
      'Do not promote vendor values to calculation constants without reviewed page citation.',
      'Prefer NCRP/IAEA/AAPM normative sources for formulas and use material PDFs as evidence/justification.',
      'When drafting Memoria IA, cite source/page/hash for material claims and flag partial-OCR pages.',
      'For TVL, density, weight and uncertainty, quote the source page and keep reviewed/unreviewed state visible.',
      'Tie every material recommendation to floorplan barrier ID, selected equipment, modality and dose objective.',
    ],
    pendingDocuments: [
      'No F138/F141 material PDF needs reupload for RAG use.',
      'Optional: OCR-review CARACTERIZACION page 24 and ScanPRO pages 2/10 for full page coverage.',
      'Historical document blockers remain if needed for final documentation: NCRP 49 and Memoria AL Zumaya from F75.',
    ],
    nextImprovements: [
      'Add click-through citation picker in Memoria IA.',
      'Add material-evidence chips inside MaterialComparisonDialog and selected barrier panel.',
      'Generate a material appendix in PDF reports with source/page/hash and OCR status.',
      'Add reviewed/unreviewed status for every vendor/lab material value.',
    ],
    decision:
      'F142 connects recovered material RAG evidence to Memoria IA generation while preserving regulatory hierarchy, page citations and OCR warnings.',
  };
}
