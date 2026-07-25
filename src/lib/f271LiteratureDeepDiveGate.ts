export interface F271LiteratureTopic {
  id: string;
  modality: 'TX' | 'DX' | 'NM' | 'CY' | 'MATERIALS';
  query: string;
  purpose: string;
  allowedUse: string;
}

export interface F271LiteratureProvider {
  id: 'crossref' | 'semantic-scholar';
  status: 'ready-to-configure' | 'optional-key-waiting' | 'offline-contract-only';
  inputs: string[];
  outputs: string[];
  controls: string[];
}

export interface F271LiteratureDeepDiveGate {
  phase: 'F271';
  status: 'literature-deep-dive-gate-ready';
  providers: F271LiteratureProvider[];
  topics: F271LiteratureTopic[];
  guardrails: string[];
  releaseDecision: string;
}

export const F271_LITERATURE_TOPICS: F271LiteratureTopic[] = [
  {
    id: 'linac-versa-hd-15mv-secondary-neutrons',
    modality: 'TX',
    query: 'Versa HD 15 MV shielding NCRP 151 secondary barrier photoneutrons workload',
    purpose: 'Support analytic memory review for high-energy LINAC shielding and neutron warnings.',
    allowedUse: 'Evidence enrichment and reviewer checklist only; constants require normative source approval.',
  },
  {
    id: 'gamma-knife-site-planning-shielding',
    modality: 'TX',
    query: 'Leksell Gamma Knife shielding site planning Co-60 leakage maze controlled area',
    purpose: 'Enrich Gamma Knife memory profile citations and equipment-specific assumptions.',
    allowedUse: 'Bibliography/citation candidate list with manual validation.',
  },
  {
    id: 'brachy-co60-hdr-shielding',
    modality: 'TX',
    query: 'Co-60 HDR brachytherapy shielding workload occupancy controlled area',
    purpose: 'Support brachy Co-60 memory examples and source decay assumptions.',
    allowedUse: 'Evidence candidate list; not an automatic calculation source.',
  },
  {
    id: 'cyclotron-kiube-neutron-shielding',
    modality: 'CY',
    query: 'IBA Cyclone KIUBE cyclotron shielding neutron activation vault design',
    purpose: 'Support cyclotron/production lab memory review and Monte Carlo export planning.',
    allowedUse: 'Deep-dive literature map and risk checklist.',
  },
  {
    id: 'high-density-blocks-tvl-density',
    modality: 'MATERIALS',
    query: 'high density shielding blocks TVL density lead free radiotherapy vault',
    purpose: 'Support material toolbox citation review for TVL, density, weight, cost and structural load.',
    allowedUse: 'Citation candidate enrichment; supplier data must remain separately versioned.',
  },
];

export function buildF271LiteratureDeepDiveGate(hasSemanticScholarKey = false): F271LiteratureDeepDiveGate {
  return {
    phase: 'F271',
    status: 'literature-deep-dive-gate-ready',
    providers: [
      {
        id: 'crossref',
        status: 'ready-to-configure',
        inputs: ['doi', 'title-query', 'author', 'year'],
        outputs: ['doi', 'publisher', 'journal', 'issued', 'reference-count', 'bibliography-normalization'],
        controls: ['Use polite mailto/user-agent in backend.', 'Do not treat DOI metadata as clinical validation by itself.'],
      },
      {
        id: 'semantic-scholar',
        status: hasSemanticScholarKey ? 'ready-to-configure' : 'optional-key-waiting',
        inputs: ['doi', 'paper-id', 'title-query'],
        outputs: ['abstract', 'citation-count', 'references', 'influential-citations', 'fields-of-study'],
        controls: ['Rank candidates, do not auto-ingest full text.', 'Store source URL/DOI/hash and review state.'],
      },
    ],
    topics: F271_LITERATURE_TOPICS,
    guardrails: [
      'Deep dive output creates citation candidates, not signed normative truth.',
      'NCRP/IAEA/UAQ and uploaded source documents remain higher priority than web metadata.',
      'Every accepted citation must carry provider, query, DOI/URL, retrievedAt, hash and reviewer status.',
      'Calculation constants change only through a numeric QA phase and source-governance approval.',
    ],
    releaseDecision:
      'F271 prepares Crossref/Semantic Scholar research support for Memoria IA and Evidence Pack while keeping calculation methodology locked until manual QA.',
  };
}

export function summarizeF271LiteratureDeepDiveGate(): string {
  const gate = buildF271LiteratureDeepDiveGate();
  return [
    'F271 LITERATURE DEEP DIVE GATE',
    `Status: ${gate.status}`,
    `Providers: ${gate.providers.map((provider) => `${provider.id}:${provider.status}`).join(' | ')}`,
    `Topics: ${gate.topics.map((topic) => topic.id).join(' | ')}`,
    `Decision: ${gate.releaseDecision}`,
  ].join('\n');
}
