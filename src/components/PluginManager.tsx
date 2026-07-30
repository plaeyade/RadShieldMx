import { useState } from 'react';
import { Puzzle, Power, Download, Trash2, Star, Globe, Lock } from 'lucide-react';
import SidePanelShell from './SidePanelShell';

interface Plugin { id: string; name: string; desc: string; author: string; version: string; installed: boolean; active: boolean; category: string; downloads: number; rating: number; official: boolean; }

const PLUGINS: Plugin[] = [
  { id: 'ncrp151', name: 'NCRP-151 Engine', desc: 'Motor de blindaje para terapia megavoltaje. HVL/TVL tables, scatter, leakage.', author: 'RadShield Team', version: '2.1.0', installed: true, active: true, category: 'Motores', downloads: 15420, rating: 4.9, official: true },
  { id: 'ncrp147', name: 'NCRP-147 Engine', desc: 'Motor de blindaje para imagenologia medica. Archer equation, BIR tables.', author: 'RadShield Team', version: '2.0.5', installed: true, active: true, category: 'Motores', downloads: 12800, rating: 4.8, official: true },
  { id: 'montecarlo', name: 'Monte Carlo Gateway', desc: 'Gateway a GEANT4, GATE, MCNP, PHITS, FLUKA, PENELOPE. Macro generation.', author: 'RadShield Team', version: '3.2.1', installed: true, active: true, category: 'Motores', downloads: 8900, rating: 4.7, official: true },
  { id: 'skyshine', name: 'Skyshine Calculator', desc: 'Chilton y St-Germain skyshine para radiacion que escapa por el techo.', author: 'CNSNS', version: '1.5.0', installed: false, active: false, category: 'Motores', downloads: 5600, rating: 4.5, official: true },
  { id: 'neutron', name: 'Neutron Shielding', desc: 'Blindaje de neutrones para ciclotrones y acceleradores >10 MV. ICRU 57.', author: 'NRC', version: '1.2.0', installed: false, active: false, category: 'Motores', downloads: 4200, rating: 4.3, official: false },
  { id: 'python', name: 'Python Bridge', desc: 'Ejecuta scripts Python para calculos personalizados. NumPy, SciPy, PyMC.', author: 'Open Source', version: '2.0.0', installed: true, active: false, category: 'Integracion', downloads: 7800, rating: 4.6, official: false },
  { id: 'revit', name: 'Revit Connector', desc: 'Importa modelos BIM desde Revit (.rvt) con geometria y propiedades.', author: 'Trimble', version: '1.8.0', installed: false, active: false, category: 'Importar', downloads: 9200, rating: 4.7, official: false },
  { id: 'dicom', name: 'DICOM RT Import', desc: 'Importa estructuras DICOM-RT para calculo de dosis en pacientes.', author: 'Medical Physics', version: '1.3.0', installed: false, active: false, category: 'Importar', downloads: 3500, rating: 4.2, official: false },
];

export default function PluginManager({ onClose }: { onClose: () => void }) {
  const [plugins, setPlugins] = useState(PLUGINS);
  const [cat, setCat] = useState('Todos');
  const cats = ['Todos', ...new Set(PLUGINS.map(p => p.category))];
  const filtered = cat === 'Todos' ? plugins : plugins.filter(p => p.category === cat);

  const toggleActive = (id: string) => setPlugins(ps => ps.map(p => p.id === id ? { ...p, active: !p.active } : p));
  const toggleInstall = (id: string) => setPlugins(ps => ps.map(p => p.id === id ? { ...p, installed: !p.installed, active: !p.installed } : p));

  return (
    <SidePanelShell
      title="Extension Warehouse"
      subtitle={`${plugins.filter(p => p.installed).length} installed | ${plugins.length} available`}
      icon={<Puzzle className="w-5 h-5 text-purple-600" />}
      widthClass="w-[520px]"
      accentClass="from-purple-50 to-white"
      onClose={onClose}
    >
      {/* Categories */}
      <div className="flex gap-1 px-4 py-2 border-b border-slate-100 overflow-x-auto">
        {cats.map(c => <button key={c} onClick={() => setCat(c)} className={`text-[10px] px-2 py-1 rounded-full border whitespace-nowrap ${cat === c ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{c}</button>)}
      </div>
      {/* Plugin list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.map(p => (
          <div key={p.id} className={`border rounded-lg p-3 ${p.installed ? 'border-purple-200 bg-purple-50/30' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800">{p.name}</span>
                  {p.official && <Lock className="w-3 h-3 text-blue-500" />}
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded">v{p.version}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{p.desc}</p>
                <div className="flex items-center gap-3 mt-1 text-[9px] text-slate-400">
                  <span>by {p.author}</span>
                  <span className="flex items-center gap-0.5"><Download className="w-3 h-3" />{p.downloads.toLocaleString()}</span>
                  <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400" />{p.rating}</span>
                </div>
              </div>
              <div className="flex gap-1">
                {p.installed ? (
                  <button onClick={() => toggleActive(p.id)} className={`p-1.5 rounded ${p.active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}><Power className="w-3.5 h-3.5" /></button>
                ) : (
                  <button onClick={() => toggleInstall(p.id)} className="p-1.5 bg-purple-600 text-white rounded hover:bg-purple-700"><Download className="w-3.5 h-3.5" /></button>
                )}
                {p.installed && !p.official && <button onClick={() => toggleInstall(p.id)} className="p-1.5 bg-slate-100 text-slate-400 rounded hover:bg-red-50 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SidePanelShell>
  );
}
