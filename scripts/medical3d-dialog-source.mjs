// Fase 8d: MedicalFloorPlan3DDialog se dividió en src/sections/dialogs/medical3d/.
// Los guardianes de contrato que buscaban marcadores en el archivo del diálogo leen aquí
// el diálogo más todos sus módulos, para que los marcadores sigan encontrándose.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export const MEDICAL3D_DIALOG = 'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx';
export const MEDICAL3D_DIR = 'src/sections/dialogs/medical3d';

function listar(dir) {
  return readdirSync(dir).sort().flatMap((nombre) => {
    const ruta = path.join(dir, nombre);
    return statSync(ruta).isDirectory() ? listar(ruta) : /\.tsx?$/.test(nombre) ? [ruta] : [];
  });
}

/** Texto del diálogo Medical 3D y de sus módulos (relativo a `root`). */
export function readMedical3DDialogSource(root = process.cwd()) {
  const archivos = [path.join(root, MEDICAL3D_DIALOG), ...listar(path.join(root, MEDICAL3D_DIR))];
  return archivos.map((f) => readFileSync(f, 'utf8')).join('\n');
}
