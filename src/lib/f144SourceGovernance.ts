export type F144SourceRole = 'normative' | 'analytic-memory' | 'vendor-planning' | 'material-evidence';
export type F144ReviewStatus = 'canonical' | 'supporting' | 'example-only' | 'review-required';

export interface F144CanonicalSource {
  id: string;
  source: string;
  title: string;
  role: F144SourceRole;
  priority: number;
  status: F144ReviewStatus;
  appliesTo: string[];
  useFor: string[];
  notFor: string[];
  citationPolicy: string;
}

export interface F144MemoryProfile {
  modality: 'DIAGNOSTIC' | 'LINAC' | 'GAMMA_KNIFE' | 'BRAQUI_CO60' | 'NUCLEAR_MEDICINE' | 'CYCLOTRON';
  title: string;
  requiredNormativeSources: string[];
  supportingSources: string[];
  memorySections: string[];
  aiPromptGuidance: string[];
  calculationMethodReview: string;
}

export interface F144SourceGovernance {
  phase: 'F144';
  status: 'implemented-source-governance';
  canonicalHierarchy: string[];
  sources: F144CanonicalSource[];
  memoryProfiles: F144MemoryProfile[];
  methodologyReview: string[];
  duplicatePolicy: string[];
  remainingImprovements: string[];
  releaseDecision: string;
}

