import { useState, useMemo } from 'react';
import { X, Save, PenTool, Box, CheckCircle2, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { OCCUPANCY_FACTORS, DESIGN_GOALS, MATERIALS } from '@/types/radshield';
import type { Barrier } from '@/types/radshield';

function getThicknessValue(thickness: Barrier['requiredThickness_mm'], materialCode?: string): number {
  if (typeof thickness === 'number') return thickness;
  if (!thickness) return 0;
  if (materialCode && typeof thickness[materialCode] === 'number') return thickness[materialCode];
  return Object.values(thickness)[0] ?? 0;
}

interface BarrierEditorProps {
  barriers: Barrier[];
  onUpdateBarrier: (id: string, updates: Partial<Barrier>) => void;
  onClose: () => void;
  onGenerateRecommendations: () => void;
}

export default function BarrierEditor({ barriers, onUpdateBarrier, onClose, onGenerateRecommendations }: BarrierEditorProps) {
  const [selectedBarrierId, setSelectedBarrierId] = useState<string>(barriers[0]?.id || '');
  const [expandedSection, setExpandedSection] = useState<string>('assumptions');

  const barrier = barriers.find(b => b.id === selectedBarrierId);
  const requiredThickness = barrier
    ? getThicknessValue(barrier.requiredThickness_mm, barrier.materialCode)
    : 0;

  if (!barrier) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md">
          <p className="text-slate-600">No barriers to edit. Create barriers on the floor plan first.</p>
          <Button className="mt-4" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-[#fff7ed]">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-[#f97316]" />
            <h2 className="text-sm font-bold text-slate-800">Barrier Assumptions & Materials Editor</h2>
          </div>
          <button aria-label="Cerrar Barrier Assumptions Editor" onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Barrier List */}
          <div className="w-56 border-r border-slate-200 bg-slate-50 overflow-auto">
            <div className="p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Barriers ({barriers.length})</p>
              {barriers.map(b => (
                <button key={b.id} onClick={() => setSelectedBarrierId(b.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[11px] transition-colors mb-1 ${
                    selectedBarrierId === b.id ? 'bg-[#f97316] text-white' : 'hover:bg-white text-slate-600'
                  }`}>
                  <p className="font-semibold truncate">{b.name}</p>
                  <p className={`${selectedBarrierId === b.id ? 'text-white/70' : 'text-slate-400'}`}>{b.barrierType}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-auto p-5">
            {/* Section: Assumptions */}
            <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={() => setExpandedSection(expandedSection === 'assumptions' ? '' : 'assumptions')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-[#f97316]" />
                  <span className="text-[12px] font-semibold text-slate-700">Barrier Assumptions</span>
                </div>
                {expandedSection === 'assumptions' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {expandedSection === 'assumptions' && (
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[10px] text-slate-500">Barrier Name</Label>
                    <Input value={barrier.name} onChange={e => onUpdateBarrier(barrier.id, { name: e.target.value })} className="h-8 text-[12px]" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">Barrier Type</Label>
                    <Select value={barrier.barrierType} onValueChange={val => onUpdateBarrier(barrier.id, { barrierType: val as Barrier['barrierType'] })}>
                      <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['primary', 'secondary', 'leakage', 'scatter', 'nuclear'].map(t => (
                          <SelectItem key={t} value={t} className="text-[11px] capitalize">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">Use Factor (U)</Label>
                    <Input type="number" step="0.05" min="0" max="1" value={barrier.useFactor}
                      onChange={e => onUpdateBarrier(barrier.id, { useFactor: parseFloat(e.target.value) || 0 })} className="h-8 text-[12px]" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">Occupancy Factor (T)</Label>
                    <Select value={barrier.occupancyFactor.toString()} onValueChange={val => onUpdateBarrier(barrier.id, { occupancyFactor: parseFloat(val) })}>
                      <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OCCUPANCY_FACTORS.map(o => (
                          <SelectItem key={o.value} value={o.value.toString()} className="text-[11px]">{o.name} ({o.value})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">Design Goal P (mSv/wk)</Label>
                    <Select value={barrier.designGoal_mSv_per_wk.toString()} onValueChange={val => onUpdateBarrier(barrier.id, { designGoal_mSv_per_wk: parseFloat(val) })}>
                      <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DESIGN_GOALS.map(d => (
                          <SelectItem key={d.value} value={d.value.toString()} className="text-[11px]">{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">Workload Factor</Label>
                    <Input type="number" value={barrier.workloadFactor || 1}
                      onChange={e => onUpdateBarrier(barrier.id, { workloadFactor: parseFloat(e.target.value) || 1 })} className="h-8 text-[12px]" />
                  </div>
                </div>
              )}
            </div>

            {/* Section: Materials */}
            <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={() => setExpandedSection(expandedSection === 'materials' ? '' : 'materials')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-[#f97316] text-white flex items-center justify-center text-[9px] font-bold">M</span>
                  <span className="text-[12px] font-semibold text-slate-700">Materials</span>
                </div>
                {expandedSection === 'materials' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {expandedSection === 'materials' && (
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[10px] text-slate-500">Primary Material</Label>
                    <Select value={barrier.materialCode || 'CONCRETE235'} onValueChange={val => onUpdateBarrier(barrier.id, { materialCode: val })}>
                      <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MATERIALS.map(m => (
                          <SelectItem key={m.code} value={m.code} className="text-[11px]">{m.name} ({m.density_kg_m3} kg/m³)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">Required Thickness (mm)</Label>
                    <Input type="number" value={requiredThickness}
                      onChange={e => onUpdateBarrier(barrier.id, { requiredThickness_mm: parseFloat(e.target.value) || 0 })} className="h-8 text-[12px]" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">Lead Equivalent (mm Pb)</Label>
                    <Input type="number" step="0.01" value={barrier.leadEquivalent_mm || 0}
                      onChange={e => onUpdateBarrier(barrier.id, { leadEquivalent_mm: parseFloat(e.target.value) || 0 })} className="h-8 text-[12px]" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">Concrete Equivalent (mm)</Label>
                    <Input type="number" value={barrier.concreteEquivalent_mm || 0}
                      onChange={e => onUpdateBarrier(barrier.id, { concreteEquivalent_mm: parseFloat(e.target.value) || 0 })} className="h-8 text-[12px]" />
                  </div>
                </div>
              )}
            </div>

            {/* Section: Recommendations Preview */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={() => setExpandedSection(expandedSection === 'recommendations' ? '' : 'recommendations')}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f97316]" />
                  <span className="text-[12px] font-semibold text-slate-700">Calculated Recommendations</span>
                </div>
                {expandedSection === 'recommendations' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {expandedSection === 'recommendations' && (
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-[9px] text-slate-500 uppercase">Max Kerma</p>
                      <p className="text-lg font-bold text-blue-600">{(barrier.maxKerma || 0).toFixed(3)}</p>
                      <p className="text-[9px] text-slate-400">mGy/wk</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-[9px] text-slate-500 uppercase">Thickness</p>
                      <p className="text-lg font-bold text-green-600">{requiredThickness.toFixed(2)}</p>
                      <p className="text-[9px] text-slate-400">mm</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <p className="text-[9px] text-slate-500 uppercase">Lead Eq.</p>
                      <p className="text-lg font-bold text-amber-600">{(barrier.leadEquivalent_mm || 0).toFixed(3)}</p>
                      <p className="text-[9px] text-slate-400">mm Pb</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Review calculated thicknesses and edit final shielding recommendations before export.
                    All values can be overridden manually.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50">
          <p className="text-[10px] text-slate-400">
            Edit barrier assumptions, materials, and occupancies before generating recommendations.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-[11px]" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="bg-[#f97316] hover:bg-[#ea580c] text-white text-[11px] gap-1" onClick={() => { onGenerateRecommendations(); onClose(); }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Generate Recommendations
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
