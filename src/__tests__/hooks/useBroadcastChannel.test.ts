// Depuración etapa 4b: el identificador de pestaña pasó de `useRef(\`tab-${Date.now()}…\`)` (impuro en cada render)
// a un inicializador perezoso de `useState`. Fija que sigue siendo único por instancia, estable entre renders y
// el mismo que viaja en los mensajes del canal.
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBroadcastChannel } from '@/hooks/useBroadcastChannel';

type Mensaje = { type: string; tabId: string; timestamp: number; payload?: unknown };

class CanalFalso {
  static instancias: CanalFalso[] = [];
  enviados: Mensaje[] = [];
  cerrado = false;
  constructor(public name: string) { CanalFalso.instancias.push(this); }
  postMessage(m: Mensaje) { this.enviados.push(m); }
  addEventListener() {}
  removeEventListener() {}
  close() { this.cerrado = true; }
}

describe('useBroadcastChannel — tabId', () => {
  const original = globalThis.BroadcastChannel;
  beforeEach(() => {
    CanalFalso.instancias = [];
    (globalThis as { BroadcastChannel: unknown }).BroadcastChannel = CanalFalso;
  });
  afterEach(() => {
    (globalThis as { BroadcastChannel: unknown }).BroadcastChannel = original;
    vi.restoreAllMocks();
  });

  it('es estable entre renders y tiene el formato tab-<ms>-<6 caracteres>', () => {
    const { result, rerender } = renderHook(() => useBroadcastChannel());
    const primero = result.current.tabId;
    expect(primero).toMatch(/^tab-\d+-[a-z0-9]{1,6}$/);
    rerender();
    rerender();
    expect(result.current.tabId).toBe(primero);
  });

  it('el ping inicial y broadcast() usan el mismo tabId que devuelve el hook', () => {
    const { result, unmount } = renderHook(() => useBroadcastChannel());
    const canal = CanalFalso.instancias[0];
    expect(canal.enviados[0]).toMatchObject({ type: 'ping', tabId: result.current.tabId });
    act(() => result.current.broadcast('barrier-added', { id: 'b1' }));
    expect(canal.enviados.at(-1)).toMatchObject({ type: 'barrier-added', tabId: result.current.tabId, payload: { id: 'b1' } });
    unmount();
    expect(canal.cerrado).toBe(true);
  });

  it('dos instancias tienen identificadores distintos', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const a = renderHook(() => useBroadcastChannel());
    const b = renderHook(() => useBroadcastChannel());
    expect(a.result.current.tabId).not.toBe(b.result.current.tabId);
  });
});
