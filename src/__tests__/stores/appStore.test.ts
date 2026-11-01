/**
 * C.4 — Unit tests: Zustand appStore
 * Tests for dialog management, canvas state, calculation state
 */
import { resolverDialogo } from '@/stores/appStore';
import { describe, it, expect } from 'vitest';
import { useAppStore } from '@/stores/appStore';

// Helper to reset store between tests
function resetStore() {
  const s = useAppStore.getState();
  s.closeAll();
  s.setIsCalculating(false);
  s.setMcJob(null);
  s.setLastResult(null);
  s.setActiveTool('select');
  s.setShowSplash(false);
}

describe('appStore — Dialog Management', () => {
  it('all dialogs start closed', () => {
    resetStore();
    const { dialogs } = useAppStore.getState();
    const allClosed = Object.values(dialogs).every((v) => v === false);
    expect(allClosed).toBe(true);
  });

  it('open() sets a dialog to true', () => {
    resetStore();
    useAppStore.getState().open('export');
    expect(useAppStore.getState().dialogs['export']).toBe(true);
  });

  it('close() sets a dialog to false', () => {
    resetStore();
    useAppStore.getState().open('export');
    useAppStore.getState().close('export');
    expect(useAppStore.getState().dialogs['export']).toBe(false);
  });

  it('closeAll() closes all dialogs', () => {
    resetStore();
    useAppStore.getState().open('export');
    useAppStore.getState().open('cnsns');
    useAppStore.getState().open('mc');
    useAppStore.getState().closeAll();
    const { dialogs } = useAppStore.getState();
    expect(dialogs['export']).toBe(false);
    expect(dialogs['cnsns']).toBe(false);
    expect(dialogs['mc']).toBe(false);
  });

  it('can open multiple dialogs simultaneously', () => {
    resetStore();
    useAppStore.getState().open('export');
    useAppStore.getState().open('bibliography');
    expect(useAppStore.getState().dialogs['export']).toBe(true);
    expect(useAppStore.getState().dialogs['bibliography']).toBe(true);
  });

  it('has 170+ registered dialog names', () => {
    resetStore();
    const { dialogs } = useAppStore.getState();
    expect(Object.keys(dialogs).length).toBeGreaterThan(170);
  });
});

describe('appStore — Canvas State', () => {
  it('default active tool is "select"', () => {
    resetStore();
    expect(useAppStore.getState().activeTool).toBe('select');
  });

  it('setActiveTool changes the active tool', () => {
    resetStore();
    useAppStore.getState().setActiveTool('barrier');
    expect(useAppStore.getState().activeTool).toBe('barrier');
    // Reset for other tests
    useAppStore.getState().setActiveTool('select');
  });

  it('toggleSidebar flips sidebar state', () => {
    resetStore();
    useAppStore.getState().setActiveTool('select');
    const initial = useAppStore.getState().sidebarCollapsed;
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarCollapsed).toBe(!initial);
    // Reset
    useAppStore.getState().toggleSidebar();
  });
});

describe('appStore — Calculation State', () => {
  it('isCalculating starts false', () => {
    resetStore();
    expect(useAppStore.getState().isCalculating).toBe(false);
  });

  it('setIsCalculating updates state', () => {
    resetStore();
    useAppStore.getState().setIsCalculating(true);
    expect(useAppStore.getState().isCalculating).toBe(true);
    useAppStore.getState().setIsCalculating(false);
  });

  it('mcJob starts null', () => {
    resetStore();
    expect(useAppStore.getState().mcJob).toBeNull();
  });

  it('setMcJob stores job config', () => {
    resetStore();
    const job = { jobId: 1, format: 'geant4', particles: 1_000_000, jobName: 'test' };
    useAppStore.getState().setMcJob(job);
    expect(useAppStore.getState().mcJob).toEqual(job);
    useAppStore.getState().setMcJob(null);
  });

  it('setLastResult stores result string', () => {
    resetStore();
    useAppStore.getState().setLastResult('PASS: 5/5 barriers');
    expect(useAppStore.getState().lastResult).toBe('PASS: 5/5 barriers');
    useAppStore.getState().setLastResult(null);
  });
});

describe('appStore — FloorPlan', () => {
  it('has default floorPlan', () => {
    resetStore();
    const { floorPlan } = useAppStore.getState();
    expect(floorPlan.id).toBe('plan-1');
    expect(floorPlan.barriers).toEqual([]);
    expect(floorPlan.sources).toEqual([]);
  });

  it('setFloorPlan updates floorPlan', () => {
    resetStore();
    const newPlan = {
      id: 'plan-2',
      name: 'Test Plan',
      imageUrl: null,
      scale_m_per_pixel: 0.02,
      width_pixels: 500,
      height_pixels: 400,
      barriers: [{ id: 'b1', x1: 0, y1: 0, x2: 100, y2: 0, name: 'Wall', barrierType: 'primary', useFactor: 1, occupancyFactor: 1, designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE235' }],
      sources: [],
      occupiedRegions: [],
    };
    useAppStore.getState().setFloorPlan(newPlan as any);
    expect(useAppStore.getState().floorPlan.name).toBe('Test Plan');
    expect(useAppStore.getState().floorPlan.barriers.length).toBe(1);
    // Reset
    useAppStore.getState().setFloorPlan({
      id: 'plan-1', name: 'Plano de Blindaje 1', imageUrl: null,
      scale_m_per_pixel: 0.01, width_pixels: 1000, height_pixels: 800,
      barriers: [], sources: [], occupiedRegions: [],
    } as any);
  });
});

describe('appStore — Dialog operations on migrated dialogs', () => {
  it('simulates useDialog for all migrated dialogs', () => {
    resetStore();
    const migratedDialogs = [
      'export', 'cnsns', 'mc', 'projects', 'maze', 'quickBarrier',
      'viewer3d', 'equipmentDB', 'mcCloud', 'mcConfig', 'floorCeiling',
      'dashboardCalc', 'costEstimator', 'cnsnsChecklist', 'dxfViewer',
      'dashboard', 'bibliography', 'about', 'glossary', 'themeEngine',
      'bimConnector', 'cloudSync', 'validationDashboard', 'externalConnector',
      'aiAssistant', 'manual',
    ];
    for (const alias of migratedDialogs) {
      // Las claves de diálogos duplicados (etapa 3) abren el diálogo real.
      const name = resolverDialogo(alias);
      useAppStore.getState().open(alias as any);
      expect(useAppStore.getState().dialogs[name]).toBe(true);
      useAppStore.getState().close(name as any);
      expect(useAppStore.getState().dialogs[name]).toBe(false);
    }
  });
});
