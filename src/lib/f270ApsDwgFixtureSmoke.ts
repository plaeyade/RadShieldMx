export interface F270DwgFixture {
  fixtureId: string;
  fileName: string;
  sourcePath: string;
  sizeBytes: number;
  sha256?: string;
  status: 'available' | 'missing';
  expectedRoute: string;
}

export interface F270ApsDwgFixtureSmoke {
  phase: 'F270';
  status: 'aps-dwg-fixture-smoke-ready';
  provider: 'autodesk-aps-design-automation';
  fallbackProvider: 'oda-drawings-sdk-deferred';
  fixtures: F270DwgFixture[];
  requiredSecrets: string[];
  expectedOutputs: string[];
  acceptanceCriteria: string[];
  releaseDecision: string;
}

export const F270_EXPECTED_DWG_FIXTURES: F270DwgFixture[] = [
  {
    fixtureId: 'dwg-0760030003b',
    fileName: '0760030003b.dwg',
    sourcePath: 'C:/Users/carlo/Downloads/0760030003b.dwg',
    sizeBytes: 0,
    status: 'missing',
    expectedRoute: 'DWG -> APS backend -> DXF/SVG preview -> F204/F207 canvas import smoke.',
  },
  {
    fixtureId: 'dwg-neuro-oncologia-bind-050726',
    fileName: 'PLANTAS ARQUITECTONICAS NEURO-ONCOLOGIA bind 050726.dwg',
    sourcePath: 'C:/Users/carlo/Downloads/PLANTAS ARQUITECTONICAS NEURO-ONCOLOGIA bind 050726.dwg',
    sizeBytes: 0,
    status: 'missing',
    expectedRoute: 'DWG -> APS backend -> DXF/SVG preview -> layer/scale audit -> floorplan import.',
  },
];

export function buildF270ApsDwgFixtureSmoke(fixtures: F270DwgFixture[] = F270_EXPECTED_DWG_FIXTURES): F270ApsDwgFixtureSmoke {
  return {
    phase: 'F270',
    status: 'aps-dwg-fixture-smoke-ready',
    provider: 'autodesk-aps-design-automation',
    fallbackProvider: 'oda-drawings-sdk-deferred',
    fixtures,
    requiredSecrets: ['DWG_CONVERSION_PROVIDER=aps', 'APS_CLIENT_ID', 'APS_CLIENT_SECRET', 'APS_BUCKET_KEY'],
    expectedOutputs: ['converted.dxf', 'preview.svg', 'preview.png optional', 'layer-map.json', 'scale-audit.json', 'conversion-manifest.json'],
    acceptanceCriteria: [
      'At least one non-sensitive DWG fixture is available and hashed.',
      'Conversion runs only through backend/operator APS adapter, never browser secrets.',
      'Layer names, blocks, units, extents and conversion hash are preserved in manifest.',
      'Canvas import receives DXF/SVG artifacts, not native DWG bytes.',
    ],
    releaseDecision:
      'F270 makes DWG conversion testable. Static frontend release still uses DXF/manual import; native DWG requires APS credentials and fixture smoke.',
  };
}

export function summarizeF270ApsDwgFixtureSmoke(): string {
  const gate = buildF270ApsDwgFixtureSmoke();
  return [
    'F270 APS DWG FIXTURE SMOKE',
    `Status: ${gate.status}`,
    `Provider: ${gate.provider}`,
    `Fixtures: ${gate.fixtures.map((fixture) => `${fixture.fixtureId}:${fixture.status}`).join(' | ')}`,
    `Decision: ${gate.releaseDecision}`,
  ].join('\n');
}
