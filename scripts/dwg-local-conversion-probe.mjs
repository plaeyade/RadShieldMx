import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'dwg_local_conversion_probe');
fs.mkdirSync(outputDir, { recursive: true });

const inputPath = process.env.RADSHIELD_DWG_FIXTURE_PATH || 'C:/Users/carlo/Downloads/0760030003b.dwg';
const converterCommand = process.env.DWG_CONVERTER_COMMAND;
const converterArgsJson = process.env.DWG_CONVERTER_ARGS_JSON;
const autoRunDetected = process.env.RADSHIELD_DWG_LOCAL_CONVERSION === '1';

const candidateCommands = [
  { id: 'oda-file-converter', command: 'ODAFileConverter.exe' },
  { id: 'autocad-core-console', command: 'accoreconsole.exe' },
  { id: 'libredwg-dwgread', command: 'dwgread.exe' },
  { id: 'libredwg-dwg2dxf', command: 'dwg2dxf.exe' },
];

const sha256 = (filePath) => {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
};

const toPosixish = (filePath) => filePath.replace(/\\/g, '/');

const detectOnPath = (command) => {
  try {
    const out = execFileSync('where.exe', [command], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return out.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
};

const detectedConverters = candidateCommands.map((candidate) => ({
  ...candidate,
  paths: detectOnPath(candidate.command),
})).filter((candidate) => candidate.paths.length > 0);

const inputExists = fs.existsSync(inputPath);
const inputStats = inputExists ? fs.statSync(inputPath) : undefined;
const firstBytes = inputExists ? fs.readFileSync(inputPath).subarray(0, 8) : Buffer.alloc(0);
const signatureText = firstBytes.toString('ascii').replace(/\0/g, '');
const signatureValid = signatureText.startsWith('AC');

const conversionOutputDir = path.join(outputDir, 'converted');
fs.mkdirSync(conversionOutputDir, { recursive: true });
const defaultOutputPath = path.join(conversionOutputDir, `${path.basename(inputPath, path.extname(inputPath))}.dxf`);

const replacePlaceholders = (value) => value
  .replaceAll('{input}', inputPath)
  .replaceAll('{inputDir}', path.dirname(inputPath))
  .replaceAll('{inputFile}', path.basename(inputPath))
  .replaceAll('{outputDir}', conversionOutputDir)
  .replaceAll('{output}', defaultOutputPath);

const parseArgs = () => {
  if (!converterArgsJson) return undefined;
  const parsed = JSON.parse(converterArgsJson);
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
    throw new Error('DWG_CONVERTER_ARGS_JSON must be a JSON array of strings.');
  }
  return parsed.map(replacePlaceholders);
};

const defaultArgsFor = (command) => {
  const lower = path.basename(command).toLowerCase();
  if (lower === 'odafileconverter.exe') {
    return [path.dirname(inputPath), conversionOutputDir, 'ACAD2018', 'DXF', '0', '1'];
  }
  if (lower === 'dwg2dxf.exe') {
    return [inputPath, defaultOutputPath];
  }
  if (lower === 'dwgread.exe') {
    return ['-O', 'DXF', '-o', defaultOutputPath, inputPath];
  }
  return undefined;
};

const collectDxfOutputs = () => {
  const found = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.dxf')) {
        const stats = fs.statSync(entryPath);
        found.push({
          path: toPosixish(entryPath),
          fileName: entry.name,
          sizeBytes: stats.size,
          sha256: sha256(entryPath),
        });
      }
    }
  };
  walk(conversionOutputDir);
  return found;
};

let selectedConverter = null;
let execution = {
  attempted: false,
  liveConversionExecuted: false,
  exitCode: null,
  stdoutTail: '',
  stderrTail: '',
  error: null,
};

