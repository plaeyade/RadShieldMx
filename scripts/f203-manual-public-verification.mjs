import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f203_manual_public_verification');
const jsonPath = path.join(outputDir, 'f203_manual_public_verification.json');
const mdPath = path.join(root, 'outputs', 'fase_203_manual_public_verification.md');
const operatorJsonPath = path.join(outputDir, 'f203_operator_public_checklist.template.json');
const operatorMdPath = path.join(outputDir, 'CHECKLIST_OPERADOR_F203_PUBLICO.md');

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

const f200 = readJson('outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json');
const f202 = readJson('outputs/f202_public_vercel_smoke_result.json');

const publicUrl =
  process.env.PUBLIC_DEPLOY_URL ||
  f202?.url ||
  f200?.publicDeployUrl ||
  'https://radshield-mx-static-dist.vercel.app/';

const checks = [
  {
    id: 'url-https-loads',
    group: 'Acceso',
    label: 'La URL publica HTTPS carga sin error en navegador externo',
    expected: publicUrl,
  },
  {
    id: 'cache-clean-state',
    group: 'Acceso',
    label: 'Abrir en ventana privada o despues de reset/cache clear para evitar assets viejos',
    expected: 'Sin service worker/cache obsoleto; app muestra version actual.',
  },
  {
    id: 'app-shell-visible',
    group: 'Shell',
    label: 'Barra superior visible con RadShield-MX y flujo canonico',
    expected: 'Diseno, Equipos, Blindaje, Verificacion, Reportes, Evidencia, Integraciones.',
  },
  {
    id: 'sidebar-visible',
    group: 'Canvas',
    label: 'Sidebar estable visible',
    expected: 'Ancho legible; no desaparece al abrir menus.',
  },
  {
    id: 'canvas-floorplan-visible',
    group: 'Canvas',
    label: 'Canvas/floorplan visible',
    expected: 'Plano demo o plano cargado visible; no queda pantalla blanca.',
  },
  {
    id: 'cad-toolbar-visible',
    group: 'Canvas',
    label: 'Toolbar CAD clinica visible',
    expected: 'Herramientas de seleccion, medicion, snap, capas, heat/iso/estructura.',
  },
  {
    id: 'workflow-panel-controls',
    group: 'Canvas',
    label: 'Panel Layout-blindaje-memoria se puede mover, compactar y cerrar/restaurar',
    expected: 'No obstruye permanentemente el floorplan.',
  },
  {
    id: 'design-menu',
    group: 'Menus',
    label: 'Menu Diseno abre y muestra herramientas de plano/3D/importacion',
    expected: 'Incluye Medical 3D Floor Plan o equivalente.',
  },
  {
    id: 'equipment-menu',
    group: 'Menus',
    label: 'Menu Equipos abre bibliotecas y modalidades DX/TX/NM/CY',
    expected: 'Fuentes/equipos clinicos accesibles.',
  },
  {
    id: 'shielding-menu',
    group: 'Menus',
    label: 'Menu Blindaje abre calculadoras/herramientas de barreras',
    expected: 'Calculo rapido, multicapa, neutrones o equivalentes visibles.',
  },
  {
    id: 'verification-menu',
    group: 'Menus',
    label: 'Menu Verificacion abre QA, validacion y checklist',
    expected: 'QA numerico/evidencia o validadores visibles.',
  },
  {
    id: 'reports-menu',
    group: 'Salidas',
    label: 'Menu Reportes abre Memoria IA y PDF analitico',
    expected: 'Memoria IA, PDF analitico y/o CNSNS visibles.',
  },
  {
    id: 'evidence-menu',
    group: 'Salidas',
    label: 'Menu Evidencia abre Evidence Pack/RAG/auditoria',
    expected: 'Evidence Pack y citas/evidencia visibles.',
  },
  {
    id: 'memoria-ai-opens',
    group: 'Salidas',
    label: 'Memoria IA abre con flujo paso a paso y evidencia',
    expected: 'Inputs, formula/norma/cita/evidencia o warnings visibles.',
  },
  {
    id: 'pdf-report-opens',
    group: 'Salidas',
    label: 'PDF analitico abre con anexos/evidencia',
    expected: 'Dialogo PDF visible sin romper canvas/sidebar.',
  },
  {
    id: 'evidence-pack-opens',
    group: 'Salidas',
    label: 'Evidence Pack abre con ledger de citas/calculo',
    expected: 'Formula, norma, inputs, outputs, citationIds o checks visibles.',
  },
  {
    id: 'cnsns-output-opens',
    group: 'Salidas',
    label: 'Reporte/Checklist CNSNS abre correctamente',
    expected: 'Checklist o reporte regulatorio visible.',
  },
];

