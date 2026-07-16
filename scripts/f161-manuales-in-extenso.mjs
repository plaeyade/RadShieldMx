import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f161_manuales_in_extenso');
const manualPath = path.join(outDir, 'MANUAL_OPERACION_PREDEPLOY_F161.md');
const manifestPath = path.join(outDir, 'f161_manuales_in_extenso.json');
const mdPath = path.join(root, 'outputs', 'fase_161_manuales_in_extenso.md');

fs.mkdirSync(outDir, { recursive: true });

const sections = [
  {
    title: '1. Flujo operativo recomendado',
    lines: [
      'Abrir proyecto o crear proyecto nuevo.',
      'Importar plano DXF/SVG/PNG/JPG o trazar geometria base en canvas.',
      'Calibrar escala antes de calcular cualquier barrera.',
      'Definir modalidad DX/TX/NM/CY y colocar equipos/fuentes con footprint real.',
      'Dibujar barreras, regiones ocupadas, zonas controladas y puntos criticos.',
      'Ejecutar calculos por modalidad y revisar evidencia numerica.',
      'Revisar heatmap, isocontornos, mapa clinico F164 y visor Medical 3D.',
      'Generar Memoria IA, anexo de materiales, PDF y Evidence Pack.',
      'Ejecutar smoke F154-F159/F163-F165 antes de deploy final.',
    ],
  },
  {
    title: '2. Canvas y floorplan',
    lines: [
      'El canvas es la superficie principal de diseno; no debe duplicarse con menus paralelos.',
      'Usar snapping, capas, cotas, grips, seleccion multiple y overlays de heatmap para QA.',
      'Los simbolos de equipos deben conservar footprint, rotacion, modalidad y fabricante cuando exista.',
      'El mapa clinico F164 es una salida ejecutiva derivada del floorplan; no sustituye edicion CAD ni memoria numerica.',
      'El visor 3D debe usarse como inspeccion visual de relaciones espaciales, espesores, acabados y zonas.',
    ],
  },
  {
    title: '3. Calculo y evidencia',
    lines: [
      'Cada resultado de blindaje debe conservar input, output, formula, norma, fuente documental y version.',
      'NCRP 147 aplica principalmente a diagnostico; NCRP 151 a radioterapia; TG-108/IPEM/ICRP a medicina nuclear segun perfil.',
      'Las salidas con IA son auxiliares y deben conservar cita, pagina, hash documental y advertencia de validacion.',
      'Antes de release estable, repetir QA numerico contra casos conocidos NCRP/IAEA/UAQ y memorias previas anonimizadas.',
    ],
  },
  {
    title: '4. RAG, documentos y OCR',
    lines: [
      'No reingresar documentos ya versionados si el hash coincide.',
      'Si un PDF tiene OCR incompleto, resubir version searchable o procesar OCR antes de seed live.',
      'Priorizar fuentes canonicas: NCRP/IAEA/AAPM/ICRP/UAQ, despues memorias analiticas validadas y por ultimo fichas comerciales.',
      'El ledger de citas debe deduplicar por hash, titulo normalizado, pagina y fragmento.',
    ],
  },
  {
    title: '5. DB y deploy',
    lines: [
      'La DB live debe activarse con DATABASE_URL fuera del repo y secretos productivos fuera del paquete.',
      'MySQL local Windows es aceptable para validacion; Docker no es requisito si el servicio local responde.',
      'Antes de publicar: backup DB, restore probe, seed controlado, smoke backend, smoke frontend y smoke URL publica.',
      'Si no hay URL publica final, el estado correcto es paquete controlado/local listo, no release publico final.',
    ],
  },
  {
    title: '6. Update App y control de versiones',
    lines: [
      'Update App debe mostrar estado de fases, DB, RAG, canvas, 3D, deploy y pendientes residuales.',
      'El changelog debe separar cambios de calculo, UI, documentos, DB y deploy.',
      'Manual de versiones debe registrar la fase, evidencia, scripts de preparacion y scripts de prueba.',
      'Auditoria tecnica debe conservar riesgos residuales y criterios de GO/NO-GO.',
    ],
  },
];

const generatedAt = new Date().toISOString();
const manual = [
  '# F161 - Manuales In Extenso Predeploy',
  '',
  `Generado: ${generatedAt}`,
  '',
  'Este documento consolida operacion, usuario, versiones, control de cambios y criterios minimos antes del deploy final.',
  '',
  ...sections.flatMap((section) => [
    `## ${section.title}`,
    '',
    ...section.lines.map((line) => `- ${line}`),
    '',
  ]),
  '## 7. Checklist final',
  '',
  '- Build productivo completado.',
  '- Contratos F161/F164/F165/F159 completados.',
  '- App abierta y revisada visualmente.',
  '- Paquete local/hosting regenerado.',
  '- URL final pendiente de disponibilidad de git/hosting remoto.',
  '',
].join('\n');

const manifest = {
  phase: 'F161',
  title: 'Manuales in extenso predeploy',
  generatedAt,
  schema: 'radshield-mx.manuals-in-extenso.f161.v1',
  status: 'manuals-ready',
  manuals: [
    'MANUAL_USUARIO_v99.md',
    'MANUAL_VERSIONES_v50.md',
    'CHANGELOG.md',
    'CONTROL_DE_CAMBIOS_v99.md',
    'AUDITORIA_TECNICA_v46.md',
    'outputs/f161_manuales_in_extenso/MANUAL_OPERACION_PREDEPLOY_F161.md',
  ],
  requiredSections: sections.map((section) => section.title),
  releaseUse:
    'Use F161 as the operator-facing predeploy runbook and keep legacy manuals as historical/versioned references.',
};

fs.writeFileSync(manualPath, manual, 'utf8');
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  mdPath,
  [
    '# F161 - Manuales In Extenso',
    '',
    `Generado: ${generatedAt}`,
    `Estado: ${manifest.status}`,
    '',
    '## Documentos Cubiertos',
    '',
    ...manifest.manuals.map((item) => `- ${item}`),
    '',
    '## Secciones',
    '',
    ...manifest.requiredSections.map((item) => `- ${item}`),
    '',
  ].join('\n'),
  'utf8',
);

console.log(`F161 manuals written: ${path.relative(root, manifestPath)}`);
console.log(`Status: ${manifest.status}`);
