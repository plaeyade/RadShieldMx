import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f271_literature_deep_dive_gate');
fs.mkdirSync(outputDir, { recursive: true });

const topics = [
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

const manifest = {
  phase: 'F271',
  schema: 'radshield-mx.literature-deep-dive-gate.f271.v1',
  generatedAt: new Date().toISOString(),
  status: 'literature-deep-dive-gate-ready',
  liveQueriesExecuted: false,
  providers: [
    {
      id: 'crossref',
      status: 'ready-to-configure',
      requiredSecrets: [],
      recommendedEnv: ['CROSSREF_MAILTO optional'],
      inputs: ['doi', 'title-query', 'author', 'year'],
      outputs: ['doi', 'publisher', 'journal', 'issued', 'reference-count', 'bibliography-normalization'],
    },
    {
      id: 'semantic-scholar',
      status: process.env.SEMANTIC_SCHOLAR_API_KEY ? 'ready-to-configure' : 'optional-key-waiting',
      requiredSecrets: ['SEMANTIC_SCHOLAR_API_KEY optional'],
      inputs: ['doi', 'paper-id', 'title-query'],
      outputs: ['abstract', 'citation-count', 'references', 'influential-citations', 'fields-of-study'],
    },
  ],
  topics,
  guardrails: [
    'Deep-dive output creates citation candidates, not signed normative truth.',
    'NCRP/IAEA/UAQ and uploaded source documents remain higher priority than web metadata.',
    'Accepted citations require provider, query, DOI/URL, retrievedAt, hash and reviewer status.',
    'Calculation constants change only through numeric QA and source-governance approval.',
  ],
  outputContracts: ['literature-candidates.json', 'citation-ranking.json', 'evidence-review-queue.json'],
  releaseDecision:
    'F271 is ready for credentialed/polite metadata search. No live web query was executed during this local release gate.',
};

fs.writeFileSync(path.join(outputDir, 'f271_literature_deep_dive_gate.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_271_literature_deep_dive_gate.md'),
  [
    '# F271 Literature Deep Dive Gate',
    '',
    `Status: ${manifest.status}`,
    `Live queries: ${manifest.liveQueriesExecuted ? 'yes' : 'no'}`,
    '',
    '## Topics',
    ...topics.map((topic) => `- ${topic.id} [${topic.modality}]: ${topic.query}`),
    '',
    '## Providers',
    ...manifest.providers.map((provider) => `- ${provider.id}: ${provider.status}`),
    '',
    '## Guardrails',
    ...manifest.guardrails.map((item) => `- ${item}`),
    '',
    `Decision: ${manifest.releaseDecision}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({
  status: manifest.status,
  topicCount: topics.length,
  liveQueriesExecuted: manifest.liveQueriesExecuted,
}, null, 2));
