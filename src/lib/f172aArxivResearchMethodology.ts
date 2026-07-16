export type F172AAdoption = 'methodology-support' | 'qa-review' | 'rag-only';

export interface F172AResearchSource {
  id: string;
  source: string;
  title: string;
  modality: 'Materials' | 'Nuclear Medicine';
  useInApp: string;
  adoption: F172AAdoption;
  calculationPolicy: string;
  reportLanguage: string;
}

export interface F172AResearchMethodology {
  phase: 'F172A';
  status: 'research-methodology-integrated';
  sources: F172AResearchSource[];
  calculationGuardrails: string[];
  materialWorkflow: string[];
  petWorkflow: string[];
  deployImpact: string;
}

export const f172aResearchSources: F172AResearchSource[] = [
  {
    id: 'arxiv-2601-10336v2',
    source: 'f172a-arxiv-2601-10336v2',
    title: 'Radiation Shielding Performance of Different Concrete Materials: A Systematic Review',
    modality: 'Materials',
    useInApp:
      'Supports material comparison, structural load review, aggregate selection and Memoria IA discussion for heavyweight concrete, boron-rich additives, UHPC and nano-engineered concretes.',
    adoption: 'methodology-support',
    calculationPolicy:
      'Do not override NCRP/IAEA/TG constants. Use as reviewed research context until a material value is tied to a controlled lab/vendor certificate.',
    reportLanguage:
      'Concrete shielding efficiency depends on density, aggregate composition, microstructure and radiation type; heavy or boron-rich additives can improve mixed-field shielding but require constructability and stability review.',
  },
  {
    id: 'arxiv-2407-12991v2',
    source: 'f172a-arxiv-2407-12991v2',
    title: 'Concrete and Lead Shielding Requirements for PET Facilities',
    modality: 'Nuclear Medicine',
    useInApp:
      'Supports PET 511 keV QA notes, wide-beam buildup awareness, lead-versus-concrete constructability and Monte Carlo validation cautions.',
    adoption: 'qa-review',
    calculationPolicy:
      'Keep AAPM TG-108 as canonical. Use this source to flag buildup/geometry review and MC-specific validation, not to certify a universal MC algorithm.',
    reportLanguage:
      'For PET 511 keV, wide-beam geometry and scatter buildup may increase measured transmission relative to narrow-beam assumptions; lead can reduce space and weight compared with thick ordinary concrete, but final design remains governed by TG-108 and local review.',
  },
];

export function buildF172AResearchMethodology(): F172AResearchMethodology {
  return {
    phase: 'F172A',
    status: 'research-methodology-integrated',
    sources: f172aResearchSources,
    calculationGuardrails: [
      'NCRP, IAEA, AAPM TG-108 and UAQ protocol remain the controlled calculation hierarchy.',
      'The arXiv papers are indexed as research evidence with hash/page traceability, not as canonical constants.',
      'Material TVL/HVL values from research papers require human review before promotion to the controlled material database.',
      'PET buildup and Monte Carlo findings are used as QA warnings unless a project-specific validated MC run is attached.',
    ],
    materialWorkflow: [
      'Use density, aggregate and microstructure findings to rank material options by shielding, structural load, cost and construction speed.',
      'Flag heavyweight concrete, barite, magnetite, hematite, ilmenite, boron-rich and UHPC options for engineering review.',
      'Route final material values through F146 material appendix with source/page/hash and uncertainty note.',
    ],
    petWorkflow: [
      'Keep TG-108 dose and TVL workflow as the primary PET calculation path.',
      'Add QA note for 511 keV wide-beam buildup when wall geometry, source distance or occupied side geometry differs from narrow-beam assumptions.',
      'Prefer external validated MC gateway for project-specific buildup if the deterministic result is close to the design limit.',
    ],
    deployImpact:
      'F172A improves methodology and RAG evidence without blocking deploy; final deploy still depends on public target access and F154-F158 rerun.',
  };
}
