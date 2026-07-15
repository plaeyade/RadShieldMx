import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outputsDir = join(root, 'outputs');
mkdirSync(outputsDir, { recursive: true });

const plan = {
  phase: 'F117',
  generatedAt: new Date().toISOString(),
  status: 'implemented-additive',
  activeProfileStorage: 'radshield:f113:active-modality-profile',
  profiles: ['DX', 'TX', 'NM', 'CY'],
  handoffTargets: ['Memoria IA', 'PDF Report', 'Evidence Pack', 'RAG deep dive', 'CNSNS export'],
  guarantees: [
    'No cambia formulas de calculo.',
    'No autoselecciona equipo sin confirmacion del usuario.',
    'Usa el perfil activo como metadata documental y defaults sugeridos.',
  ],
  nextPhase: 'F118 profile-aware dialog opening and optional equipment/template preselection behind user confirmation.',
  decision: 'F117 connects persistent DX/TX/NM/CY profiles to Memoria IA, PDF Report and Evidence Pack routing.',
};

const jsonPath = join(outputsDir, 'f117_modality_handoff.json');
const mdPath = join(outputsDir, 'fase_117_modality_handoff.md');

const md = [
  '# F117 - Perfiles a Memoria/Reporte/Evidencia',
  '',
  '## Decision',
  '',
  plan.decision,
  '',
  '## Perfiles',
  '',
  ...plan.profiles.map((item) => `- ${item}.`),
  '',
  '## Targets',
  '',
  ...plan.handoffTargets.map((item) => `- ${item}.`),
  '',
  '## Garantias',
  '',
  ...plan.guarantees.map((item) => `- ${item}`),
  '',
  '## Siguiente',
  '',
  plan.nextPhase,
  '',
].join('\n');

writeFileSync(jsonPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, `${md}\n`, 'utf8');

console.log(JSON.stringify({ ok: true, jsonPath, mdPath, status: plan.status }, null, 2));