try {
  if (inputExists && signatureValid) {
    if (converterCommand) {
      selectedConverter = {
        source: 'env',
        command: replacePlaceholders(converterCommand),
        args: parseArgs() ?? defaultArgsFor(converterCommand),
      };
    } else if (autoRunDetected && detectedConverters.length > 0) {
      selectedConverter = {
        source: 'path-detected',
        command: detectedConverters[0].paths[0],
        args: defaultArgsFor(detectedConverters[0].command),
      };
    }

    if (selectedConverter?.args) {
      execution.attempted = true;
      const run = spawnSync(selectedConverter.command, selectedConverter.args, {
        cwd: root,
        encoding: 'utf8',
        shell: false,
        timeout: 120000,
      });
      execution = {
        attempted: true,
        liveConversionExecuted: true,
        exitCode: run.status,
        stdoutTail: (run.stdout || '').slice(-1200),
        stderrTail: (run.stderr || '').slice(-1200),
        error: run.error ? String(run.error.message || run.error) : null,
      };
    } else if (selectedConverter) {
      execution.error = 'Converter selected but no safe argument contract is configured.';
    }
  }
} catch (error) {
  execution.error = String(error?.message || error);
}

const dxfOutputs = collectDxfOutputs();
const status = !inputExists
  ? 'dwg-fixture-missing'
  : !signatureValid
    ? 'dwg-signature-invalid'
    : dxfOutputs.length > 0
      ? 'conversion-output-ready'
      : execution.liveConversionExecuted
        ? 'conversion-failed-or-no-dxf'
        : 'converter-not-configured';

const manifest = {
  schema: 'radshield-mx.dwg-local-conversion-probe.v1',
  generatedAt: new Date().toISOString(),
  status,
  input: {
    path: toPosixish(inputPath),
    fileName: path.basename(inputPath),
    exists: inputExists,
    sizeBytes: inputStats?.size ?? 0,
    sha256: inputExists ? sha256(inputPath) : null,
    signatureText,
    signatureValid,
  },
  conversion: {
    selectedConverter,
    detectedConverters,
    outputDir: toPosixish(conversionOutputDir),
    dxfOutputs,
    ...execution,
  },
  safeActivation: {
    env: [
      'RADSHIELD_DWG_FIXTURE_PATH=C:/path/to/file.dwg',
      'DWG_CONVERTER_COMMAND=C:/path/to/ODAFileConverter.exe',
      'DWG_CONVERTER_ARGS_JSON=["{inputDir}","{outputDir}","ACAD2018","DXF","0","1"]',
      'RADSHIELD_DWG_LOCAL_CONVERSION=1 # optional: run first detected supported converter',
    ],
    route: 'DWG -> local converter/operator -> DXF -> DXFViewerDialog -> Aplicar al canvas',
    canvasNextStep: 'Load the converted DXF through Archivo > Importar DXF, then use Aplicar al canvas.',
  },
};

fs.writeFileSync(path.join(outputDir, 'dwg_local_conversion_probe.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  path.join(root, 'outputs', 'fase_dwg_local_conversion_probe.md'),
  [
    '# DWG Local Conversion Probe',
    '',
    `Status: ${manifest.status}`,
    `Input: ${manifest.input.fileName} (${manifest.input.sizeBytes} bytes)`,
    `Signature: ${manifest.input.signatureValid ? 'valid DWG-like AC*' : 'not confirmed'}`,
    `Live conversion executed: ${manifest.conversion.liveConversionExecuted ? 'yes' : 'no'}`,
    '',
    '## Detected Converters',
    ...(detectedConverters.length
      ? detectedConverters.map((converter) => `- ${converter.id}: ${converter.paths.join('; ')}`)
      : ['- none detected on PATH']),
    '',
    '## DXF Outputs',
    ...(dxfOutputs.length
      ? dxfOutputs.map((file) => `- ${file.path}; ${file.sizeBytes} bytes; ${file.sha256}`)
      : ['- none yet']),
    '',
    '## Safe Activation',
    ...manifest.safeActivation.env.map((line) => `- ${line}`),
    '',
    `Route: ${manifest.safeActivation.route}`,
    `Next: ${manifest.safeActivation.canvasNextStep}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(JSON.stringify({
  status: manifest.status,
  inputExists: manifest.input.exists,
  signatureValid: manifest.input.signatureValid,
  detectedConverters: manifest.conversion.detectedConverters.length,
  liveConversionExecuted: manifest.conversion.liveConversionExecuted,
  dxfOutputs: manifest.conversion.dxfOutputs.length,
}, null, 2));
