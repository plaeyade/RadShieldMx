export type DwgProviderOutputFormat = 'dxf' | 'svg' | 'ifc';

export interface DwgExternalProviderContract {
  schema: 'radshield-mx.dwg-external-provider.f259.v1';
  status: 'provider-required';
  nativeBrowserDwgSupport: false;
  canonicalFallback: 'dxf-import-path';
  acceptedOutputs: DwgProviderOutputFormat[];
  requiredControls: string[];
  rejectedBehaviors: string[];
  validationCommands: string[];
}

export function buildDwgExternalProviderContract(): DwgExternalProviderContract {
  return {
    schema: 'radshield-mx.dwg-external-provider.f259.v1',
    status: 'provider-required',
    nativeBrowserDwgSupport: false,
    canonicalFallback: 'dxf-import-path',
    acceptedOutputs: ['dxf', 'svg', 'ifc'],
    requiredControls: [
      'file-size-limit-before-upload',
      'conversion-timeout',
      'input-sha256',
      'output-sha256',
      'provider-error-code',
      'layer-mapping-audit',
      'no-floorplan-mutation-on-failure',
      'operator-confirmation-before-apply',
    ],
    rejectedBehaviors: [
      'claim-native-dwg-in-browser',
      'silent-floorplan-overwrite',
      'ignore-failed-layer-mapping',
      'store-private-dwg-on-static-host',
    ],
    validationCommands: [
      'npm run test:f204:canvas-dxf-recovery',
      'npm run test:f213:dxf-layer-mapping',
      'npm run test:f207:functional-app-qa',
    ],
  };
}

export function summarizeDwgExternalProviderContract(): string {
  const contract = buildDwgExternalProviderContract();
  return [
    'F259 DWG EXTERNAL PROVIDER CONTRACT',
    `Status: ${contract.status}`,
    `Native browser DWG: ${contract.nativeBrowserDwgSupport ? 'yes' : 'no'}`,
    `Canonical fallback: ${contract.canonicalFallback}`,
    `Accepted outputs: ${contract.acceptedOutputs.join(', ')}`,
    `Required controls: ${contract.requiredControls.join(' | ')}`,
    `Rejected behaviors: ${contract.rejectedBehaviors.join(' | ')}`,
    `Validation: ${contract.validationCommands.join(' | ')}`,
  ].join('\n');
}
