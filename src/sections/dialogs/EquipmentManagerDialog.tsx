/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v33 — Equipment Manager Dialog
 *  Full CRUD for commercial radiotherapy equipment database
 *  14 models, 6 manufacturers, NCRP 151 workload data
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Server, Trash2, Search, Download, Upload, Crosshair, Shield, Copy, Filter, Star, RotateCcw
} from 'lucide-react';

// ─── Equipment Model ───
interface Equipment {
  id: string;
  name: string;
  manufacturer: string;
  category: 'LINAC' | 'Cobalt' | 'Brachy' | 'CyberKnife' | 'TomoTherapy' | 'GammaKnife' | 'Proton' | 'MR-Linac' | 'Cyclotron';
  energy_MV: number;
  energy_electrons_MeV: number[];
  maxDR_MU_min: number;
  techniques: string[];
  workload_NCRP151_Gy_week: number;
  workload_IMRT_Gy_week: number;
  tvl_concrete_6MV_cm: number;
  tvl_lead_6MV_mm: number;
  tvl_steel_6MV_mm: number;
  leakage_percent: number;
  sourceDistance_m: number;
  isocenterHeight_m: number;
  roomDimensions_min_m: [number, number, number];
  notes: string;
  favorite: boolean;
}

const DEFAULT_EQUIPMENT: Equipment[] = [
  { id: 'truebeam', name: 'TrueBeam', manufacturer: 'Varian', category: 'LINAC', energy_MV: 6, energy_electrons_MeV: [4, 6, 9, 12, 15, 20], maxDR_MU_min: 600, techniques: ['3D-CRT', 'IMRT', 'VMAT', 'SRS', 'SBRT'], workload_NCRP151_Gy_week: 1000, workload_IMRT_Gy_week: 700, tvl_concrete_6MV_cm: 37, tvl_lead_6MV_mm: 57, tvl_steel_6MV_mm: 92, leakage_percent: 0.1, sourceDistance_m: 1.0, isocenterHeight_m: 1.3, roomDimensions_min_m: [7.5, 7.5, 3.5], notes: 'FF and FFF modes. SRS/SBRT high-dose rate.', favorite: true },
  { id: 'halcyon', name: 'Halcyon', manufacturer: 'Varian', category: 'LINAC', energy_MV: 6, energy_electrons_MeV: [], maxDR_MU_min: 800, techniques: ['IMRT', 'VMAT'], workload_NCRP151_Gy_week: 800, workload_IMRT_Gy_week: 800, tvl_concrete_6MV_cm: 37, tvl_lead_6MV_mm: 57, tvl_steel_6MV_mm: 92, leakage_percent: 0.1, sourceDistance_m: 1.0, isocenterHeight_m: 1.3, roomDimensions_min_m: [5.5, 5.5, 3.2], notes: 'Only 6 MV FFF. Double-layer MLC. Compact design.', favorite: false },
  { id: 'edge', name: 'Edge', manufacturer: 'Varian', category: 'LINAC', energy_MV: 6, energy_electrons_MeV: [6, 9, 12, 15, 20], maxDR_MU_min: 1400, techniques: ['SRS', 'SBRT', 'VMAT'], workload_NCRP151_Gy_week: 600, workload_IMRT_Gy_week: 400, tvl_concrete_6MV_cm: 37, tvl_lead_6MV_mm: 57, tvl_steel_6MV_mm: 92, leakage_percent: 0.1, sourceDistance_m: 1.0, isocenterHeight_m: 1.3, roomDimensions_min_m: [6.5, 6.5, 3.5], notes: 'High-dose rate for SRS. Optical surface monitoring.', favorite: false },
  { id: 'versa-hd', name: 'Versa HD', manufacturer: 'Elekta', category: 'LINAC', energy_MV: 6, energy_electrons_MeV: [4, 6, 8, 10, 12, 15], maxDR_MU_min: 600, techniques: ['3D-CRT', 'IMRT', 'VMAT', 'SRS', 'SBRT'], workload_NCRP151_Gy_week: 1000, workload_IMRT_Gy_week: 700, tvl_concrete_6MV_cm: 37, tvl_lead_6MV_mm: 57, tvl_steel_6MV_mm: 92, leakage_percent: 0.1, sourceDistance_m: 1.0, isocenterHeight_m: 1.3, roomDimensions_min_m: [7.5, 7.5, 3.5], notes: 'Agility 160-MLC. 6 MV and 10 MV. CBCT integrated.', favorite: true },
  { id: 'unity', name: 'Unity', manufacturer: 'Elekta', category: 'MR-Linac', energy_MV: 7, energy_electrons_MeV: [], maxDR_MU_min: 425, techniques: ['IMRT', 'VMAT', 'SBRT'], workload_NCRP151_Gy_week: 500, workload_IMRT_Gy_week: 500, tvl_concrete_6MV_cm: 34, tvl_lead_6MV_mm: 52, tvl_steel_6MV_mm: 85, leakage_percent: 0.1, sourceDistance_m: 1.0, isocenterHeight_m: 1.3, roomDimensions_min_m: [8.0, 8.0, 3.8], notes: '1.5T MRI + 7 MV linac. Real-time adaptive. RF shield required.', favorite: false },
  { id: 'infinity', name: 'Infinity', manufacturer: 'Elekta', category: 'LINAC', energy_MV: 6, energy_electrons_MeV: [4, 6, 8, 10, 12, 15], maxDR_MU_min: 600, techniques: ['3D-CRT', 'IMRT', 'VMAT'], workload_NCRP151_Gy_week: 1000, workload_IMRT_Gy_week: 700, tvl_concrete_6MV_cm: 37, tvl_lead_6MV_mm: 57, tvl_steel_6MV_mm: 92, leakage_percent: 0.1, sourceDistance_m: 1.0, isocenterHeight_m: 1.3, roomDimensions_min_m: [7.5, 7.5, 3.5], notes: 'Beam modulator. Agility MLC optional.', favorite: false },
  { id: 'ck-m6', name: 'CyberKnife M6', manufacturer: 'Accuray', category: 'CyberKnife', energy_MV: 6, energy_electrons_MeV: [], maxDR_MU_min: 1000, techniques: ['SRS', 'SBRT', 'Robotic'], workload_NCRP151_Gy_week: 400, workload_IMRT_Gy_week: 400, tvl_concrete_6MV_cm: 37, tvl_lead_6MV_mm: 57, tvl_steel_6MV_mm: 92, leakage_percent: 0.1, sourceDistance_m: 0.8, isocenterHeight_m: 1.2, roomDimensions_min_m: [5.0, 5.0, 3.2], notes: '6 MV FFF. Robotic arm. Iris collimator or MLC.', favorite: true },
  { id: 'radixact', name: 'Radixact', manufacturer: 'Accuray', category: 'TomoTherapy', energy_MV: 6, energy_electrons_MeV: [], maxDR_MU_min: 850, techniques: ['IMRT', 'Helical'], workload_NCRP151_Gy_week: 800, workload_IMRT_Gy_week: 800, tvl_concrete_6MV_cm: 37, tvl_lead_6MV_mm: 57, tvl_steel_6MV_mm: 92, leakage_percent: 0.1, sourceDistance_m: 0.85, isocenterHeight_m: 0.85, roomDimensions_min_m: [7.0, 5.0, 3.0], notes: 'Helical delivery. 6 MV FFF. MVCT imaging.', favorite: false },
  { id: 'gk-perfexion', name: 'Gamma Knife Perfexion', manufacturer: 'Elekta', category: 'GammaKnife', energy_MV: 1.25, energy_electrons_MeV: [], maxDR_MU_min: 360, techniques: ['SRS'], workload_NCRP151_Gy_week: 40, workload_IMRT_Gy_week: 40, tvl_concrete_6MV_cm: 22, tvl_lead_6MV_mm: 12, tvl_steel_6MV_mm: 22, leakage_percent: 0.03, sourceDistance_m: 0.4, isocenterHeight_m: 1.1, roomDimensions_min_m: [5.5, 5.5, 3.2], notes: '192 Co-60 sources. 4 mm, 8 mm, 16 mm collimators.', favorite: true },
  { id: 'gk-icon', name: 'Gamma Knife Icon', manufacturer: 'Elekta', category: 'GammaKnife', energy_MV: 1.25, energy_electrons_MeV: [], maxDR_MU_min: 360, techniques: ['SRS', 'Fractionated'], workload_NCRP151_Gy_week: 40, workload_IMRT_Gy_week: 40, tvl_concrete_6MV_cm: 22, tvl_lead_6MV_mm: 12, tvl_steel_6MV_mm: 22, leakage_percent: 0.03, sourceDistance_m: 0.4, isocenterHeight_m: 1.1, roomDimensions_min_m: [5.5, 5.5, 3.2], notes: 'CBCT integrated. Frameless. Single fraction or hypofractionated.', favorite: false },
  { id: 'mridian', name: 'MRIdian', manufacturer: 'ViewRay', category: 'MR-Linac', energy_MV: 6, energy_electrons_MeV: [6, 9, 12], maxDR_MU_min: 600, techniques: ['IMRT', 'VMAT', 'SBRT'], workload_NCRP151_Gy_week: 500, workload_IMRT_Gy_week: 500, tvl_concrete_6MV_cm: 37, tvl_lead_6MV_mm: 57, tvl_steel_6MV_mm: 92, leakage_percent: 0.1, sourceDistance_m: 1.0, isocenterHeight_m: 1.3, roomDimensions_min_m: [8.0, 8.0, 3.8], notes: '0.35T MRI + 6/10 MV. Soft-tissue visualization.', favorite: false },
  { id: 'zap-x', name: 'ZAP-X', manufacturer: 'ZAP Surgical', category: 'LINAC', energy_MV: 3, energy_electrons_MeV: [], maxDR_MU_min: 1500, techniques: ['SRS'], workload_NCRP151_Gy_week: 100, workload_IMRT_Gy_week: 100, tvl_concrete_6MV_cm: 26, tvl_lead_6MV_mm: 32, tvl_steel_6MV_mm: 50, leakage_percent: 0.1, sourceDistance_m: 0.5, isocenterHeight_m: 1.2, roomDimensions_min_m: [3.5, 3.5, 2.8], notes: '3 MV S-band. Self-shielded vault. No cobalt.', favorite: false },
  { id: 'kiube-18', name: 'KIUBE 18 MeV', manufacturer: 'IBA', category: 'Cyclotron', energy_MV: 0, energy_electrons_MeV: [], maxDR_MU_min: 0, techniques: ['PET Production'], workload_NCRP151_Gy_week: 0, workload_IMRT_Gy_week: 0, tvl_concrete_6MV_cm: 45, tvl_lead_6MV_mm: 0, tvl_steel_6MV_mm: 0, leakage_percent: 0, sourceDistance_m: 1.0, isocenterHeight_m: 1.0, roomDimensions_min_m: [6.0, 6.0, 4.0], notes: '18 MeV proton cyclotron. FDG production. Neutron shield required.', favorite: true },
  { id: 'artiste', name: 'Oncor Artiste', manufacturer: 'Siemens', category: 'LINAC', energy_MV: 6, energy_electrons_MeV: [6, 9, 12, 15, 18, 21], maxDR_MU_min: 600, techniques: ['3D-CRT', 'IMRT'], workload_NCRP151_Gy_week: 1000, workload_IMRT_Gy_week: 700, tvl_concrete_6MV_cm: 37, tvl_lead_6MV_mm: 57, tvl_steel_6MV_mm: 92, leakage_percent: 0.1, sourceDistance_m: 1.0, isocenterHeight_m: 1.3, roomDimensions_min_m: [7.5, 7.5, 3.5], notes: '160 MLC. Integrated CT (CT-on-rails).', favorite: false },
];

