import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f372_beta_static_package');
const visualDir = path.join(root, 'outputs', 'f371_f372_beta_visuals');
const distDir = path.join(root, 'dist');
const zipPath = path.join(outDir, 'radshield-mx-f372-static-beta.zip');
const manifestPath = path.join(outDir, 'f372_beta_static_package.json');
const reportPath = path.join(outDir, 'f372_beta_static_package.md');

function gitValue(args, fallback) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim() || fallback;
  } catch {
    return fallback;
  }
}

async function readVisualSmoke() {
  const file = path.join(visualDir, 'f371_f372_beta_visual_smoke.json');
  if (!existsSync(file)) {
    return {
      status: 'missing-f371-visual-smoke',
      checks: [],
      screenshots: [],
    };
  }
  return JSON.parse(await readFile(file, 'utf8'));
}

async function main() {
  if (!existsSync(distDir)) {
    throw new Error('dist/ is missing. Run npm run build before packaging F372.');
  }
  await mkdir(outDir, { recursive: true });
  const visualSmoke = await readVisualSmoke();
  const commit = gitValue(['rev-parse', '--short', 'HEAD'], 'unknown');
  const branch = gitValue(['branch', '--show-current'], 'unknown');

  if (existsSync(zipPath)) {
    execFileSync('powershell.exe', ['-NoProfile', '-Command', `Remove-Item -LiteralPath '${zipPath.replaceAll("'", "''")}' -Force`], {
      cwd: root,
      stdio: 'inherit',
    });
  }

  execFileSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      [
        '$ErrorActionPreference="Stop"',
        `$source='${path.join(distDir, '*').replaceAll("'", "''")}'`,
        `$dest='${zipPath.replaceAll("'", "''")}'`,
        'Compress-Archive -Path $source -DestinationPath $dest -Force',
      ].join('; '),
    ],
    { cwd: root, stdio: 'inherit' },
  );

  const manifest = {
    phase: 'F372',
    status: visualSmoke.status === 'beta-visual-smoke-ready' ? 'static-beta-package-ready' : 'static-beta-package-with-visual-review-warning',
    generatedAt: new Date().toISOString(),
    branch,
    commit,
    package: {
      format: 'zip',
      path: zipPath,
      source: distDir,
      deploymentMode: 'static-frontend-beta',
    },
    f371VisualSmoke: {
      status: visualSmoke.status,
      screenshots: visualSmoke.screenshots,
      failedChecks: visualSmoke.checks?.filter((check) => !check.ok) ?? [],
    },
    releaseScope: [
      'frontend estatico estable',
      'Three/R3F runtime activo',
      'Unity WebGL como visor externo por handoff',
      'GATE/OpenGATE, Geant4 y EGSnrc como runners externos pendientes de ejecucion local/servidor',
      'Memoria IA, PDF Report y Evidence Pack con evidencia F367-F370 visible',
    ],
    notClaimed: [
      'certificacion clinica Monte Carlo',
      'Unity embebido en bundle',
      'Babylon runtime activo',
      'DWG nativo sin proveedor externo',
      'firma final RSO/fisico medico',
    ],
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeFile(
    reportPath,
    [
      '# F372 Static Beta Package',
      '',
      `Status: ${manifest.status}`,
      `Commit: ${commit}`,
      `Branch: ${branch}`,
      `ZIP: ${zipPath}`,
      '',
      '## Scope',
      ...manifest.releaseScope.map((item) => `- ${item}`),
      '',
      '## Not Claimed',
      ...manifest.notClaimed.map((item) => `- ${item}`),
      '',
      '## F371 Visual Smoke',
      `Status: ${manifest.f371VisualSmoke.status}`,
      ...(manifest.f371VisualSmoke.screenshots ?? []).map((item) => `- ${item}`),
      '',
    ].join('\n'),
    'utf8',
  );

  console.log(`F372 static beta package written to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