export function buildF144SourceGovernance(): F144SourceGovernance {
  return {
    phase: 'F144',
    status: 'implemented-source-governance',
    canonicalHierarchy: [
      '1. Normative sources define formulas, limits, routing and minimum regulatory methodology.',
      '2. Local/UAQ/CNSNS criteria constrain acceptance, report wording and inspection evidence.',
      '3. Analytic memories define report structure, phrasing, checklist order and QA examples only.',
      '4. Vendor planning guides define equipment footprint, clearances, utilities and installation evidence only.',
      '5. Material/vendor/lab PDFs define material evidence only until reviewed into a controlled material constant.',
    ],
    sources: [
      {
        id: 'ncrp-151-mv-radiotherapy',
        source: 'data/pdf/ncrp_151.pdf + f143-zumaya-memoria-al',
        title: 'NCRP 151 / LINAC shielding governance',
        role: 'normative',
        priority: 1,
        status: 'canonical',
        appliesTo: ['LINAC', 'MV X-ray therapy', 'primary/secondary/leakage/neutron routing'],
        useFor: ['formula routing', 'barrier method', 'workload/use/occupancy traceability', 'final calculation citations'],
        notFor: ['vendor footprint', 'material vendor certification', 'copying memory values without project inputs'],
        citationPolicy: 'Every LINAC result must cite formula/section/table plus project-specific W/U/T/P/d and barrier ID.',
      },
      {
        id: 'iaea-srs-47-radiotherapy',
        source: 'f143-iaea-srs-47-radiotherapy-facilities',
        title: 'IAEA SRS-47 Radiotherapy Facilities',
        role: 'normative',
        priority: 2,
        status: 'canonical',
        appliesTo: ['radiotherapy facility design', 'layout safety', 'structural/radiological design review'],
        useFor: ['facility methodology cross-check', 'design constraints', 'safety narrative', 'quality checklist'],
        notFor: ['overriding NCRP-specific numeric formula without explicit rationale'],
        citationPolicy: 'Use as cross-check and design-support citation when floorplan/layout/safety wording is drafted.',
      },
      {
        id: 'ncrp-144-particle-accelerators',
        source: 'f143-ncrp-144-particle-accelerators',
        title: 'NCRP 144 Particle Accelerators',
        role: 'normative',
        priority: 2,
        status: 'canonical',
        appliesTo: ['cyclotron', 'particle accelerators', 'neutron/activation support'],
        useFor: ['accelerator-specific shielding logic', 'activation/neutron review', 'cyclotron memory route'],
        notFor: ['standard LINAC-only barrier constants when NCRP 151 is the direct source'],
        citationPolicy: 'Use when source energy/modality makes accelerator/neutron/activation pathway relevant.',
      },
      {
        id: 'ncrp-49-legacy-shielding',
        source: 'f143-ncrp-49-structural-shielding',
        title: 'NCRP 49 Structural Shielding Design',
        role: 'normative',
        priority: 3,
        status: 'supporting',
        appliesTo: ['legacy comparison', 'historical shielding references', 'older memory validation'],
        useFor: ['legacy cross-check', 'explain historical method differences', 'document older project assumptions'],
        notFor: ['replacing newer modality-specific NCRP reports without review'],
        citationPolicy: 'Flag as historical/supporting when newer NCRP/AAPM/IAEA guidance is available.',
      },
      {
        id: 'hahs-gamma-knife-memory',
        source: 'f143-hahs-gamma-knife-ma-2025',
        title: 'Gamma Knife HAHS Pedregal analytic memory',
        role: 'analytic-memory',
        priority: 4,
        status: 'example-only',
        appliesTo: ['Gamma Knife memory structure', 'Co-60 radiosurgery report style', 'evidence ordering'],
        useFor: ['section order', 'phrasing pattern', 'checklist completeness', 'QA examples'],
        notFor: ['normative formulas', 'generic activity/TVL constants without reviewed source'],
        citationPolicy: 'Cite only as prior memory/example; pair calculation claims with NCRP/IAEA/Elekta reviewed sources.',
      },
      {
        id: 'zumaya-linac-memory',
        source: 'f143-zumaya-memoria-al',
        title: 'Zumaya LINAC analytic memory',
        role: 'analytic-memory',
        priority: 4,
        status: 'example-only',
        appliesTo: ['LINAC memory structure', 'project input checklist', 'result presentation'],
        useFor: ['section order', 'wording template', 'evidence checklist', 'review of missing inputs'],
        notFor: ['automatic reuse of W/U/T/P/d or barrier results'],
        citationPolicy: 'Use as exemplar; every numeric result must be recomputed from current floorplan/equipment inputs.',
      },
      {
        id: 'elekta-esprit-site-planning',
        source: 'f143-elekta-esprit-site-planning',
        title: 'Elekta Esprit LGK Site Planning Guide',
        role: 'vendor-planning',
        priority: 5,
        status: 'supporting',
        appliesTo: ['Gamma Knife Esprit footprint', 'room planning', 'utilities', 'clearances', 'installation constraints'],
        useFor: ['layout validation', 'equipment footprint', 'utility/clearance evidence', 'inspection checklist'],
        notFor: ['regulatory dose limits', 'substituting formal shielding formulas'],
        citationPolicy: 'Pair with normative source; mark vendor guide values as planning evidence and verify model/version.',
      },
      {
        id: 'tm-nipoll-contuplex-materials',
        source: 'f138/f141 material RAG + F142 material evidence',
        title: 'TM NIPOLL / CONTUPLEX material evidence',
        role: 'material-evidence',
        priority: 6,
        status: 'review-required',
        appliesTo: ['alternative shielding material selection', 'TVL/density/weight/cost/schedule justification'],
        useFor: ['material appendix', 'structural load warning', 'cost/schedule comparison', 'reviewed vendor/lab evidence'],
        notFor: ['silent replacement of controlled NCRP material constants'],
        citationPolicy: 'Every TVL/density/weight value needs source/page/hash and reviewed/unreviewed state.',
      },
    ],
    memoryProfiles: [
      {
        modality: 'DIAGNOSTIC',
        title: 'Diagnostic imaging analytic memory profile',
        requiredNormativeSources: ['NCRP 147', 'IPEM 109 where applicable', 'CNSNS/UAQ local acceptance'],
        supportingSources: ['CT/PET-CT/SPECT-CT manufacturer planning evidence', 'occupancy and workload evidence from floorplan'],
        memorySections: [
          'Project and diagnostic service data',
          'Equipment modality, workload, scan protocols and room use assumptions',
          'Floorplan scale, primary/secondary barriers, control booth and adjacent occupancy',
          'NCRP 147/IPEM 109 calculation trace with scatter/leakage route where applicable',
          'Controlled/uncontrolled zone definition and public/worker design goals',
          'Evidence pack: layout capture, dose/isocontour overlay, citation ledger and reviewed assumptions',
        ],
        aiPromptGuidance: [
          'Ask for modality-specific workload, scan protocols, occupancy and distances before drafting numeric conclusions.',
          'Route CT/PET-CT/SPECT-CT evidence through diagnostic or nuclear-medicine profile depending on source/radionuclide use.',
          'Do not use therapy NCRP 151 defaults for diagnostic shielding unless explicitly justified by equipment type.',
        ],
        calculationMethodReview:
          'Additive profile for DX routing; no calculation constants are changed until NCRP 147/IPEM values are cited and approved in the evidence gate.',
      },
      {
        modality: 'LINAC',
        title: 'LINAC analytic memory profile',
        requiredNormativeSources: ['NCRP 151', 'IAEA SRS-47 as facility-design cross-check', 'CNSNS/UAQ local acceptance'],
        supportingSources: ['Zumaya LINAC memory as example only', 'material PDFs for selected barrier material evidence'],
        memorySections: [
          'Project and license data',
          'Equipment model, energy and operating workload',
          'Floorplan scale, barriers, controlled/uncontrolled zones and occupancy',
          'Primary, secondary, leakage, maze/door and neutron decision path where energy requires it',
          'Material table with TVL/density/weight/cost/schedule and structural review state',
          'Calculation trace: formula, standard, inputs, outputs, citation, QA state per barrier',
          'Evidence pack: floorplan capture, heatmap/isocontours, citation ledger and reviewed assumptions',
        ],
        aiPromptGuidance: [
          'Ask for missing W, U, T, P, distance and barrier type before drafting final results.',
          'Never reuse numeric barrier values from a prior memory; use prior memory only as structure/wording.',
          'If high-density tabiques replace concrete/lead, require material appendix and structural load note.',
        ],
        calculationMethodReview:
          'No automatic formula update is required now; keep F125 gate and NCRP 151 routing, then add reviewed material constants only after source/page/value approval.',
      },
      {
        modality: 'GAMMA_KNIFE',
        title: 'Gamma Knife analytic memory profile',
        requiredNormativeSources: ['NCRP 151 / Co-60 shielding route', 'IAEA SRS-47 facility-design support', 'CNSNS/UAQ local acceptance'],
        supportingSources: ['HAHS Gamma Knife memory as example only', 'Elekta Esprit guide for footprint/planning evidence'],
        memorySections: [
          'Project and radiosurgery service data',
          'Gamma Knife model/version, Co-60 source set and workload/activity assumptions',
          'Room footprint, manufacturer planning constraints, controlled zones and access control',
          'Barrier/door/ceiling/floor shielding method with Co-60-specific assumptions',
          'Vendor planning appendix separated from normative shielding calculation',
          'QA: source decay assumptions, occupancy, survey points and inspection checklist',
          'Evidence pack: site plan, equipment footprint, citation ledger and reviewed assumptions',
        ],
        aiPromptGuidance: [
          'Use Elekta guide for layout and installation evidence, not for regulatory dose limits.',
          'Use HAHS memory for report structure and checklist style only.',
          'Require model/version and source activity/date before finalizing shielding values.',
        ],
        calculationMethodReview:
          'Keep current Co-60/Gamma Knife route as review-required until model/source activity and normative citation are selected in the citation ledger.',
      },
      {
        modality: 'BRAQUI_CO60',
        title: 'Co-60 brachytherapy example-memory profile',
        requiredNormativeSources: ['NCRP 151 where applicable', 'IAEA/CNSNS local radiotherapy safety guidance'],
        supportingSources: ['Ejemplo Braqui con Co-60 as example memory'],
        memorySections: ['Source and afterloader data', 'Controlled area', 'Barrier calculations', 'Emergency/safety notes', 'Evidence and QA'],
        aiPromptGuidance: ['Treat the Co-60 example as format support; recompute all source/activity/time/distance assumptions.'],
        calculationMethodReview: 'No method change now; route through source/activity/time/distance assumptions and require evidence gate.',
      },
      {
        modality: 'NUCLEAR_MEDICINE',
        title: 'Nuclear medicine analytic memory profile',
        requiredNormativeSources: ['AAPM TG-108', 'NCRP 147/155 where applicable', 'ICRP adult/paediatric dosimetry references', 'CNSNS/UAQ local acceptance'],
        supportingSources: ['PET/SPECT planning guides', 'prior PET/radiofarmacia memories as examples only', 'RAG document chunks for radionuclide/activity/time assumptions'],
        memorySections: [
          'Project and nuclear medicine service data',
          'Radionuclide inventory, administered activity, uptake/scan/hot-lab times and patient flow',
          'Controlled zones, waste/decay storage, hot lab and adjacent occupancy',
          'TG-108/NCRP shielding trace with 511 keV PET or SPECT-specific assumptions',
          'Internal dosimetry references and patient/worker protection notes',
          'Evidence pack: patient route, hot areas, citations, uncertainty and reviewed assumptions',
        ],
        aiPromptGuidance: [
          'Ask for radionuclide, administered activity, uptake and occupancy before drafting results.',
          'Separate external shielding memory from internal dosimetry notes; cite ICRP/IDAC-style evidence when used.',
          'Treat prior PET/radiofarmacia memories as structure and wording, not as reusable numeric proof.',
        ],
        calculationMethodReview:
          'Additive profile for NM routing; final release still requires TG-108/NCRP/ICRP citation and F125 formula-input-output-evidence trace.',
      },
      {
        modality: 'CYCLOTRON',
        title: 'Cyclotron / particle accelerator memory profile',
        requiredNormativeSources: ['NCRP 144', 'IAEA accelerator/facility references', 'CNSNS/UAQ local acceptance'],
        supportingSources: ['Material RAG for dense blocks if used', 'structural overlay for heavy shielding load'],
        memorySections: ['Beam/target data', 'Neutron/activation route', 'Maze/door', 'Material/structure', 'Evidence and survey plan'],
        aiPromptGuidance: ['Trigger neutron/activation review before any release-ready memory for particle accelerator facilities.'],
        calculationMethodReview: 'Methodology requires accelerator-specific QA before release; do not treat as ordinary LINAC shielding.',
      },
    ],
    methodologyReview: [
      'No silent calculation change was applied in F144.',
      'Current calculation methodology remains valid as a gated workflow when F125 evidence fields are complete.',
      'Required improvement: route standards by modality before final report: LINAC -> NCRP 151, Gamma Knife/Co-60 -> NCRP 151 + IAEA facility support, Cyclotron -> NCRP 144.',
      'Required improvement: material constants from TM NIPOLL/CONTUPLEX remain review-required until source/page/hash/value are approved.',
      'Required improvement: every final memory must include formula, standard, inputs, outputs, citation, evidence and QA state per result.',
    ],
    duplicatePolicy: [
      'Prefer one canonical source per standard family in the citation picker.',
      'Keep duplicate PDFs only as alternate evidence with hash/page provenance.',
      'If two IAEA SRS-47 copies exist, choose the F143 searchable local source as canonical until a newer validated source supersedes it.',
      'Analytic memories are never canonical normative sources, even when they contain copied formulas.',
      'Vendor guides are canonical only for equipment planning metadata, not for regulatory calculation method.',
    ],
    remainingImprovements: [
      'Add live citation picker backed by document_chunks with source priority and reviewed/unreviewed state.',
      'Expose LINAC/Gamma Knife memory profile selector in Memoria IA before export.',
      'Generate material appendix in PDF report with TVL/density/weight/uncertainty/source/page/hash.',
      'Run numeric QA cases against NCRP/IAEA/UAQ exemplars before public release.',
      'Add source-dedup DB table or manifest so reingestion does not create competing canonical references.',
    ],
    releaseDecision:
      'F144 closes source-governance for the current RAG set and integrates LINAC/Gamma Knife analytic-memory guidance into Memoria IA without changing formulas automatically.',
  };
}
