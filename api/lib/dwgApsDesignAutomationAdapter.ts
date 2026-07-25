import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildApsDwgAdapterContract, type ApsDwgAdapterStatus } from '@/lib/dwgApsDesignAutomationContract';

export interface ApsDwgEnvironmentStatus {
  provider: string;
  configuredProvider: string;
  credentialsReady: boolean;
  fixturesReady: boolean;
  fixtureDirectory: string;
  presentFixtures: string[];
  missingFixtures: string[];
  maxUploadMb: number;
  timeoutMs: number;
  status: ApsDwgAdapterStatus;
}

export interface ApsDwgConversionPlan {
  phase: 'F263';
  schema: 'radshield-mx.aps-dwg-conversion-plan.f263.v1';
  status: ApsDwgAdapterStatus;
  provider: 'aps-design-automation';
  canonicalPath: string;
  request: {
    sourceFileName: string;
    inputSha256: string;
    outputFormat: 'dxf';
    timeoutMs: number;
    maxUploadMb: number;
  };
  controls: string[];
  blockedBy: string[];
}

const fixturesDir = path.resolve(process.cwd(), 'fixtures', 'dwg');

function readNumberEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getApsDwgEnvironmentStatus(): ApsDwgEnvironmentStatus {
  const contract = buildApsDwgAdapterContract();
  const configuredProvider = process.env.DWG_CONVERSION_PROVIDER || 'disabled';
  const credentialsReady = contract.requiredSecrets.every((name) => Boolean(process.env[name]));
  const presentFixtures = fs.existsSync(fixturesDir)
    ? fs.readdirSync(fixturesDir).filter((name) => name.toLowerCase().endsWith('.dwg'))
    : [];
  const missingFixtures = contract.requiredFixtures.filter((name) => !presentFixtures.includes(name));
  const fixturesReady = missingFixtures.length === 0;
  const providerEnabled = configuredProvider === contract.provider;

  let status: ApsDwgAdapterStatus = 'disabled';
  if (providerEnabled && credentialsReady && fixturesReady) status = 'adapter-ready-to-smoke';
  else if (providerEnabled && credentialsReady) status = 'adapter-ready-waiting-for-fixtures';
  else if (providerEnabled && fixturesReady) status = 'adapter-ready-waiting-for-credentials';
  else if (providerEnabled) status = 'adapter-ready-waiting-for-credentials-and-fixtures';

  return {
    provider: contract.provider,
    configuredProvider,
    credentialsReady,
    fixturesReady,
    fixtureDirectory: 'fixtures/dwg',
    presentFixtures,
    missingFixtures,
    maxUploadMb: readNumberEnv('DWG_MAX_UPLOAD_MB', contract.maximumUploadMb),
    timeoutMs: readNumberEnv('DWG_CONVERSION_TIMEOUT_MS', contract.defaultTimeoutMs),
    status,
  };
}

export function buildApsDwgConversionPlan(fileName: string, content: Buffer): ApsDwgConversionPlan {
  const contract = buildApsDwgAdapterContract();
  const envStatus = getApsDwgEnvironmentStatus();
  const inputSha256 = createHash('sha256').update(content).digest('hex');
  const blockedBy: string[] = [];

  if (envStatus.configuredProvider !== contract.provider) blockedBy.push('DWG_CONVERSION_PROVIDER is not aps-design-automation');
  if (!envStatus.credentialsReady) blockedBy.push('APS credentials are missing in backend environment');
  if (!envStatus.fixturesReady) blockedBy.push(`Required DWG fixtures missing: ${envStatus.missingFixtures.join(', ')}`);

  return {
    phase: 'F263',
    schema: 'radshield-mx.aps-dwg-conversion-plan.f263.v1',
    status: envStatus.status,
    provider: contract.provider,
    canonicalPath: contract.canonicalPath,
    request: {
      sourceFileName: path.basename(fileName),
      inputSha256,
      outputFormat: contract.outputFormat,
      timeoutMs: envStatus.timeoutMs,
      maxUploadMb: envStatus.maxUploadMb,
    },
    controls: contract.acceptanceChecks,
    blockedBy,
  };
}
