import { buildDwgProviderSelection } from './dwgProviderSelection';

export interface DwgFixtureRequirement {
  id: string;
  description: string;
  required: boolean;
  acceptedExtensions: string[];
}

export interface DwgFixtureGate {
  phase: 'F262';
  schema: 'radshield-mx.dwg-fixture-gate.f262.v1';
  status: 'waiting-for-fixtures';
  fixtureDirectory: 'fixtures/dwg';
  requiredFixtures: DwgFixtureRequirement[];
  acceptanceChecks: string[];
  importPolicy: string;
  rollback: string;
}

export function buildDwgFixtureGate(): DwgFixtureGate {
  const providerSelection = buildDwgProviderSelection();
  return {
    phase: 'F262',
    schema: 'radshield-mx.dwg-fixture-gate.f262.v1',
    status: 'waiting-for-fixtures',
    fixtureDirectory: 'fixtures/dwg',
    requiredFixtures: [
      {
        id: 'small-architectural-plan',
        description: 'DWG 2D pequeno con muros en capas separadas, escala conocida y al menos una cota.',
        required: true,
        acceptedExtensions: ['.dwg'],
      },
      {
        id: 'equipment-layout',
        description: 'DWG con equipo medico o bloques que representen LINAC/Gamma Knife/CT/PET o mobiliario tecnico.',
        required: true,
        acceptedExtensions: ['.dwg'],
      },
      {
        id: 'known-bad-or-empty',
        description: 'DWG corrupto, vacio o con capas no mapeables para validar fallos seguros.',
        required: false,
        acceptedExtensions: ['.dwg'],
      },
    ],
    acceptanceChecks: [
      `selectedProvider=${providerSelection.selectedPrimary}`,
      'inputSha256 recorded',
      'outputSha256 recorded',
      'conversionTimeout enforced',
      'DXF output opens in existing DXF parser',
      'layer mapping classifies walls/equipment/zones/dimensions',
      'scale is operator-confirmed before calculations',
      'failed conversion does not mutate floorplan',
      'operator confirms before applying converted geometry to canvas',
    ],
    importPolicy:
      'DWG fixtures are never applied directly. Convert to DXF/SVG/IFC through the provider, validate hashes/layers/scale, then use the existing DXF import event.',
    rollback:
      'Delete converted output, keep original floorplan unchanged and use manual DXF fallback.',
  };
}

export function summarizeDwgFixtureGate(): string {
  const gate = buildDwgFixtureGate();
  return [
    'F262 DWG FIXTURE GATE',
    `Status: ${gate.status}`,
    `Directory: ${gate.fixtureDirectory}`,
    `Import policy: ${gate.importPolicy}`,
    `Acceptance: ${gate.acceptanceChecks.join(' | ')}`,
    `Rollback: ${gate.rollback}`,
    ...gate.requiredFixtures.map((fixture) => [
      `- ${fixture.id}${fixture.required ? ' required' : ' optional'}`,
      `  ${fixture.description}`,
      `  Extensions: ${fixture.acceptedExtensions.join(', ')}`,
    ].join('\n')),
  ].join('\n');
}
