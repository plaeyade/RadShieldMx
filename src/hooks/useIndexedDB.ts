/**
 * useIndexedDB — Cache persistente de resultados y planos
 * IndexedDB para almacenar proyectos, resultados de cálculo, y heatmaps
 * Chrome 24+, Firefox 16+, Safari 10+
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const DB_NAME = 'RadShieldMX';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_RESULTS = 'calculation-results';
const STORE_HEATMAPS = 'heatmaps';

interface CachedProject {
  id: string;
  name: string;
  data: any;
  timestamp: number;
  thumbnail?: string;
}

interface CachedResult {
  id: string;
  type: string;
  result: any;
  timestamp: number;
  inputHash: string;
}

let dbInstance: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_RESULTS)) {
        const resultStore = db.createObjectStore(STORE_RESULTS, { keyPath: 'id' });
        resultStore.createIndex('type', 'type', { unique: false });
        resultStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_HEATMAPS)) {
        db.createObjectStore(STORE_HEATMAPS, { keyPath: 'id' });
      }
    };
  });
}

export function useIndexedDB() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (typeof indexedDB === 'undefined') {
        setIsAvailable(false);
        return;
      }
      try {
        await openDB();
        setIsAvailable(true);
        setIsReady(true);
      } catch {
        setIsAvailable(false);
      }
    };
    check();
  }, []);

  /** Guardar proyecto */
  const saveProject = useCallback(async (project: CachedProject): Promise<void> => {
    if (!isAvailable) return;
    const db = await openDB();
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    await store.put({ ...project, timestamp: Date.now() });
    toast.success(`Proyecto "${project.name}" guardado en cache`);
  }, [isAvailable]);

  /** Cargar proyecto */
  const loadProject = useCallback(async (id: string): Promise<CachedProject | null> => {
    if (!isAvailable) return null;
    const db = await openDB();
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    return new Promise((resolve) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }, [isAvailable]);

  /** Listar proyectos */
  const listProjects = useCallback(async (): Promise<CachedProject[]> => {
    if (!isAvailable) return [];
    const db = await openDB();
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }, [isAvailable]);

  /** Guardar resultado de cálculo */
  const saveResult = useCallback(async (result: CachedResult): Promise<void> => {
    if (!isAvailable) return;
    const db = await openDB();
    const tx = db.transaction(STORE_RESULTS, 'readwrite');
    const store = tx.objectStore(STORE_RESULTS);
    await store.put({ ...result, timestamp: Date.now() });
  }, [isAvailable]);

  /** Buscar resultado por input hash (cache hit) */
  const getCachedResult = useCallback(async (inputHash: string): Promise<CachedResult | null> => {
    if (!isAvailable) return null;
    const db = await openDB();
    const tx = db.transaction(STORE_RESULTS, 'readonly');
    const store = tx.objectStore(STORE_RESULTS);
    return new Promise((resolve) => {
      const req = store.get(inputHash);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }, [isAvailable]);

  /** Limpiar cache antiguo (>30 días) */
  const cleanupOldCache = useCallback(async (): Promise<number> => {
    if (!isAvailable) return 0;
    const db = await openDB();
    const tx = db.transaction(STORE_RESULTS, 'readwrite');
    const store = tx.objectStore(STORE_RESULTS);
    const index = store.index('timestamp');
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let deleted = 0;

    return new Promise((resolve) => {
      const req = index.openCursor();
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor && cursor.value.timestamp < cutoff) {
          cursor.delete();
          deleted++;
          cursor.continue();
        } else {
          resolve(deleted);
        }
      };
      req.onerror = () => resolve(deleted);
    });
  }, [isAvailable]);

  return {
    isAvailable,
    isReady,
    saveProject,
    loadProject,
    listProjects,
    saveResult,
    getCachedResult,
    cleanupOldCache,
  };
}
