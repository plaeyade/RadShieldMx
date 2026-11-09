/**
 * Asignación automática de material por nombre de pieza CAD (CADAssemblyMapper). Fase 8d: antes eran
 * expresiones sin anclar (/w/, /al/, /pe/, /fe/, /cu/) evaluadas en orden con «wall» primero, así que
 * «Water» salía tungsteno, «Hall» aluminio, «Wall_Steel» concreto y «Concrete» aire. Ahora se compara por
 * palabras completas (separadas por _, -, espacio, dígitos o camelCase) y el material específico gana al genérico.
 */
export type CodigoMaterialCad =
  | 'M001' | 'M002' | 'M003' | 'M004' | 'M005' | 'M006' | 'M007' | 'M008' | 'M009' | 'M010' | 'M011' | 'M012' | 'M013';

/** Palabras del nombre en minúsculas. */
export function palabrasPieza(nombre: string): string[] {
  return nombre
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-záéíóúñ]+/)
    .filter(Boolean);
}

const tiene = (p: string[], ...claves: string[]) => p.some((w) => claves.includes(w));
const empieza = (p: string[], ...prefijos: string[]) => p.some((w) => prefijos.some((x) => w.startsWith(x)));

/** Reglas en orden de prioridad: combinaciones y materiales específicos antes que «muro». */
const REGLAS: Array<{ material: CodigoMaterialCad; prueba: (p: string[]) => boolean }> = [
  { material: 'M013', prueba: (p) => tiene(p, 'glass', 'vidrio') && tiene(p, 'lead', 'plomo', 'pb', 'plomado') },
  { material: 'M003', prueba: (p) => empieza(p, 'barit') },
  { material: 'M008', prueba: (p) => empieza(p, 'borat', 'borad') || tiene(p, 'bpe') },
  { material: 'M004', prueba: (p) => tiene(p, 'lead', 'plomo', 'pb') },
  { material: 'M006', prueba: (p) => tiene(p, 'tungsten', 'tungsteno', 'wolfram', 'w') },
  { material: 'M005', prueba: (p) => tiene(p, 'steel', 'acero', 'fe', 'iron', 'hierro') },
  { material: 'M007', prueba: (p) => empieza(p, 'polyethyl', 'polietil') || tiene(p, 'poly', 'pe', 'hdpe') },
  { material: 'M009', prueba: (p) => tiene(p, 'water', 'agua', 'phantom', 'fantoma', 'maniqui') },
  { material: 'M010', prueba: (p) => empieza(p, 'alumin') || tiene(p, 'al') },
  { material: 'M011', prueba: (p) => tiene(p, 'copper', 'cobre', 'cu') },
  { material: 'M012', prueba: (p) => tiene(p, 'brass', 'laton', 'latón') },
  { material: 'M001', prueba: (p) => tiene(p, 'air', 'aire', 'void', 'vacio', 'vacío', 'cavity', 'cavidad') },
  {
    material: 'M002',
    prueba: (p) => tiene(p, 'concrete', 'concreto', 'hormigon', 'hormigón', 'wall', 'pared', 'muro', 'bunker', 'búnker', 'shield', 'shielding', 'slab', 'losa', 'floor', 'piso'),
  },
];

/** Material MCNP sugerido para la pieza; aire si no hay pista. */
export function mapearNombrePieza(nombre: string): CodigoMaterialCad {
  const p = palabrasPieza(nombre);
  return REGLAS.find((r) => r.prueba(p))?.material ?? 'M001';
}
