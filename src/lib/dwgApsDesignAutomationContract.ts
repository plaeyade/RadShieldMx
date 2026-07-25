export type ApsDwgAdapterStatus =
  | 'disabled'
  | 'adapter-ready-waiting-for-credentials-and-fixtures'
  | 'adapter-ready-waiting-for-fixtures'
  | 'adapter-ready-waiting-for-credentials'
  | 'adapter-ready-to-smoke';

export interface ApsDwgAdapterContract {
  phase: 'F263';
  schema: 'radshield-mx.aps-dwg-adapter.f263.v1';
  provider: 'aps-design-automation';
  canonicalPath: 'dwg-upload-to-aps-workitem-to-dxf-to-existing-dxf-import';
  inputFormat: 'dwg';
  outputFormat: 'dxf';
  frontendSecretsAllowed: false;
  maximumUploadMb: number;
  defaultTimeoutMs: number;
  requiredSecrets: string[];
  requiredFixtures: string[];
  liveSmokeBlockedUntil: string[];
  acceptanceChecks: string[];
  rollback: string;
}

export function buildApsDwgAdapterContract(): ApsDwgAdapterContract {
  return {
    phase: 'F263',
    schema: 'radshield-mx.aps-dwg-adapter.f263.v1',
    provider: 'aps-design-automation',
    canonicalPath: 'dwg-upload-to-aps-workitem-to-dxf-to-existing-dxf-import',
    inputFormat: 'dwg',
    outputFormat: 'dxf',
    frontendSecretsAllowed: false,
    maximumUploadMb: 50,
    defaultTimeoutMs: 120000,
    requiredSecrets: ['APS_CLIENT_ID', 'APS_CLIENT_SECRET', 'APS_BUCKET_KEY'],
    requiredFixtures: ['small-architectural-plan.dwg', 'equipment-layout.dwg'],
    liveSmokeBlockedUntil: [
      'DWG_CONVERSION_PROVIDER=aps-design-automation',
      'APS credentials configured only in backend runtime',
      'non-sensitive DWG fixtures present in fixtures/dwg',
      'converted DXF passes layer mapping and scale confirmation',
      'operator confirms before applying geometry to the floorplan',
    ],
    acceptanceChecks: [
      'inputSha256 recorded before upload',
      'APS workitem id recorded',
      'outputSha256 recorded after download',
      'DXF parser opens converted output',
      'layer mapping classifies walls/equipment/zones/dimensions',
      'failed conversion never mutates the active floorplan',
      'manual DXF fallback remains available',
    ],
    rollback:
      'Keep original floorplan unchanged, discard converted output and continue with manual DXF import.',
  };
}

export function buildApsDwgAdapterPublicSummary(status: ApsDwgAdapterStatus): string {
  const contract = buildApsDwgAdapterContract();
  return [
    'F263 APS DWG ADAPTER',
    `Status: ${status}`,
    `Provider: ${contract.provider}`,
    `Path: ${contract.canonicalPath}`,
    `Secrets in frontend: ${contract.frontendSecretsAllowed ? 'allowed' : 'never'}`,
    `Output: ${contract.outputFormat}`,
    `Blocked until: ${contract.liveSmokeBlockedUntil.join(' | ')}`,
    `Rollback: ${contract.rollback}`,
  ].join('\n');
}
