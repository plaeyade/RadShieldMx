import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outputsDir = join(root, 'outputs');
mkdirSync(outputsDir, { recursive: true });

const implementation = {
  phase: 'F113',
  generatedAt: new Date().toISOString(),
  status: 'implemented-additive',
  storageKey: 'radshield:f113:active-modality-profile',
  profiles: [
    { id: 'dx', label: 'DX', name: 'Diagnostico', standards: ['NCRP 147', 'IPEM 109', 'NOM-008-NUCL'], focus: 'RX, CT, fluoroscopia, mamografia' },
    { id: 'tx', label: 'TX', name: 'Terapia', standards: ['NCRP 151', 'IAEA SRS-47', 'CNSNS LA-007/01'], focus: 'LINAC, Gamma Knife, HDR, Co-60' },
    { id: 'nm', label: 'NM', name: 'Medicina nuclear', standards: ['AAPM TG-108', 'NCRP 147/155', 'ICRP 128'], focus: 'PET/CT, SPECT/CT, radiofarmacia' },
    { id: 'cy', label: 'CY', name: 'Ciclotron', standards: ['IAEA SRS-47', 'NCRP 151', 'NOM-008-NUCL'], focus: 'ciclotron, target cave, hot cells, activacion' },
  ],
  preservedSurfaces: [
    'F92 canonical workflow dropdowns',
    'F112 persistent favorites',
    'F112 smart chips',
    'CategoryToolsDialog existing handler',
    'legacy fallback menus',
  ],
  nextPhase: 'F114 deduplicates top bar menus after smoke validates active modality profile destinations.',
  decision: 'F113 makes DX/TX/NM/CY active persistent modality profiles while preserving the existing category launcher behavior.',
};

const jsonPath = join(outputsDir, 'f113_modality_profiles.json');
const mdPath = join(outputsDir, 'fase_113_modality_profiles.md');

const md = [
  '# F113 - Perfiles activos DX/TX/NM/CY',
  '',
  '## Resultado',
  '',
  '- DX/TX/NM/CY ahora son perfiles activos persistentes.',
  '- El perfil seleccionado se guarda en localStorage.',
  '- Cada perfil aporta normas, familias de equipo, calculos sugeridos, pasos de memoria y pistas de canvas.',
  '- Se conserva el handler CategoryToolsDialog para no romper flujos existentes.',
  '',
  '## Perfiles',
  '',
  ...implementation.profiles.map((profile) => `- ${profile.label} ${profile.name}: ${profile.focus}. Normas: ${profile.standards.join(', ')}.`),
  '',
  '## Preservado',
  '',
  ...implementation.preservedSurfaces.map((item) => `- ${item}.`),
  '',
  '## Siguiente',
  '',
  implementation.nextPhase,
  '',
].join('\n');

writeFileSync(jsonPath, `${JSON.stringify(implementation, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, `${md}\n`, 'utf8');

console.log(JSON.stringify({ ok: true, jsonPath, mdPath, status: implementation.status }, null, 2));
