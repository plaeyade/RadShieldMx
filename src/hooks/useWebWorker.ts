/**
 * useWebWorker — Hook para ejecutar cálculos de blindaje en Web Worker
 * No bloquea el UI thread durante cálculos intensivos
 */
import { useState, useEffect, useRef, useCallback } from 'react';

interface WorkerTask {
  id: string;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

export function useWebWorker() {
  const [isReady, setIsReady] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastElapsedMs, setLastElapsedMs] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const tasksRef = useRef<Map<string, WorkerTask>>(new Map());

  useEffect(() => {
    try {
      // Create worker from the TypeScript file (Vite handles this)
      const worker = new Worker(
        new URL('../workers/shieldingWorker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event: MessageEvent) => {
        const { id, result, elapsedMs, type } = event.data;
        if (type === 'error') {
          const task = tasksRef.current.get(id);
          if (task) { task.reject(new Error(result)); tasksRef.current.delete(id); }
        } else {
          const task = tasksRef.current.get(id);
          if (task) { task.resolve(result); tasksRef.current.delete(id); }
        }
        setLastElapsedMs(elapsedMs || 0);
        if (tasksRef.current.size === 0) setIsCalculating(false);
      };

      worker.onerror = (err) => {
        console.error('Worker error:', err);
        setIsCalculating(false);
      };

      workerRef.current = worker;
      setIsReady(true);

      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    } catch (err) {
      console.warn('Web Worker creation failed:', err);
      // Graceful degradation: calculations will run on main thread
      setIsReady(false);
    }
  }, []);

  const postMessage = useCallback((type: string, payload: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      // If worker not available, calculate on main thread
      if (!workerRef.current) {
        reject(new Error('Worker not available'));
        return;
      }

      const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      tasksRef.current.set(id, { id, resolve, reject });
      setIsCalculating(true);

      workerRef.current.postMessage({ id, type, payload });
    });
  }, []);

  return { isReady, isCalculating, lastElapsedMs, postMessage };
}