const status =
  f202?.status === 'public-vercel-smoke-ready'
    ? 'manual-public-verification-optional'
    : 'manual-public-verification-required';

const manifest = {
  phase: 'F203',
  title: 'Manual public verification after network-gated smoke',
  schema: 'radshield-mx.manual-public-verification.f203.v1',
  generatedAt: new Date().toISOString(),
  status,
  publicUrl,
  previousEvidence: {
    f200Status: f200?.status ?? 'missing',
    f200CommitSha: f200?.commitSha ?? null,
    f200WorktreeClean: f200?.worktreeClean ?? null,
    f202Status: f202?.status ?? 'missing',
    f202Detail: f202?.checks?.find((check) => !check.ok)?.detail ?? null,
  },
  operatorAction:
    status === 'manual-public-verification-required'
      ? 'Open the public URL from an unrestricted browser and complete the F203 operator checklist before declaring public frontend GO.'
      : 'F202 public smoke already passed; operator checklist remains recommended for release sign-off.',
  requiredEvidence: [
    'Screenshot of full app shell with URL bar visible.',
    'Screenshot of canvas/floorplan with sidebar and CAD toolbar visible.',
    'Screenshot of Layout-blindaje-memoria panel moved or compacted.',
    'Screenshot of Memoria IA, PDF report, Evidence Pack and CNSNS output opening.',
    'Operator initials/date and any observed defects.',
  ],
  checks: checks.map((check) => ({
    ...check,
    status: 'operator-required',
    observed: null,
    evidencePath: null,
    notes: null,
  })),
  releaseDecision: {
    allowedValues: ['GO-static-frontend', 'GO-with-minor-notes', 'NO-GO-fix-required'],
    current: 'pending-operator-review',
  },
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(operatorJsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const md = `# F203 - Verificacion publica manual

Estado: **${manifest.status}**

URL publica: ${manifest.publicUrl}

## Contexto

- F200: ${manifest.previousEvidence.f200Status}
- Commit F200: ${manifest.previousEvidence.f200CommitSha ?? 'N/D'}
- F202: ${manifest.previousEvidence.f202Status}
- Detalle F202: ${manifest.previousEvidence.f202Detail ?? 'N/D'}

## Accion del operador

${manifest.operatorAction}

## Evidencia requerida

${manifest.requiredEvidence.map((item) => `- ${item}`).join('\n')}

## Checklist

${manifest.checks.map((check) => `- [ ] ${check.group} / ${check.id}: ${check.label} | Esperado: ${check.expected}`).join('\n')}

## Decision

Marcar una decision final despues de revisar:

- GO-static-frontend
- GO-with-minor-notes
- NO-GO-fix-required
`;

fs.writeFileSync(mdPath, `${md}\n`, 'utf8');
fs.writeFileSync(operatorMdPath, `${md}\n`, 'utf8');

console.log(
  JSON.stringify(
    {
      status: manifest.status,
      publicUrl: manifest.publicUrl,
      checks: manifest.checks.length,
      output: path.relative(root, jsonPath),
    },
    null,
    2,
  ),
);
