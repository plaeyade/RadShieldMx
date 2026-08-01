import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredMarkers = [
  ['src/lib/f414BimVideoReference.ts', 'radshield-mx.f414.bim-video-reference.v1'],
  ['src/lib/f414BimVideoReference.ts', 'discipline-ribbon'],
  ['src/lib/f414BimVideoReference.ts', 'project-manager'],
  ['src/lib/f414BimVideoReference.ts', 'properties-layers'],
  ['src/lib/f414BimVideoReference.ts', 'annotated-viewport'],
  ['src/lib/f414BimVideoReference.ts', 'command-line'],
  ['src/sections/CanvasArea.tsx', 'buildF414BimVideoReferencePlan'],
  ['src/sections/CanvasArea.tsx', 'f414-bim-video-reference'],
  ['scripts/extract-f414-bim-video-frames.ps1', 'f414_bim_video_reference'],
  ['scripts/extract-f414-bim-video-frames.ps1', 'Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe'],
  ['CHANGELOG.md', 'F414'],
  ['MANUAL_VERSIONES_v50.md', 'F414'],
  ['MANUAL_USUARIO_v99.md', 'F414'],
  ['package.json', 'prepare:f414:bim-video-reference'],
  ['package.json', 'test:f414:bim-video-reference'],
];

const failures = [];

for (const [relativePath, marker] of requiredMarkers) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${relativePath}: missing file`);
    continue;
  }
  const text = fs.readFileSync(fullPath, 'utf8');
  if (!text.includes(marker)) failures.push(`${relativePath}: missing marker "${marker}"`);
}

if (failures.length) {
  console.error('F414 BIM video reference audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F414 BIM video reference audit passed.');
