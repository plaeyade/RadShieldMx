import fs from 'node:fs';
import crypto from 'node:crypto';

const outDir = 'outputs/f324_pointer_lock_walkthrough';
fs.mkdirSync(outDir, { recursive: true });

const read = (file) => fs.readFileSync(file, 'utf8');
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const dialog = read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');

const manifest = {
  schema: 'radshield-mx.phase-manifest.v1',
  phase: 'F324',
  title: 'Pointer-lock walkthrough and mouse-look',
  status: 'pointer-lock-walkthrough-ready',
  generatedAt: new Date().toISOString(),
  scope:
    'Add optional mouse-look to the Medical 3D walkthrough while preserving keyboard controls, room bounds and Three/R3F fallback.',
  controls: [
    'Recorrido WASD enables first-person navigation.',
    'Mouse-look can be enabled only when walkthrough is active.',
    'Click inside the 3D workbench requests pointer lock.',
    'Esc releases pointer lock using browser-native behavior.',
    'Mouse movement controls yaw/pitch with pitch clamp.',
    'Shift accelerates, Ctrl slows down, R/F adjusts eye height.',
  ],
  safety: [
    'Pointer lock is opt-in and disabled when walkthrough is off.',
    'Camera remains bounded inside the room footprint.',
    'No calculation, report or RAG data is changed by mouse-look.',
    'OrbitControls remain available when walkthrough is disabled.',
  ],
  sourceChecks: {
    hasPointerLockState: dialog.includes('mouseLookEnabled') && dialog.includes('mouseLookLocked'),
    hasPointerLockRequest: dialog.includes('requestPointerLock'),
    hasPointerLockExit: dialog.includes('exitPointerLock'),
    hasPointerLockChange: dialog.includes('pointerlockchange'),
    hasMouseMoveLook: dialog.includes('event.movementX') && dialog.includes('event.movementY'),
    hasPitchClamp: dialog.includes('pitch.current') && dialog.includes('THREE.MathUtils.clamp'),
    hasUiContract: dialog.includes('f324-pointer-lock-control') && dialog.includes('f324-pointer-lock-workbench'),
  },
  postF324Next: [
    { phase: 'F325', title: 'Collision and navigation mesh', dependency: 'Requires wall/equipment collision volumes.' },
    { phase: 'F326', title: 'PBR material library', dependency: 'Can start in Three/R3F without Babylon packages.' },
    { phase: 'F327', title: 'Photoreal lighting presets', dependency: 'Needs calibrated clinical light presets and snapshot QA.' },
  ],
  fileHashes: {
    medical3DDialog: hash(dialog),
  },
  blockers: [],
};

fs.writeFileSync(`${outDir}/f324_pointer_lock_walkthrough.json`, JSON.stringify(manifest, null, 2));
fs.writeFileSync(
  'outputs/fase_324_pointer_lock_walkthrough.md',
  `# F324 - Pointer-lock walkthrough\n\nStatus: ${manifest.status}\n\nMouse-look queda disponible en Medical 3D como control opcional dentro de recorrido WASD. Esc libera el cursor y OrbitControls siguen disponibles fuera del recorrido.\n`,
);

console.log(`F324 manifest written to ${outDir}/f324_pointer_lock_walkthrough.json`);
