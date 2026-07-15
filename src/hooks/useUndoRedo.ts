import { useState, useCallback } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface UndoRedoControls<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (initialState: T) => void;
}

/**
 * Hook de Undo/Redo con límite de historial.
 * Guarda snapshots profundos del estado. Ideal para FloorPlan.
 */
export function useUndoRedo<T>(initialState: T, options: { maxHistory?: number } = {}): UndoRedoControls<T> {
  const { maxHistory = 50 } = options;
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: []
  });

  const setState = useCallback((updater: T | ((prev: T) => T)) => {
    setHistory(prev => {
      const nextPresent = typeof updater === 'function'
        ? (updater as (prev: T) => T)(prev.present)
        : updater;

      // Si el estado no cambió, no guardar en historial
      if (JSON.stringify(prev.present) === JSON.stringify(nextPresent)) {
        return { ...prev, present: nextPresent };
      }

      const newPast = [...prev.past, prev.present];
      if (newPast.length > maxHistory) {
        newPast.shift(); // eliminar el más antiguo
      }

      return {
        past: newPast,
        present: nextPresent,
        future: [] // al hacer una acción nueva, se pierde el "future"
      };
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const reset = useCallback((newInitialState: T) => {
    setHistory({
      past: [],
      present: newInitialState,
      future: []
    });
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    reset
  };
}
