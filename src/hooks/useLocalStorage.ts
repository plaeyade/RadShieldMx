// Fase 5: Persistencia local — guardar/cargar proyectos de blindaje
import { useState, useCallback, useEffect } from 'react';
import type { FloorPlan } from '@/types/radshield';

export interface SavedProject {
  id: string;
  name: string;
  floorPlan: FloorPlan;
  createdAt: string;
  updatedAt: string;
  version: string; // RadShield-MX version
}

const STORAGE_KEY = 'radshield_mx_projects';
const CURRENT_KEY = 'radshield_mx_current';
const APP_VERSION = '1.2';

function getProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedProject[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: SavedProject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function useLocalStorage() {
  const [projects, setProjects] = useState<SavedProject[]>(getProjects);

  // Persist project list to localStorage whenever it changes
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const saveProject = useCallback((floorPlan: FloorPlan, name?: string): SavedProject => {
    const now = new Date().toISOString();
    const existing = projects.find(p => p.id === floorPlan.id);
    if (existing) {
      // Update existing
      const updated: SavedProject = {
        ...existing,
        name: name || floorPlan.name || existing.name,
        floorPlan,
        updatedAt: now,
      };
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      return updated;
    } else {
      // Create new
      const newProject: SavedProject = {
        id: floorPlan.id || `proj-${Date.now()}`,
        name: name || floorPlan.name || 'Proyecto sin nombre',
        floorPlan: { ...floorPlan, id: floorPlan.id || `proj-${Date.now()}` },
        createdAt: now,
        updatedAt: now,
        version: APP_VERSION,
      };
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    }
  }, [projects]);

  const loadProject = useCallback((projectId: string): SavedProject | null => {
    return projects.find(p => p.id === projectId) || null;
  }, [projects]);

  const deleteProject = useCallback((projectId: string): void => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  }, []);

  const renameProject = useCallback((projectId: string, newName: string): void => {
    setProjects(prev =>
      prev.map(p => p.id === projectId ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p)
    );
  }, []);

  const exportProjectJSON = useCallback((projectId: string): string => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return '{}';
    return JSON.stringify(proj, null, 2);
  }, [projects]);

  const importProjectJSON = useCallback((json: string): SavedProject | null => {
    try {
      const parsed = JSON.parse(json) as SavedProject;
      if (!parsed.floorPlan || !parsed.name) return null;
      const now = new Date().toISOString();
      const imported: SavedProject = {
        ...parsed,
        id: `proj-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        version: APP_VERSION,
      };
      setProjects(prev => [imported, ...prev]);
      return imported;
    } catch {
      return null;
    }
  }, []);

  // Auto-save current project to session storage
  const saveCurrent = useCallback((floorPlan: FloorPlan): void => {
    try {
      sessionStorage.setItem(CURRENT_KEY, JSON.stringify(floorPlan));
    } catch { /* ignore quota exceeded */ }
  }, []);

  const loadCurrent = useCallback((): FloorPlan | null => {
    try {
      const raw = sessionStorage.getItem(CURRENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  return {
    projects,
    saveProject,
    loadProject,
    deleteProject,
    renameProject,
    exportProjectJSON,
    importProjectJSON,
    saveCurrent,
    loadCurrent,
  };
}