const CATEGORIES = ['All', 'LINAC', 'MR-Linac', 'GammaKnife', 'CyberKnife', 'TomoTherapy', 'Cobalt', 'Brachy', 'Proton', 'Cyclotron'];
const MANUFACTURERS = ['All', 'Varian', 'Elekta', 'Accuray', 'ViewRay', 'Siemens', 'IBA', 'ZAP Surgical'];

interface EquipmentManagerDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function EquipmentManagerDialog({ open, onOpenChange }: EquipmentManagerDialogProps) {
  const [equipment, setEquipment] = useState<Equipment[]>(() => {
    try {
      const saved = localStorage.getItem('radshield_equipment_db_v33');
      return saved ? JSON.parse(saved) : DEFAULT_EQUIPMENT;
    } catch { return DEFAULT_EQUIPMENT; }
  });
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [mfgFilter, setMfgFilter] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  // Persist
  const saveDB = (data: Equipment[]) => {
    setEquipment(data);
    localStorage.setItem('radshield_equipment_db_v33', JSON.stringify(data));
  };

  const filtered = useMemo(() => {
    return equipment.filter(e => {
      const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.manufacturer.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === 'All' || e.category === catFilter;
      const matchMfg = mfgFilter === 'All' || e.manufacturer === mfgFilter;
      return matchSearch && matchCat && matchMfg;
    });
  }, [equipment, search, catFilter, mfgFilter]);

