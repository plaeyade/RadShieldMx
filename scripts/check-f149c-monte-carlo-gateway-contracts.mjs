import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'src/lib/f149cMonteCarloGateway.ts',
  'src/sections/dialogs/MemoriaAIWizard.tsx',
  'src/sections/dialogs/PdfReportDialog.tsx',
  'src/sections/dialogs/EvidencePackDialog.tsx',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'scripts/f149c-monte-carlo-gateway.mjs',
  'outputs/f149c_monte_carlo_gateway/f149c_monte_carlo_gateway.json',
  'outputs/fase_149c_monte_carlo_gateway.md',
];

const requiredTokens = [
  ['src/lib/f149cMonteCarloGateway.ts', 'buildF149cMonteCarloGateway'],
  ['src/lib/f149cMonteCarloGateway.ts', 'gate-opengate'],
  ['src/lib/f149cMonteCarloGateway.ts', 'egsnrc'],
  ['src/lib/f149cMonteCarloGateway.ts', 'openmc'],
  ['src/lib/f149cMonteCarloGateway.ts', 'reverse-qa'],
  ['src/lib/f149cMonteCarloGateway.ts', 'No declarar equivalencia clinica Monte Carlo'],
  ['src/sections/dialogs/MemoriaAIWizard.tsx', 'f149c-monte-carlo-gateway-memoria'],
  ['src/sections/dialogs/PdfReportDialog.tsx', 'f149c-monte-carlo-gateway-pdf'],
  ['src/sections/dialogs/EvidencePackDialog.tsx', 'f149c-monte-carlo-gateway-evidence'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'f149c-monte-carlo-gateway-update'],
  ['package.json', 'prepare:f149c:mc-gateway'],
  ['package.json', 'test:f149c:mc-gateway'],
];

const missing = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) missing.push(`missing file: ${file}`);
}

for (const [file, token] of requiredTokens) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    missing.push(`missing token file: ${file}`);
    continue;
  }
  const content = fs.readFileSync(full, 'utf8');
  if (!content.includes(token)) missing.push(`missing token "${token}" in ${file}`);
}

const manifestPath = path.join(root, 'outputs', 'f149c_monte_carlo_gateway', 'f149c_monte_carlo_gateway.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F149c') missing.push('manifest phase is not F149c');
  if (!manifest.schema?.includes('mc-gateway')) missing.push('manifest missing mc-gateway schema');
  if (!Array.isArray(manifest.engines) || manifest.engines.length < 6) missing.push('manifest missing engine matrix');
  if (!manifest.engines.some((engine) => engine.id === 'gate-opengate')) missing.push('manifest missing GATE/OpenGATE');
  if (!manifest.engines.some((engine) => engine.id === 'egsnrc')) missing.push('manifest missing EGSnrc');
  if (!manifest.engines.some((engine) => engine.id === 'openmc')) missing.push('manifest missing OpenMC');
  if (!manifest.transportModes?.some((mode) => mode.mode === 'reverse-qa')) missing.push('manifest missing reverse QA mode');
  if (!manifest.releaseGuardrails?.some((item) => item.toLowerCase().includes('clinica monte carlo'))) missing.push('manifest missing clinical MC guardrail');
  if (!manifest.requiredSurfaces || manifest.requiredSurfaces.length < 4) missing.push('manifest missing required UI surfaces');
}

if (missing.length) {
  console.error('F149c Monte Carlo gateway contract failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F149c Monte Carlo gateway contract passed');
