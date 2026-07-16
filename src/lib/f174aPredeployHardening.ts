export type F174APredeployArea = 'calculation' | 'frontend' | 'rag';
export type F174ARagSourceClass = 'canonical' | 'research' | 'material-evidence' | 'analytic-memory' | 'external';

export interface F174APredeployGuardrail {
  id: string;
  area: F174APredeployArea;
  status: 'ready' | 'review';
  label: string;
  detail: string;
}

const CANONICAL_TOKENS = ['ncrp', 'iaea', 'tg-108', 'tg108', 'uaq'];
const RESEARCH_TOKENS = ['arxiv', 'research', 'review'];
const MATERIAL_TOKENS = ['material', 'contuplex', 'nipoll', 'tvl', 'density'];
const MEMORY_TOKENS = ['memoria', 'zumaya', 'analytic-memory', 'case'];

export function classifyF174RagSource(sourceId: string, tags: string[] = []): F174ARagSourceClass {
  const haystack = [sourceId, ...tags].join(' ').toLowerCase();
  if (CANONICAL_TOKENS.some((token) => haystack.includes(token))) return 'canonical';
  if (MATERIAL_TOKENS.some((token) => haystack.includes(token))) return 'material-evidence';
  if (MEMORY_TOKENS.some((token) => haystack.includes(token))) return 'analytic-memory';
  if (RESEARCH_TOKENS.some((token) => haystack.includes(token))) return 'research';
  return 'external';
}

export function getF174RagCitationWarning(sourceClass: F174ARagSourceClass): string {
  if (sourceClass === 'canonical') return 'Can cite formulas and regulatory criteria when page/hash evidence is present.';
  if (sourceClass === 'material-evidence') return 'Use for TVL, density, weight, cost and constructability only with reviewed source/page/hash.';
  if (sourceClass === 'analytic-memory') return 'Use as precedent and workflow evidence, not as a replacement for canonical formulas.';
  if (sourceClass === 'research') return 'Use as methodology or backlog evidence until independently validated.';
  return 'Treat as external supporting context and keep out of release-critical calculations.';
}

export function buildF174APredeployHardening(): F174APredeployGuardrail[] {
  return [
    {
      id: 'finite-input-guards',
      area: 'calculation',
      status: 'ready',
      label: 'Finite calculation inputs',
      detail: 'Calculation helpers flag non-finite, zero or negative release inputs before numeric QA.',
    },
    {
      id: 'bounded-transmission',
      area: 'calculation',
      status: 'ready',
      label: 'Bounded transmission',
      detail: 'Forward transmission helpers clamp invalid outputs to the physical 0..1 interval.',
    },
    {
      id: 'predeploy-update-center',
      area: 'frontend',
      status: 'ready',
      label: 'Visible predeploy state',
      detail: 'Update Center exposes the hardening state so operators do not rely only on terminal logs.',
    },
    {
      id: 'rag-source-policy',
      area: 'rag',
      status: 'ready',
      label: 'RAG source policy',
      detail: 'Canonical, research, material, analytic-memory and external sources get different citation warnings.',
    },
    {
      id: 'no-db-migration',
      area: 'rag',
      status: 'ready',
      label: 'No DB migration',
      detail: 'The predeploy pass does not change schema or seed data; it only tightens policy and checks.',
    },
  ];
}
