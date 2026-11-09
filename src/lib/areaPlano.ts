/**
 * Área de la sala de cada equipo para el validador de planos (Fase 8d).
 *
 * Antes se suponía un lienzo fijo de 1200×800 px y, tras la primera corrección, el rectángulo que contiene todas las
 * barreras; en un plano con varias salas ese rectángulo abarca todas y sobrestima el área (no conservador frente a un
 * área mínima). Ahora el área sale del contorno cerrado de barreras que encierra la fuente:
 *   1. los extremos se unen con una tolerancia (`tolerancia_m`) y los muros se parten en las uniones en T;
 *   2. se recorren las caras del grafo plano (semiaristas ordenadas por ángulo);
 *   3. de las caras que contienen la fuente se toma la de menor área (la sala, no el edificio), con la fórmula de
 *      Gauss (lazada): A = ½·|Σ (xᵢ·yᵢ₊₁ − xᵢ₊₁·yᵢ)|.
 * Si la fuente no queda dentro de ningún contorno cerrado (puertas sin dibujar, muros que no cierran, sin barreras)
 * no se estima nada: el validador pide capturar el área a mano y lo avisa.
 */
import type { Barrier } from '@/types/radshield';

export interface Punto { x: number; y: number }

export type AreaSala =
  | { area_m2: number; origen: 'contorno'; vertices: Punto[] }
  | { area_m2: number; origen: 'manual' }
  | { area_m2: null; origen: 'sin-contorno' };

/** Fórmula del área de Gauss (lazada) sobre un polígono simple; valor con signo según la orientación. */
export function areaGaussConSigno(p: Punto[]): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}

export const areaGauss = (p: Punto[]) => Math.abs(areaGaussConSigno(p));

/** Punto dentro de polígono (par-impar). */
export function puntoEnPoligono(q: Punto, p: Punto[]): boolean {
  let dentro = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const a = p[i], b = p[j];
    if ((a.y > q.y) !== (b.y > q.y) && q.x < ((b.x - a.x) * (q.y - a.y)) / (b.y - a.y) + a.x) dentro = !dentro;
  }
  return dentro;
}

/** Caras acotadas del grafo plano formado por las barreras (coordenadas en px). */
export function carasDeBarreras(barreras: Pick<Barrier, 'x1' | 'y1' | 'x2' | 'y2'>[], tol_px: number): Punto[][] {
  // 1. Nodos con tolerancia.
  const nodos: Punto[] = [];
  const nodo = (x: number, y: number) => {
    const i = nodos.findIndex((n) => Math.hypot(n.x - x, n.y - y) <= tol_px);
    if (i >= 0) return i;
    nodos.push({ x, y });
    return nodos.length - 1;
  };
  const tramos = barreras
    .map((b) => [nodo(b.x1, b.y1), nodo(b.x2, b.y2)] as const)
    .filter(([a, b]) => a !== b);

  // 2. Partir los muros en los nodos que caen sobre ellos (uniones en T).
  const aristas = new Set<string>();
  const clave = (a: number, b: number) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  for (const [a, b] of tramos) {
    const A = nodos[a], B = nodos[b];
    const L = Math.hypot(B.x - A.x, B.y - A.y);
    const sobre = nodos
      .map((n, i) => ({ i, t: ((n.x - A.x) * (B.x - A.x) + (n.y - A.y) * (B.y - A.y)) / (L * L), n }))
      .filter(({ i, t, n }) => i !== a && i !== b && t > 0 && t < 1
        && Math.abs((B.x - A.x) * (n.y - A.y) - (B.y - A.y) * (n.x - A.x)) / L <= tol_px)
      .sort((u, v) => u.t - v.t)
      .map(({ i }) => i);
    const cadena = [a, ...sobre, b];
    for (let k = 0; k + 1 < cadena.length; k++) aristas.add(clave(cadena[k], cadena[k + 1]));
  }

  // 3. Vecinos ordenados por ángulo y recorrido de caras por semiaristas.
  const vecinos = new Map<number, number[]>();
  for (const k of aristas) {
    const [a, b] = k.split('|').map(Number);
    (vecinos.get(a) ?? vecinos.set(a, []).get(a)!).push(b);
    (vecinos.get(b) ?? vecinos.set(b, []).get(b)!).push(a);
  }
  const ang = (u: number, v: number) => Math.atan2(nodos[v].y - nodos[u].y, nodos[v].x - nodos[u].x);
  for (const [u, vs] of vecinos) vs.sort((p, q) => ang(u, p) - ang(u, q));

  const usadas = new Set<string>();
  const caras: Punto[][] = [];
  for (const [u0, vs] of vecinos) {
    for (const v0 of vs) {
      if (usadas.has(`${u0}>${v0}`)) continue;
      const cara: number[] = [];
      let u = u0, v = v0;
      while (!usadas.has(`${u}>${v}`)) {
        usadas.add(`${u}>${v}`);
        cara.push(u);
        const nv = vecinos.get(v)!;
        const i = nv.indexOf(u);
        const w = nv[(i - 1 + nv.length) % nv.length]; // siguiente en sentido horario desde v→u
        u = v; v = w;
      }
      if (cara.length >= 3) {
        const poligono = cara.map((i) => nodos[i]);
        if (areaGauss(poligono) > 0) caras.push(poligono);
      }
    }
  }
  return caras;
}

/**
 * Área de la sala que contiene la fuente. `areaManual_m2` (> 0) sólo se usa cuando no hay contorno cerrado.
 */
export function areaSalaDeFuente(
  plano: { barriers?: Pick<Barrier, 'x1' | 'y1' | 'x2' | 'y2'>[] },
  fuente: Punto,
  escala_m_px: number,
  opciones: { areaManual_m2?: number; tolerancia_m?: number } = {},
): AreaSala {
  const manual = opciones.areaManual_m2;
  const sinContorno = (): AreaSala =>
    manual !== undefined && Number.isFinite(manual) && manual > 0 ? { area_m2: manual, origen: 'manual' } : { area_m2: null, origen: 'sin-contorno' };
  if (!(escala_m_px > 0)) return sinContorno();
  const tol_px = Math.max(1e-6, (opciones.tolerancia_m ?? 0.05) / escala_m_px);
  const candidatas = carasDeBarreras(plano.barriers ?? [], tol_px).filter((c) => puntoEnPoligono(fuente, c));
  if (!candidatas.length) return sinContorno();
  const sala = candidatas.reduce((m, c) => (areaGauss(c) < areaGauss(m) ? c : m));
  return { area_m2: areaGauss(sala) * escala_m_px * escala_m_px, origen: 'contorno', vertices: sala };
}
