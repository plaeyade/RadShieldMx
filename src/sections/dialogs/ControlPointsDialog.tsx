import { useState } from 'react';
import { X, MapPin, Plus, Target, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export interface ControlPoint {
  id: string;
  name: string;
  x: number; // pixels on floor plan
  y: number;
  designGoal_mSv_per_wk: number;
  occupancyFactor: number;
  notes: string;
}

interface ControlPointsDialogProps {
  controlPoints: ControlPoint[];
  onUpdate: (points: ControlPoint[]) => void;
  onClose: () => void;
  floorPlanWidth?: number;
  floorPlanHeight?: number;
}

const PRESET_GOALS = [
  { name: 'Uncontrolled Areas', value: 0.02 },
  { name: 'Controlled Areas', value: 0.1 },
  { name: 'Staff Occupied', value: 0.02 },
  { name: 'Public Corridor', value: 0.02 },
  { name: 'Parking', value: 0.02 },
  { name: 'Adjacent Patient', value: 0.02 },
  { name: 'Office Desk', value: 0.02 },
];

export default function ControlPointsDialog({ controlPoints, onUpdate, onClose, floorPlanWidth = 800, floorPlanHeight = 600 }: ControlPointsDialogProps) {
  const [points, setPoints] = useState<ControlPoint[]>(controlPoints);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPoint, setNewPoint] = useState<Partial<ControlPoint>>({ designGoal_mSv_per_wk: 0.02, occupancyFactor: 1.0, notes: '' });

  const handleAdd = () => {
    if (!newPoint.name) return;
    const p: ControlPoint = {
      id: Date.now().toString(),
      name: newPoint.name,
      x: newPoint.x || Math.round(floorPlanWidth / 2),
      y: newPoint.y || Math.round(floorPlanHeight / 2),
      designGoal_mSv_per_wk: newPoint.designGoal_mSv_per_wk || 0.02,
      occupancyFactor: newPoint.occupancyFactor || 1.0,
      notes: newPoint.notes || '',
    };
    const updated = [...points, p];
    setPoints(updated);
    onUpdate(updated);
    setShowAddForm(false);
    setNewPoint({ designGoal_mSv_per_wk: 0.02, occupancyFactor: 1.0, notes: '' });
  };

  const handleDelete = (id: string) => {
    const updated = points.filter(p => p.id !== id);
    setPoints(updated);
    onUpdate(updated);
  };

  const handleUpdate = (id: string, field: keyof ControlPoint, value: any) => {
    const updated = points.map(p => p.id === id ? { ...p, [field]: value } : p);
    setPoints(updated);
    onUpdate(updated);
  };

  // Mini visual floor plan
  const scale = Math.min(300 / floorPlanWidth, 200 / floorPlanHeight);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-[#fff7ed]">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#f97316]" />
            <h2 className="text-sm font-bold text-slate-800">Control Points & Design Goals</h2>
            <span className="text-[10px] text-slate-400 ml-2">Define control points and design goals directly on the facility floorplan</span>
          </div>
          <button aria-label="Cerrar Control Points" onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Mini Floor Plan Preview */}
          <div className="w-80 border-r border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Floor Plan Preview</p>
            <div className="bg-white border border-slate-200 rounded-lg relative" style={{ width: floorPlanWidth * scale, height: floorPlanHeight * scale }}>
              {/* Grid */}
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#d6d3d1 1px, transparent 1px)', backgroundSize: `${scale * 50}px ${scale * 50}px` }} />
              {/* Control Points */}
              {points.map((p, i) => (
                <div key={p.id} className="absolute" style={{ left: p.x * scale - 8, top: p.y * scale - 8 }}>
                  <div className="w-4 h-4 rounded-full bg-[#f97316] border-2 border-white shadow-sm flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white">{i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-slate-400 mt-2">Click on canvas to add control points interactively</p>
          </div>

          {/* Points List */}
          <div className="flex-1 overflow-auto p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-slate-600">{points.length} control point(s) defined</p>
              <Button size="sm" className="bg-[#f97316] hover:bg-[#ea580c] text-white text-[11px] gap-1" onClick={() => setShowAddForm(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Control Point
              </Button>
            </div>

            {showAddForm && (
              <div className="bg-slate-50 rounded-lg p-4 mb-3 border border-slate-200">
                <h3 className="text-[11px] font-semibold text-slate-700 mb-2">New Control Point</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><Label className="text-[10px]">Name</Label><Input value={newPoint.name || ''} onChange={e => setNewPoint({...newPoint, name: e.target.value})} className="h-8 text-[11px]" placeholder="e.g. Control Desk" /></div>
                  <div><Label className="text-[10px]">Preset Goal</Label>
                    <select className="w-full h-8 text-[11px] border rounded px-2" onChange={e => setNewPoint({...newPoint, designGoal_mSv_per_wk: parseFloat(e.target.value)})}>
                      {PRESET_GOALS.map(g => <option key={g.name} value={g.value}>{g.name} ({g.value})</option>)}
                    </select>
                  </div>
                  <div><Label className="text-[10px]">Position X (px)</Label><Input type="number" value={newPoint.x || Math.round(floorPlanWidth / 2)} onChange={e => setNewPoint({...newPoint, x: parseInt(e.target.value)})} className="h-8 text-[11px]" /></div>
                  <div><Label className="text-[10px]">Position Y (px)</Label><Input type="number" value={newPoint.y || Math.round(floorPlanHeight / 2)} onChange={e => setNewPoint({...newPoint, y: parseInt(e.target.value)})} className="h-8 text-[11px]" /></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-[#f97316] hover:bg-[#ea580c] text-white text-[11px]" onClick={handleAdd}>Add</Button>
                  <Button size="sm" variant="outline" className="text-[11px]" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {points.map((p, i) => (
                <div key={p.id} className="border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#f97316] text-white flex items-center justify-center text-[9px] font-bold">{i + 1}</div>
                      <Input value={p.name} onChange={e => handleUpdate(p.id, 'name', e.target.value)} className="h-6 text-[11px] font-semibold w-40" />
                    </div>
                    <button onClick={() => handleDelete(p.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div><span className="text-slate-400">Position:</span> <span className="font-mono text-slate-600">({p.x}, {p.y}) px</span></div>
                    <div><span className="text-slate-400">Design Goal:</span> <span className="font-mono text-blue-600">{p.designGoal_mSv_per_wk} mSv/wk</span></div>
                    <div><span className="text-slate-400">Occupancy:</span> <span className="font-mono text-slate-600">{p.occupancyFactor}</span></div>
                  </div>
                </div>
              ))}
              {points.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-[11px]">No control points defined yet.</p>
                  <p className="text-[10px]">Add control points to define design goals on the floorplan.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
