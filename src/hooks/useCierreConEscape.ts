/**
 * Cierre con Escape de las ventanas modales propias (DialogShell, FullscreenShell y las que usan CapaModal).
 *
 * Los diálogos de Radix (`DialogContent`) ya cerraban con Escape; las ventanas propias no (QA de la Fase 12: 19 ventanas
 * con `role="dialog" aria-modal` que sólo se cerraban con la X). Reglas:
 *
 * - Escape cierra SÓLO la capa más alta: una pila de ventanas propias (la última montada manda) y, por encima de ella,
 *   cualquier capa ajena abierta (diálogo o menú de Radix, `role="alertdialog"`, otro `aria-modal`) dentro de la ventana o
 *   posterior en el DOM. Radix cierra sus capas en fase de captura y marca el evento con `preventDefault`, así que una
 *   pulsación que ya cerró un menú o un subdiálogo no llega a cerrar la ventana de abajo.
 * - Quien ya usó la tecla (un editor que cancela su edición con `preventDefault`/`stopPropagation`, un combobox abierto
 *   `aria-expanded="true"`, o cualquier zona marcada con `data-escape-propio`) la conserva.
 * - Con `exigirFocoDentro` (ventana minimizada que deja pasar el puntero) sólo cierra si el foco está dentro: Escape en el
 *   lienzo de detrás sigue cancelando la herramienta del lienzo. Sin ella la ventana cubre la página (`aria-modal`) y
 *   Escape la cierra aunque el foco haya quedado fuera (p. ej. en el botón del menú que la abrió).
 * - `confirmarCierre` permite pedir confirmación (patrón `window.confirm` de la app) si hay cambios sin guardar.
 * - Cuando la ventana cierra con Escape, la tecla se consume (`stopPropagation`): el oyente único del diseñador
 *   (`atajosTeclado.ts`, acción «cancelar») no la recibe también.
 * - Foco: al abrir pasa a la ventana (si el contenido no lo tomó ya; también si el menú de Radix que la abrió lo devuelve
 *   a su botón justo después) y al cerrar vuelve al disparador; si el disparador era un elemento de un menú que ya no
 *   existe, vuelve al botón que abrió ese menú.
 */
import { useEffect, useRef, type RefObject } from 'react';

export interface OpcionesCierreConEscape {
  /** Se llama al pulsar Escape cuando esta ventana es la capa más alta. */
  onCerrar: () => void;
  /** Devuelve `false` para no cerrar (p. ej. el usuario canceló «¿Descartar cambios?»). */
  confirmarCierre?: () => boolean;
  /** Sólo cierra si el foco está dentro de la ventana (ventanas minimizadas que dejan pasar el puntero). */
  exigirFocoDentro?: boolean;
  /** Desactiva el cierre con Escape sin desmontar la ventana. */
  desactivado?: boolean;
}

interface EntradaPila {
  readonly id: number;
  readonly contenedor: RefObject<HTMLElement | null>;
}

const pila: EntradaPila[] = [];
let siguienteId = 1;

/** Capas ajenas que, abiertas encima, se quedan con el Escape. */
const SELECTOR_CAPAS = [
  '[role="dialog"][aria-modal="true"]',
  '[role="dialog"][data-state="open"]',
  '[role="alertdialog"]',
  '[role="menu"][data-state="open"]',
  '[role="listbox"][data-state="open"]',
].join(',');

/** Sólo para pruebas: número de ventanas registradas. */
export function ventanasConEscapeAbiertas(): number {
  return pila.length;
}

function esLaMasAlta(id: number): boolean {
  return pila.length > 0 && pila[pila.length - 1].id === id;
}

function hayCapaAjenaEncima(propio: HTMLElement): boolean {
  const registrados = pila.map((e) => e.contenedor.current).filter((el): el is HTMLElement => Boolean(el));
  for (const el of Array.from(document.querySelectorAll(SELECTOR_CAPAS))) {
    if (el === propio || registrados.includes(el as HTMLElement)) continue;
    // Capas dentro de OTRA ventana registrada (y no dentro de ésta) las gobierna esa ventana.
    if (!propio.contains(el) && registrados.some((r) => r !== propio && r.contains(el))) continue;
    if (propio.contains(el)) return true;
    if (propio.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) return true;
  }
  return false;
}

function usaEscapePropio(destino: EventTarget | null): boolean {
  if (typeof Element === 'undefined' || !(destino instanceof Element)) return false;
  if (destino.closest('[data-escape-propio]')) return true;
  return destino.getAttribute('aria-expanded') === 'true';
}

/** Elemento al que devolver el foco: el disparador o, si era un elemento de menú, el botón que abrió el menú. */
function destinoDelFoco(previo: Element | null): HTMLElement | null {
  if (!(previo instanceof HTMLElement) || previo === document.body) return null;
  const menu = previo.closest('[role="menu"]');
  if (menu) {
    const ids = (menu.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
    for (const id of ids) {
      const boton = document.getElementById(id);
      if (boton) return boton;
    }
  }
  return previo;
}

export function useCierreConEscape(contenedor: RefObject<HTMLElement | null>, opciones: OpcionesCierreConEscape): void {
  const opcionesRef = useRef(opciones);
  useEffect(() => {
    opcionesRef.current = opciones;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = siguienteId++;
    pila.push({ id, contenedor });

    const previo = document.activeElement;
    const retorno = destinoDelFoco(previo);
    const propio = contenedor.current;
    const enfocar = () => {
      const activo = document.activeElement;
      if (!propio || !propio.isConnected || propio.contains(activo)) return;
      // Sólo si el foco está en nada o en el disparador: no se lo quita a una capa que se abrió después.
      if (activo && activo !== document.body && activo !== previo && activo !== retorno) return;
      propio.focus({ preventScroll: true });
    };
    enfocar();
    // Al elegir un elemento de un menú de Radix, el menú devuelve el foco a su botón al terminar de cerrarse, ya con la
    // ventana montada: si el foco vuelve al disparador (tapado por la ventana), se recupera.
    const alEnfocar = (e: FocusEvent) => {
      if (!esLaMasAlta(id) || opcionesRef.current.exigirFocoDentro) return;
      if (e.target !== previo && e.target !== retorno) return;
      enfocar();
    };
    document.addEventListener('focusin', alEnfocar);

    const oyente = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' && e.key !== 'Esc') return;
      if (e.defaultPrevented || e.isComposing) return;
      const { onCerrar, confirmarCierre, exigirFocoDentro, desactivado } = opcionesRef.current;
      if (desactivado || !esLaMasAlta(id)) return;
      const el = contenedor.current;
      if (!el) return;
      if (usaEscapePropio(e.target)) return;
      const destino = e.target instanceof Node ? e.target : null;
      const focoDentro = Boolean(destino && el.contains(destino));
      if (!focoDentro && exigirFocoDentro) return;
      if (hayCapaAjenaEncima(el)) return;
      e.preventDefault();
      e.stopPropagation();
      if (confirmarCierre && !confirmarCierre()) return;
      onCerrar();
    };
    document.addEventListener('keydown', oyente);

    return () => {
      document.removeEventListener('focusin', alEnfocar);
      document.removeEventListener('keydown', oyente);
      const i = pila.findIndex((e) => e.id === id);
      if (i >= 0) pila.splice(i, 1);
      const activo = document.activeElement;
      const focoPerdido = !activo || activo === document.body || (propio ? propio.contains(activo) : false) || !activo.isConnected;
      if (focoPerdido && retorno && retorno.isConnected) {
        retorno.focus({ preventScroll: true });
      }
    };
  }, [contenedor]);
}
