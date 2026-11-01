// Batch 3: Batch import CSV/Excel into floor plan
import type { FloorPlan, Barrier, RadiationSource } from '@/types/radshield';
import { MODALITIES } from '@/types/radshield';

export interface CSVRow {
  name: string;
  type: 'barrier' | 'source';
  x1?: number; y1?: number; x2?: number; y2?: number;
  x?: number; y?: number;
  modalityId?: string;
  materialCode?: string;
  workload?: number;
  useFactor?: number;
  occupancyFactor?: number;
  designGoal?: number;
  barrierType?: 'primary' | 'secondary' | 'leakage' | 'scatter' | 'nuclear';
}

export function parseCSVImport(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.trim());
    const get = (name: string) => cells[headers.indexOf(name)] || '';
    const type = get('type') as 'barrier' | 'source';
    if (!type) continue;
    const row: CSVRow = { name: get('name'), type };
    if (type === 'barrier') {
      row.x1 = parseFloat(get('x1')) || 0;
      row.y1 = parseFloat(get('y1')) || 0;
      row.x2 = parseFloat(get('x2')) || 0;
      row.y2 = parseFloat(get('y2')) || 0;
      row.barrierType = (get('barriertype') || 'secondary') as Barrier['barrierType'];
      row.materialCode = get('materialcode') || 'CONCRETE235';
      row.useFactor = parseFloat(get('usefactor')) || 0.25;
      row.occupancyFactor = parseFloat(get('occupancy')) || 1;
      row.designGoal = parseFloat(get('designgoal')) || 0.02;
    } else {
      row.x = parseFloat(get('x')) || 0;
      row.y = parseFloat(get('y')) || 0;
      row.modalityId = get('modalityid') || 'linac-6';
      row.workload = parseFloat(get('workload')) || 1;
      row.useFactor = parseFloat(get('usefactor')) || 1;
    }
    rows.push(row);
  }
  return rows;
}

export function applyCSVImport(rows: CSVRow[], currentPlan: FloorPlan): FloorPlan {
  const plan = { ...currentPlan, barriers: [...currentPlan.barriers], sources: [...currentPlan.sources] };
  for (const row of rows) {
    if (row.type === 'barrier') {
      const b: Barrier = {
        id: `b-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: row.name || `Barrera ${plan.barriers.length + 1}`,
        x1: row.x1 || 0, y1: row.y1 || 0, x2: row.x2 || 100, y2: row.y2 || 0,
        barrierType: row.barrierType || 'secondary',
        materialCode: row.materialCode || 'CONCRETE235',
        useFactor: row.useFactor || 0.25,
        occupancyFactor: row.occupancyFactor || 1,
        designGoal_mSv_per_wk: row.designGoal || 0.02,
      };
      plan.barriers.push(b);
    } else {
      const mod = MODALITIES.find(m => m.id === row.modalityId) || MODALITIES[0];
      const s: RadiationSource = {
        id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: row.name || `Fuente ${plan.sources.length + 1}`,
        x: row.x || 0, y: row.y || 0,
        modality: mod,
        workloadValue: row.workload || 1,
        workloadUnit: mod.unit,
        useFactor: row.useFactor || 1,
        isocenterHeight_m: mod.isocenterHeightDefault_m,
        ctDLP_mGy_cm: mod.doseRateConstant,
        ctScansPerPatient: 1,
        nuclearActivity_GBq: mod.doseRateConstant,
        workloadHoursPerWeek: 40,
      };
      plan.sources.push(s);
    }
  }
  return plan;
}
