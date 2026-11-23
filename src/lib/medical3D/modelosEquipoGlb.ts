/**
 * Modelos GLB a escala real de los equipos (Fase 13): carga **opcional** en la escena Babylon del búnker.
 *
 * Los GLB (glTF 2.0, metros, +Y arriba, origen en el isocentro) están licenciados al propietario para uso
 * privado y viven en el repo privado `plaeyade/3D-Models` (`modelos/<equipo>/glb/<clave>_web.glb`). Este
 * repositorio es público y `public/` se despliega a Pages/Netlify/Vercel, así que **no se copian aquí**: la
 * app los pide a la ruta de `VITE_EQUIPO_GLB_BASE` (vacía por omisión → no se pide nada y se dibuja la
 * representación de siempre: caja de huella + toro de gantry). Ver `docs/MODELOS_EQUIPO_GLB.md`.
 */
import type { MedicalEquipment } from './sceneBuilder';

export type ClaveModeloGlb =
  | 'elekta_versa_hd'
  | 'elekta_leksell_gamma_knife'
  | 'siemens_biograph_trinion'
  | 'elekta_studio_braquiterapia';

export interface ModeloEquipoGlb {
  clave: ClaveModeloGlb;
  equipo: string;
  /** Archivo de la versión web (decimada) dentro de la ruta base. */
  archivo: string;
  /** Altura del isocentro sobre el piso (m): el origen del GLB va a esta altura sobre el piso de la escena. */
  alturaIsocentro_m: number;
  /** Ancho (X) × alto × fondo (Z) del modelo en m, de la ficha. */
  dimensiones_m: [number, number, number];
  /** Si la altura del isocentro es estimada (no es dato del fabricante). */
  isocentroEstimado: boolean;
  /** Texto (nombre, modalidad, variante) que identifica el equipo. */
  patron: RegExp;
  /** Modalidad de la escena a la que sirve de modelo por omisión cuando el texto no nombra otro fabricante. */
  kind: MedicalEquipment['kind'];
}

/** Datos de `fichas.json` (3D-Models, 2026-11-23). */
export const MODELOS_EQUIPO_GLB: readonly ModeloEquipoGlb[] = [
  {
    clave: 'elekta_versa_hd',
    equipo: 'Elekta Versa HD',
    archivo: 'elekta_versa_hd_web.glb',
    alturaIsocentro_m: 1.24,
    dimensiones_m: [3.2179, 2.4306, 3.4296],
    isocentroEstimado: false,
    patron: /versa|agility|elekta-versa-hd/i,
    kind: 'linac',
  },
  {
    clave: 'elekta_leksell_gamma_knife',
    equipo: 'Elekta Leksell Gamma Knife',
    archivo: 'elekta_leksell_gamma_knife_web.glb',
    alturaIsocentro_m: 0.967,
    dimensiones_m: [4.5179, 2.0139, 2.471],
    isocentroEstimado: true,
    patron: /gamma\s*knife|leksell|perfexion|esprit|\bicon\b/i,
    kind: 'gammaKnife',
  },
  {
    clave: 'siemens_biograph_trinion',
    equipo: 'Siemens Biograph Trinion (PET/CT)',
    archivo: 'siemens_biograph_trinion_web.glb',
    alturaIsocentro_m: 1.064,
    dimensiones_m: [2.2935, 1.9446, 5.6634],
    isocentroEstimado: false,
    patron: /trinion|biograph/i,
    kind: 'petct',
  },
  {
    clave: 'elekta_studio_braquiterapia',
    equipo: 'Elekta Studio (braquiterapia)',
    archivo: 'elekta_studio_braquiterapia_web.glb',
    alturaIsocentro_m: 1.117,
    dimensiones_m: [2.5977, 1.8502, 2.6327],
    isocentroEstimado: false,
    patron: /elekta\s*studio|flexitron|imagingring|braqui|brachy/i,
    kind: 'hdr',
  },
];

/** Fabricantes/modelos ajenos: si el texto los nombra no se usa el modelo por modalidad (no dibujar un Versa HD como TrueBeam). */
const OTRO_FABRICANTE = /varian|truebeam|halcyon|vitalbeam|ethos|clinac|primus|artiste|accuray|tomotherapy|cyberknife|\bge\b|discovery|vereos|philips|canon|united imaging|uih|bravos|gammamed|varisource|eckert|bebig|saginova|zap/i;

/** Modelo GLB del equipo: primero por nombre (perfil del equipo); si no, por modalidad cuando no se nombra otro fabricante. */
export function modeloGlbParaEquipo(equipo: Pick<MedicalEquipment, 'name' | 'kind'> & { ragTags?: readonly string[] }): ModeloEquipoGlb | null {
  const texto = [equipo.name, ...(equipo.ragTags ?? [])].join(' ');
  const porNombre = MODELOS_EQUIPO_GLB.find((m) => m.patron.test(texto));
  if (porNombre) return porNombre;
  if (OTRO_FABRICANTE.test(texto)) return null;
  return MODELOS_EQUIPO_GLB.find((m) => m.kind === equipo.kind) ?? null;
}

/** Ruta base de los GLB: `VITE_EQUIPO_GLB_BASE`; vacía → sin carga (respaldo a la representación actual). */
export function baseModelosGlb(valor: string | undefined = import.meta.env.VITE_EQUIPO_GLB_BASE): string | null {
  const v = (valor ?? '').trim();
  if (!v) return null;
  return v.endsWith('/') ? v : `${v}/`;
}

/** Guiñada adicional (grados) de `VITE_EQUIPO_GLB_ORIENTACION_DEG`; 0 si falta o no es número. */
export function orientacionPorOmisionGlb_deg(valor: string | undefined = import.meta.env.VITE_EQUIPO_GLB_ORIENTACION_DEG): number {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

export interface ColocacionModeloGlb {
  modelo: ModeloEquipoGlb;
  /** Carpeta (termina en `/`) y archivo, como los pide `ImportMeshAsync(rootUrl, archivo)`. */
  rootUrl: string;
  archivo: string;
  url: string;
  /** Posición del origen del GLB (= isocentro) en la escena: (x del equipo, altura del isocentro, z del equipo). */
  posicion: [number, number, number];
  /** Guiñada total (rad) = rotación del equipo en la escena + orientación configurable. */
  rotacionY: number;
}

/**
 * Dónde y cómo poner el GLB de un equipo. El isocentro del búnker es la posición del equipo (la fuente del
 * plano, en m = px × escala) a la altura del isocentro del modelo; el piso de la escena está en y = 0.
 * Devuelve `null` si no hay ruta base o no hay modelo para el equipo.
 */
export function colocacionModeloGlb(
  equipo: Pick<MedicalEquipment, 'name' | 'kind' | 'position' | 'rotationY'> & { ragTags?: readonly string[] },
  opciones: { base?: string | null; orientacion_deg?: number } = {},
): ColocacionModeloGlb | null {
  const base = opciones.base === undefined ? baseModelosGlb() : opciones.base ? baseModelosGlb(opciones.base) : null;
  if (!base) return null;
  const modelo = modeloGlbParaEquipo(equipo);
  if (!modelo) return null;
  const orientacion = opciones.orientacion_deg ?? orientacionPorOmisionGlb_deg();
  return {
    modelo,
    rootUrl: base,
    archivo: modelo.archivo,
    url: `${base}${modelo.archivo}`,
    posicion: [equipo.position[0], modelo.alturaIsocentro_m, equipo.position[2]],
    rotacionY: equipo.rotationY + (orientacion * Math.PI) / 180,
  };
}
