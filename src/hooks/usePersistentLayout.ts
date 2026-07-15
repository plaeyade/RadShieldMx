/**
 * A.20: Persistent Layout State
 * Saves sidebar width, panel visibility, split positions to localStorage
 */
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'radshield_layout_v1';

interface LayoutState {
  sidebarWidth: number;
  showSidebar: boolean;
  showMinimap: boolean;
  showLegend: boolean;
  showStatusBar: boolean;
  activeTool: string;
}

const DEFAULT: LayoutState = {
  sidebarWidth: 280,
  showSidebar: true,
  showMinimap: true,
  showLegend: true,
  showStatusBar: true,
  activeTool: 'select',
};

function load(): LayoutState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT, ...JSON.parse(saved) } : DEFAULT;
  } catch { return DEFAULT; }
}

function save(state: LayoutState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function usePersistentLayout() {
  const [layout, setLayout] = useState<LayoutState>(load);

  useEffect(() => { save(layout); }, [layout]);

  const update = (patch: Partial<LayoutState>) => setLayout(p => ({ ...p, ...patch }));
  const toggle = (key: keyof LayoutState) => setLayout(p => ({ ...p, [key]: !p[key] }));
  const reset = () => { setLayout(DEFAULT); localStorage.removeItem(STORAGE_KEY); };

  return { layout, update, toggle, reset };
}
