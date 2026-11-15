/**
 * Fase 12, paso 2 — un solo oyente de teclado para el diseñador.
 *
 * Antes había dos oyentes `keydown` en `window` (los atajos de la Recomendación #8 y otro para
 * Ctrl+Z/Ctrl+Y/Ctrl+Shift+Z/?/Ctrl+K/Ctrl+H) y ambos llamaban a `undo()`/`redo()`: cada pulsación de Ctrl+Z
 * deshacía dos pasos y cada Ctrl+Y rehacía dos. Ctrl+K abría la paleta con uno y la cerraba con el otro.
 *
 * `resolverAtajo` traduce la tecla a una acción (función pura, probada aparte) y `useAtajosTeclado` registra
 * UN oyente que llama a la acción del último render (sin funciones obsoletas, como en la Fase 11).
 */
import { useEffect, useRef } from 'react';

export type AccionAtajo =
  | 'herramientaBarrera' | 'herramientaFuente' | 'herramientaSeleccion' | 'herramientaMedir' | 'herramientaPan'
  | 'herramientaRegion' | 'cancelar'
  | 'calcular'
  | 'guardar' | 'abrir'
  | 'barreraRapida' | 'laberinto'
  | 'deshacer' | 'rehacer'
  | 'paletaComandos' | 'panelHistorial' | 'panelAyuda' | 'atajos';

export interface TeclaAtajo {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

/** Acción del atajo o `null` si la tecla no es un atajo del diseñador. */
export function resolverAtajo(e: TeclaAtajo): AccionAtajo | null {
  const tecla = e.key.toLowerCase();
  const ctrl = Boolean(e.ctrlKey || e.metaKey);
  const shift = Boolean(e.shiftKey);
  if (e.altKey) return null;

  // «?» (Shift + /): diálogo de atajos.
  if (!ctrl && (e.key === '?' || (shift && e.key === '/'))) return 'atajos';

  if (!ctrl) {
    if (shift) return null;
    switch (tecla) {
      case 'b': return 'herramientaBarrera';
      case 'f': return 'herramientaFuente';
      case 's': return 'herramientaSeleccion';
      case 'm': return 'herramientaMedir';
      case 'h': return 'herramientaPan';
      case 'escape': return 'cancelar';
      case 'f5': return 'calcular';
      default: return null;
    }
  }

  if (shift) {
    switch (tecla) {
      case 'z': return 'rehacer';
      case 'h': return 'panelAyuda';
      default: return null;
    }
  }

  switch (tecla) {
    case 'z': return 'deshacer';
    case 'y': return 'rehacer';
    case 's': return 'guardar';
    case 'o': return 'abrir';
    case 'b': return 'barreraRapida';
    case 'l': return 'laberinto';
    case 'k': return 'paletaComandos';
    case 'h': return 'panelHistorial';
    case 'g': return 'herramientaRegion';
    default: return null;
  }
}

/** Acciones que conservan el comportamiento del navegador (no se llama a `preventDefault`). */
const SIN_PREVENIR: ReadonlySet<AccionAtajo> = new Set(['cancelar']);

function esCampoDeTexto(destino: EventTarget | null): boolean {
  if (typeof HTMLElement === 'undefined' || !(destino instanceof HTMLElement)) return false;
  if (destino instanceof HTMLInputElement || destino instanceof HTMLTextAreaElement || destino instanceof HTMLSelectElement) return true;
  return destino.isContentEditable;
}

export type ManejadoresAtajo = Partial<Record<AccionAtajo, () => void>>;

/**
 * Registra el único oyente `keydown` del diseñador. `manejadores` puede cambiar en cada render: el oyente se
 * registra una vez y lee siempre la versión más reciente.
 */
export function useAtajosTeclado(manejadores: ManejadoresAtajo, destino: Window | null = typeof window === 'undefined' ? null : window) {
  const ref = useRef(manejadores);
  useEffect(() => {
    ref.current = manejadores;
  });
  useEffect(() => {
    if (!destino) return;
    const oyente = (e: KeyboardEvent) => {
      if (esCampoDeTexto(e.target)) return;
      const accion = resolverAtajo(e);
      if (!accion) return;
      const manejador = ref.current[accion];
      if (!manejador) return;
      if (!SIN_PREVENIR.has(accion)) e.preventDefault();
      manejador();
    };
    destino.addEventListener('keydown', oyente);
    return () => destino.removeEventListener('keydown', oyente);
  }, [destino]);
}
