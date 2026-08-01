import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const contracts = [
  {
    file: 'src/lib/f411BimCanvasMethodology.ts',
    markers: [
      'IfcWall',
      'IfcSpace',
      'RadShieldSource',
      'RadShieldControlPoint',
      'IfcPresentationLayerAssignment',
      'RS_ShieldingType',
      'RS_MaterialCode',
      'RS_RequiredThickness',
      'RS_PassFail',
      'native-rvt',
      'dwg-native',
      'db-versioning',
    ],
  },
  {
    file: 'src/sections/CanvasArea.tsx',
    markers: [
      'f412-bim-entity-catalog',
      'f412-bim-rs-parameters',
      'f412-bim-roundtrip-gates',
      "parameter.name.replace('RS_', '')",
    ],
  },
  {
    file: 'src/lib/revitIntegration.ts',
    markers: [
      'REVIT_SHARED_PARAMETERS',
      'RS_EvidencePackId',
      'RS_SourceTrace',
      'REVIT_READINESS_CHECKLIST',
    ],
  },
];

const failures = [];

for (const contract of contracts) {
  const fullPath = path.join(root, contract.file);
  const text = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
  for (const marker of contract.markers) {
    if (!text.includes(marker)) failures.push(`${contract.file}: missing "${marker}"`);
  }
}

if (failures.length) {
  console.error('F412 BIM methodology contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F412 BIM methodology contracts passed.');
