/**
 * Fase 12, paso 2 — menús por etapa, un solo «Calcular» y un solo oyente de teclado.
 *
 * Bug corregido: el diseñador registraba dos oyentes `keydown` y los dos llamaban a undo()/redo(); cada Ctrl+Z
 * deshacía dos pasos y cada Ctrl+Y rehacía dos. Ahora hay un único oyente (`useAtajosTeclado`).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolverAtajo, useAtajosTeclado } from '@/pages/designer/atajosTeclado';
import { useProyectoStore } from '@/stores/proyecto';
import Toolbar from '@/sections/Toolbar';

const RAIZ = path.resolve(__dirname, '../../..');
const leer = (p: string) => readFileSync(path.join(RAIZ, p), 'utf8');

afterEach(() => cleanup());

function tecla(key: string, mod: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {}, destino: EventTarget = window) {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mod });
  act(() => { destino.dispatchEvent(e); });
  return e;
}

describe('resolverAtajo', () => {
  it('deshacer/rehacer: Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z y Cmd en macOS', () => {
    expect(resolverAtajo({ key: 'z', ctrlKey: true })).toBe('deshacer');
    expect(resolverAtajo({ key: 'Z', metaKey: true })).toBe('deshacer');
    expect(resolverAtajo({ key: 'y', ctrlKey: true })).toBe('rehacer');
    expect(resolverAtajo({ key: 'Z', ctrlKey: true, shiftKey: true })).toBe('rehacer');
    expect(resolverAtajo({ key: 'z' })).toBeNull();
  });

  it('resto de atajos del diseñador', () => {
    expect(resolverAtajo({ key: 'F5' })).toBe('calcular');
    expect(resolverAtajo({ key: 's', ctrlKey: true })).toBe('guardar');
    expect(resolverAtajo({ key: 'k', ctrlKey: true })).toBe('paletaComandos');
    expect(resolverAtajo({ key: 'h', ctrlKey: true })).toBe('panelHistorial');
    expect(resolverAtajo({ key: 'H', ctrlKey: true, shiftKey: true })).toBe('panelAyuda');
    expect(resolverAtajo({ key: '?', shiftKey: true })).toBe('atajos');
    expect(resolverAtajo({ key: 'b' })).toBe('herramientaBarrera');
    expect(resolverAtajo({ key: 'Escape' })).toBe('cancelar');
    expect(resolverAtajo({ key: 'z', ctrlKey: true, altKey: true } as never)).toBeNull();
  });
});

describe('useAtajosTeclado: una pulsación = un paso', () => {
  beforeEach(() => {
    const s = useProyectoStore.getState();
    s.reset();
    for (const nombre of ['A', 'B', 'C']) s.setFloorPlan((p) => ({ ...p, name: nombre }));
  });

  it('Ctrl+Z deshace exactamente un paso y Ctrl+Y rehace exactamente uno', () => {
    const { undo, redo } = useProyectoStore.getState();
    renderHook(() => useAtajosTeclado({ deshacer: undo, rehacer: redo }));
    expect(useProyectoStore.getState().pasado).toHaveLength(3);

    const ez = tecla('z', { ctrlKey: true });
    expect(ez.defaultPrevented).toBe(true);
    expect(useProyectoStore.getState().floorPlan.name).toBe('B');
    expect(useProyectoStore.getState().pasado).toHaveLength(2);

    tecla('z', { ctrlKey: true });
    expect(useProyectoStore.getState().floorPlan.name).toBe('A');

    tecla('y', { ctrlKey: true });
    expect(useProyectoStore.getState().floorPlan.name).toBe('B');
    expect(useProyectoStore.getState().futuro).toHaveLength(1);

    tecla('Z', { ctrlKey: true, shiftKey: true });
    expect(useProyectoStore.getState().floorPlan.name).toBe('C');
    expect(useProyectoStore.getState().futuro).toHaveLength(0);
  });

  it('usa el manejador del último render y no actúa dentro de un campo de texto', () => {
    const a = vi.fn();
    const b = vi.fn();
    const { rerender } = renderHook(({ f }) => useAtajosTeclado({ deshacer: f }), { initialProps: { f: a } });
    rerender({ f: b });
    tecla('z', { ctrlKey: true });
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);

    const input = document.createElement('input');
    document.body.appendChild(input);
    tecla('z', { ctrlKey: true }, input);
    expect(b).toHaveBeenCalledTimes(1);
    input.remove();
  });

  it('el diseñador registra un solo oyente de teclado', () => {
    const sd = leer('src/pages/ShieldingDesigner.tsx');
    expect(sd.match(/addEventListener\('keydown'/g)).toBeNull();
    expect(sd.match(/useAtajosTeclado\(/g)).toHaveLength(1);
    // Ctrl+Z/Ctrl+Y no llaman a undo()/redo() fuera del gancho de atajos.
    expect(sd).not.toMatch(/e\.key === 'z'/);
  });
});

describe('Barra superior: 5 menús por etapa y un solo «Calcular»', () => {
  it('muestra los menús 1–5 en el orden del flujo, Ayuda, y un único botón «Calcular» que llama al cálculo', () => {
    const calcular = vi.fn();
    render(<Toolbar onCalculate={calcular} onGuiame={() => {}} floorPlan={{ barriers: [], sources: [] }} />);
    const etapas = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? '').filter((n) => /^\d\. /.test(n));
    expect(etapas).toEqual([
      '1. Proyecto y plano',
      '2. Fuentes y cargas de trabajo',
      '3. Barreras y materiales',
      '4. Verificación y cumplimiento',
      '5. Memoria analítica y CNSNS',
    ]);
    expect(screen.getByRole('button', { name: 'Ayuda' })).toBeTruthy();
    // Avanzado sólo con VITE_MENU_AVANZADO=true.
    expect(screen.queryByRole('button', { name: /Avanzado/ })).toBeNull();
    const botonesCalcular = screen.getAllByRole('button').filter((b) => /^\s*calc(ular)?\b/i.test(b.textContent ?? '') || /calcular/i.test(b.getAttribute('aria-label') ?? ''));
    expect(botonesCalcular).toHaveLength(1);
    act(() => { botonesCalcular[0].click(); });
    expect(calcular).toHaveBeenCalledTimes(1);
  });

  it('sin menús de respaldo ocultos ni entradas «Calcular» fuera de la barra superior', () => {
    const tb = leer('src/sections/Toolbar.tsx');
    expect(tb).not.toMatch(/f114-deduped-legacy-menu-zone|fallback F10\d/);
    expect(tb.match(/data-testid="f12-calcular"/g)).toHaveLength(1);
    expect(tb).not.toMatch(/label=\{t\('calc\.calculate'\)\}/);
    expect(leer('src/sections/Sidebar.tsx')).not.toMatch(/action: 'calculate'/);
    const lienzo = leer('src/sections/CanvasArea.tsx');
    // Queda sólo el menú contextual (acelerador, como F5 y la paleta de comandos).
    expect(lienzo).not.toMatch(/onClick=\{onRunCalculations\}|action: onRunCalculations/);
    expect(lienzo).not.toMatch(/f191d-action-calculate/);
  });

  it('un solo cuerpo de cálculo: el DXF confirmado y «Calcular» pasan por calcularPlano', () => {
    const sd = leer('src/pages/ShieldingDesigner.tsx');
    expect(sd.match(/calcularProyectoAsync\(/g)).toHaveLength(1);
    expect(sd.match(/await calcularPlano\(/g)).toHaveLength(2);
  });
});