  const selected = equipment.find(e => e.id === selectedId) || null;

  const handleDelete = (id: string) => {
    const next = equipment.filter(e => e.id !== id);
    saveDB(next);
    if (selectedId === id) setSelectedId(null);
    toast.success('Equipment deleted');
  };

  const handleToggleFav = (id: string) => {
    const next = equipment.map(e => e.id === id ? { ...e, favorite: !e.favorite } : e);
    saveDB(next);
  };

  const handleDuplicate = (id: string) => {
    const e = equipment.find(x => x.id === id);
    if (!e) return;
    const dup: Equipment = { ...e, id: `${e.id}_copy_${Date.now()}`, name: `${e.name} (Copy)` };
    saveDB([...equipment, dup]);
    toast.success(`Duplicated: ${e.name}`);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(equipment, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RadShield_Equipment_DB.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${equipment.length} equipment to JSON`);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data) && data.length > 0) {
          saveDB([...equipment, ...data.filter((d: any) => !equipment.find(ex => ex.id === d.id))]);
          toast.success(`Imported ${data.length} equipment`);
        }
      } catch { toast.error('Invalid JSON file'); }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Reset to default database? All custom entries will be lost.')) {
      saveDB(DEFAULT_EQUIPMENT);
      toast.success('Database reset to defaults');
    }
  };

  const categoryColors: Record<string, string> = {
    LINAC: 'bg-blue-100 text-blue-700', 'MR-Linac': 'bg-purple-100 text-purple-700',
    GammaKnife: 'bg-red-100 text-red-700', CyberKnife: 'bg-amber-100 text-amber-700',
    TomoTherapy: 'bg-teal-100 text-teal-700', Cobalt: 'bg-slate-100 text-slate-700',
    Brachy: 'bg-pink-100 text-pink-700', Proton: 'bg-indigo-100 text-indigo-700',
    Cyclotron: 'bg-cyan-100 text-cyan-700',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-5 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Server className="w-5 h-5 text-blue-600" />
            Equipment Manager — Commercial Radiotherapy Database
            <Badge className="text-[9px] bg-blue-100 text-blue-700">v33</Badge>
            <Badge className="text-[9px] bg-slate-100">{equipment.length} models</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-5 mt-2 shrink-0">
            <TabsTrigger value="list" className="text-[11px]"><Server className="w-3 h-3 mr-1" /> Equipment List</TabsTrigger>
            <TabsTrigger value="detail" className="text-[11px]"><Crosshair className="w-3 h-3 mr-1" /> Detail</TabsTrigger>
            <TabsTrigger value="shielding" className="text-[11px]"><Shield className="w-3 h-3 mr-1" /> Shielding Data</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 overflow-auto">
            {/* Filters bar */}
            <div className="px-5 py-2 flex items-center gap-2 flex-wrap border-b bg-slate-50">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-6 pr-2 py-1 text-[10px] border rounded w-36" />
              </div>
              <div className="flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-400" />
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  className="text-[10px] border rounded py-1 px-1">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <select value={mfgFilter} onChange={e => setMfgFilter(e.target.value)}
                className="text-[10px] border rounded py-1 px-1">
                {MANUFACTURERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="flex-1" />
              <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1" onClick={handleExportJSON}>
                <Download className="w-3 h-3" /> Export JSON
              </Button>
              <label className="cursor-pointer">
                <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
                <span className="inline-flex items-center gap-1 px-2 py-1 text-[9px] border rounded hover:bg-slate-100 transition-colors">
                  <Upload className="w-3 h-3" /> Import
                </span>
              </label>
              <Button size="sm" variant="ghost" className="h-6 text-[9px] gap-1 text-slate-500" onClick={handleReset}>
                <RotateCcw className="w-3 h-3" /> Reset
              </Button>
            </div>

            <TabsContent value="list" className="m-0 pb-4">
              {/* Equipment table */}
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-1.5 px-2 w-6"></th>
                    <th className="text-left py-1.5 px-2">Equipment</th>
                    <th className="text-left py-1.5 px-2">Mfg</th>
                    <th className="text-left py-1.5 px-2">Category</th>
                    <th className="text-right py-1.5 px-2">Energy</th>
                    <th className="text-right py-1.5 px-2">DR (MU/min)</th>
                    <th className="text-left py-1.5 px-2">Techniques</th>
                    <th className="text-right py-1.5 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(eq => (
                    <tr key={eq.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${selectedId === eq.id ? 'bg-blue-50' : ''}`}
                      onClick={() => { setSelectedId(eq.id); setActiveTab('detail'); }}>
                      <td className="py-1 px-2">
                        <button onClick={e => { e.stopPropagation(); handleToggleFav(eq.id); }}>
                          <Star className={`w-3 h-3 ${eq.favorite ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                        </button>
                      </td>
                      <td className="py-1 px-2 font-medium">{eq.name}</td>
                      <td className="py-1 px-2 text-slate-500">{eq.manufacturer}</td>
                      <td className="py-1 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold ${categoryColors[eq.category] || 'bg-slate-100'}`}>
                          {eq.category}
                        </span>
                      </td>
                      <td className="text-right py-1 px-2 font-mono">{eq.energy_MV > 0 ? `${eq.energy_MV} MV` : eq.category === 'Cyclotron' ? '18 MeV p' : '—'}</td>
                      <td className="text-right py-1 px-2 font-mono">{eq.maxDR_MU_min > 0 ? eq.maxDR_MU_min : '—'}</td>
                      <td className="py-1 px-2">
                        <div className="flex gap-0.5 flex-wrap">
                          {eq.techniques.slice(0, 3).map(t => (
                            <span key={t} className="px-1 py-0 rounded bg-slate-100 text-[7px]">{t}</span>
                          ))}
                          {eq.techniques.length > 3 && <span className="text-[7px] text-slate-400">+{eq.techniques.length - 3}</span>}
                        </div>
                      </td>
                      <td className="text-right py-1 px-2">
                        <div className="flex items-center justify-end gap-0.5">
                          <button onClick={e => { e.stopPropagation(); handleDuplicate(eq.id); }}
                            className="p-0.5 rounded hover:bg-slate-200" title="Duplicate">
                            <Copy className="w-3 h-3 text-slate-400" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(eq.id); }}
                            className="p-0.5 rounded hover:bg-red-100" title="Delete">
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-8 text-[11px] text-slate-400">No equipment matches filters</div>
              )}
            </TabsContent>

            <TabsContent value="detail" className="m-0 px-5 pb-4">
              {selected ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-slate-800">{selected.name}</h3>
                    <Badge className={`text-[8px] ${categoryColors[selected.category]}`}>{selected.category}</Badge>
                    <Badge variant="outline" className="text-[8px]">{selected.manufacturer}</Badge>
                    {selected.favorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-[10px]">
                    {[
                      ['Energy X', `${selected.energy_MV} MV`],
                      ['Electrons', selected.energy_electrons_MeV.length > 0 ? selected.energy_electrons_MeV.join(', ') + ' MeV' : 'None'],
                      ['Max Dose Rate', `${selected.maxDR_MU_min} MU/min`],
                      ['Source-Iso', `${selected.sourceDistance_m} m`],
                      ['Iso Height', `${selected.isocenterHeight_m} m`],
                      ['Leakage', `${selected.leakage_percent}%`],
                      ['Workload', `${selected.workload_NCRP151_Gy_week} Gy/wk`],
                      ['IMRT WL', `${selected.workload_IMRT_Gy_week} Gy/wk`],
                    ].map(([label, value], i) => (
                      <div key={i} className="bg-slate-50 rounded p-2 border">
                        <div className="text-slate-500">{label}</div>
                        <div className="font-semibold text-slate-700 text-[10px]">{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] font-semibold text-slate-700">Techniques</div>
                  <div className="flex gap-1 flex-wrap">
                    {selected.techniques.map(t => (
                      <Badge key={t} variant="secondary" className="text-[9px]">{t}</Badge>
                    ))}
                  </div>

                  <div className="text-[11px] font-semibold text-slate-700">Room Requirements</div>
                  <div className="text-[10px] text-slate-600">
                    Minimum room: {selected.roomDimensions_min_m[0]} × {selected.roomDimensions_min_m[1]} × {selected.roomDimensions_min_m[2]} m (L × W × H)
                  </div>

                  {selected.notes && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[10px] text-amber-800">
                      <strong>Notes:</strong> {selected.notes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-[11px] text-slate-400">Select an equipment from the list</div>
              )}
            </TabsContent>

            <TabsContent value="shielding" className="m-0 px-5 pb-4">
              {selected ? (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold text-slate-700">NCRP 151 Shielding Data — {selected.name}</div>
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-1 px-2">Parameter</th>
                        <th className="text-right py-1 px-2">Value</th>
                        <th className="text-left py-1 px-2">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Primary barrier TVL (concrete)', `${selected.tvl_concrete_6MV_cm} cm`, 'NCRP 151 Table B.4'],
                        ['Primary barrier TVL (Pb)', `${selected.tvl_lead_6MV_mm} mm`, 'NCRP 151 Table B.4'],
                        ['Primary barrier TVL (steel)', `${selected.tvl_steel_6MV_mm} mm`, 'NCRP 151 Table B.4'],
                        ['Workload (conventional)', `${selected.workload_NCRP151_Gy_week} Gy/wk`, 'NCRP 151 Table B.2'],
                        ['Workload (IMRT/VMAT)', `${selected.workload_IMRT_Gy_week} Gy/wk`, 'NCRP 151 Table B.2'],
                        ['Leakage radiation', `${selected.leakage_percent}%`, 'IEC 60601-2-1'],
                        ['Source-axis distance', `${selected.sourceDistance_m} m`, 'Manufacturer specs'],
                        ['Use factor (U) primary', '0.25–0.33', 'NCRP 151 Table 4.2'],
                        ['Use factor (U) leakage', '1.0', 'NCRP 151 Sec. 4.1'],
                      ].map(([param, val, ref], i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-1 px-2">{param}</td>
                          <td className="text-right py-1 px-2 font-mono font-semibold">{val}</td>
                          <td className="py-1 px-2 text-slate-500">{ref}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Quick calculator */}
                  <div className="text-[11px] font-semibold text-slate-700 mt-3">Quick Barrier Calculator</div>
                  <QuickBarrierCalc equipment={selected} />
                </div>
              ) : (
                <div className="text-center py-10 text-[11px] text-slate-400">Select an equipment from the list</div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Quick Barrier Calculator sub-component ───
function QuickBarrierCalc({ equipment }: { equipment: Equipment }) {
  const [distance_m, setDistance] = useState(4.0);
  const [occupancy_T, setOccupancy] = useState(1.0);
  const [designGoal_mSv, setDesignGoal] = useState(0.02);
  const [material, setMaterial] = useState<'concrete' | 'lead' | 'steel'>('concrete');

  const tvl = material === 'concrete' ? equipment.tvl_concrete_6MV_cm / 10 :
    material === 'lead' ? equipment.tvl_lead_6MV_mm / 10 :
      equipment.tvl_steel_6MV_mm / 10;

  // NCRP 151: K = W × U × T / d² × B
  const W_Gy_week = equipment.workload_NCRP151_Gy_week;
  const U = 0.25;
  const kerma_unshielded = (W_Gy_week * U * occupancy_T) / (distance_m * distance_m) * 1000; // mSv/week
  const B = designGoal_mSv / (kerma_unshielded || 1);
  const nTVL = -Math.log10(Math.max(B, 1e-10));
  const thickness_dm = nTVL * tvl; // dm
  const thickness_cm = thickness_dm * 10;

  return (
    <div className="bg-slate-50 rounded-lg p-3 border space-y-2 text-[10px]">
      <div className="grid grid-cols-4 gap-2">
        <div>
          <div className="text-slate-500">Distance (m)</div>
          <input type="number" min={0.5} max={50} step={0.1} value={distance_m}
            onChange={e => setDistance(Number(e.target.value))}
            className="w-full border rounded px-1 py-0.5 text-[10px]" />
        </div>
        <div>
          <div className="text-slate-500">Occupancy (T)</div>
          <select value={occupancy_T} onChange={e => setOccupancy(Number(e.target.value))}
            className="w-full border rounded px-1 py-0.5 text-[10px]">
            <option value={1}>1.0 (Full)</option>
            <option value={0.5}>0.5 (Partial)</option>
            <option value={0.2}>0.2 (Occasional)</option>
            <option value={0.125}>0.125 (Rare)</option>
            <option value={0.05}>0.05 (Very rare)</option>
          </select>
        </div>
        <div>
          <div className="text-slate-500">Design P (mSv/wk)</div>
          <select value={designGoal_mSv} onChange={e => setDesignGoal(Number(e.target.value))}
            className="w-full border rounded px-1 py-0.5 text-[10px]">
            <option value={0.02}>0.02 (Public)</option>
            <option value={0.1}>0.1 (Occupied)</option>
            <option value={0.5}>0.5 (Controlled)</option>
          </select>
        </div>
        <div>
          <div className="text-slate-500">Material</div>
          <select value={material} onChange={e => setMaterial(e.target.value as any)}
            className="w-full border rounded px-1 py-0.5 text-[10px]">
            <option value="concrete">Concrete</option>
            <option value="lead">Lead</option>
            <option value="steel">Steel</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-2">
        <div className="bg-white rounded p-1.5 border text-center">
          <div className="text-slate-500">Unshielded K</div>
          <div className="font-bold text-red-600">{kerma_unshielded.toFixed(2)} mSv/wk</div>
        </div>
        <div className="bg-white rounded p-1.5 border text-center">
          <div className="text-slate-500">B factor</div>
          <div className="font-mono">{B.toExponential(2)}</div>
        </div>
        <div className="bg-white rounded p-1.5 border text-center">
          <div className="text-slate-500">n TVL</div>
          <div className="font-bold text-blue-600">{nTVL.toFixed(2)}</div>
        </div>
        <div className="bg-emerald-50 rounded p-1.5 border border-emerald-200 text-center">
          <div className="text-emerald-600">Thickness ({material})</div>
          <div className="font-bold text-emerald-800">{thickness_cm.toFixed(1)} cm</div>
        </div>
      </div>
    </div>
  );
}
