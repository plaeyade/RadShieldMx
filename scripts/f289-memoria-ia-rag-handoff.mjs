import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const f287Dir = path.join(root, 'outputs', 'f287_approved_only_rag_seed');
const f288Dir = path.join(root, 'outputs', 'f288_rag_approved_validation');
const outputDir = path.join(root, 'outputs', 'f289_memoria_ia_rag_handoff');
fs.mkdirSync(outputDir, { recursive: true });

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const readJsonl = (filePath) => fs.readFileSync(filePath, 'utf8')
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

function parseTags(row) {
  try {
    return JSON.parse(row.tags || '[]');
  } catch {
    return [];
  }
}

function tagValue(tags, prefix) {
  const found = tags.find((tag) => String(tag).startsWith(prefix));
  return found ? String(found).slice(prefix.length) : '';
}

const f288 = readJson(path.join(f288Dir, 'f288_rag_approved_validation.json'));
const rows = readJsonl(path.join(f287Dir, 'f287_document_chunks_approved_only.jsonl'));

const modalityProfiles = {
  CY: ['CY'],
  TX: ['TX-LINAC', 'TX-GAMMA-KNIFE', 'TX-BRAQUI'],
  NM: ['NM', 'PET', 'SPECT'],
  DX: ['DX', 'CT', 'RX'],
};

const citationIndex = rows.map((row, index) => {
  const tags = parseTags(row);
  return {
    citationId: `F289-CIT-${String(index + 1).padStart(5, '0')}`,
    source: row.source,
    modality: row.modality,
    pageRef: row.page_ref,
    section: row.section,
    sourceHash: tagValue(tags, 'sourceHash:'),
    chunkHash: tagValue(tags, 'chunkHash:') || tagValue(tags, 'f287ChunkHash:'),
    evidenceType: 'example-memory-approved-only',
    canonicality: 'example-not-normative',
    preview: row.content.replace(/\s+/g, ' ').slice(0, 320),
  };
});

const profileBundles = Object.fromEntries(Object.entries(modalityProfiles).map(([profile, modalities]) => {
  const citations = citationIndex.filter((item) => modalities.includes(item.modality)).slice(0, 30);
  return [profile, {
    profile,
    modalities,
    citationCount: citations.length,
    citationIds: citations.map((item) => item.citationId),
    status: citations.length > 0 ? 'rag-evidence-available' : 'use-canonical-only',
  }];
}));

const workflow = [
  'Select modality profile DX/TX/NM/CY.',
  'Import or draw floorplan and confirm scale/zones.',
  'Select equipment/source and workload/activity.',
  'Run shielding calculation with formula/norm/inputs/outputs.',
  'Attach citations: canonical norm first, approved-only memory examples second.',
  'Generate Memoria IA with warnings for OCR/example evidence.',
  'Export PDF/Evidence Pack with citationId, pageRef, sourceHash and chunkHash.',
];

const manifest = {
  phase: 'F289',
  schema: 'radshield-mx.memoria-ia-rag-handoff.f289.v1',
  generatedAt: new Date().toISOString(),
  status: f288.status === 'rag-approved-validation-ready' ? 'memoria-ia-rag-handoff-ready' : 'memoria-ia-rag-handoff-gated',
  inputPhases: ['F287', 'F288'],
  seedDbAutomatically: false,
  liveDbWritePerformed: false,
  totals: {
    citationCount: citationIndex.length,
    profileBundles: Object.fromEntries(Object.entries(profileBundles).map(([key, value]) => [key, value.citationCount])),
  },
  profileBundles,
  citationPolicy: [
    'NCRP/IAEA/UAQ sources remain canonical for formulas and constants.',
    'F287/F289 citations are examples/evidence from approved-only memories, not automatic normative authority.',
    'Every Memoria IA paragraph using RAG must retain citationId, pageRef, sourceHash and chunkHash.',
    'OCR-derived evidence with mojibake must be marked as example evidence and should not be quoted verbatim in final reports.',
  ],
  workflow,
  nextPhase: 'F290 real clinical testing matrix',
  outputArtifacts: [
    'outputs/f289_memoria_ia_rag_handoff/f289_memoria_ia_rag_handoff.json',
    'outputs/f289_memoria_ia_rag_handoff/f289_citation_index.jsonl',
    'outputs/f289_memoria_ia_rag_handoff/f289_profile_bundles.json',
    'outputs/fase_289_memoria_ia_rag_handoff.md',
  ],
};

fs.writeFileSync(path.join(outputDir, 'f289_memoria_ia_rag_handoff.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f289_citation_index.jsonl'), `${citationIndex.map((item) => JSON.stringify(item)).join('\n')}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f289_profile_bundles.json'), `${JSON.stringify(profileBundles, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(root, 'outputs', 'fase_289_memoria_ia_rag_handoff.md'), [
  '# F289 Memoria IA RAG Handoff',
  '',
  `Status: ${manifest.status}`,
  `Citations: ${manifest.totals.citationCount}`,
  '',
  '## Profile bundles',
  ...Object.values(profileBundles).map((bundle) => `- ${bundle.profile}: ${bundle.citationCount} citations (${bundle.status})`),
  '',
  '## Workflow',
  ...workflow.map((step, index) => `${index + 1}. ${step}`),
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify({
  status: manifest.status,
  citationCount: manifest.totals.citationCount,
  profileBundles: manifest.totals.profileBundles,
}, null, 2));

if (manifest.status !== 'memoria-ia-rag-handoff-ready') process.exit(1);
