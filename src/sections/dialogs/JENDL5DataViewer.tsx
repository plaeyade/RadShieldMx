/**
 * JENDL-5 Nuclear Data Viewer — v39
 * Interactive viewer for JENDL-5 (Japanese Evaluated Nuclear Data Library).
 * Displays cross-sections, angular distributions, and reaction data.
 * 
 * Reference: Iwamoto et al., J. Nucl. Sci. Technol. 59, 665-675 (2022)
 */
import { useState } from 'react';
import { X, Database, Search, Atom, Radio } from 'lucide-react';
import '@/components/ui/button';
import '@/components/ui/input';
import '@/components/ui/separator';
import 'sonner';

interface NuclideData {
  symbol: string;
  z: number;
  a: number;
  name: string;
  reactions: Array<{ type: string; mt: number; threshold: number; max: number; data: [number, number][] }>;
  thermal: { capture: number; fission?: number; scattering: number };
}

const JENDL5_NUCLIDES: NuclideData[] = [
  {
    symbol: 'O-16', z: 8, a: 16, name: 'Oxygen-16',
    thermal: { capture: 0.19e-3, scattering: 4.03 },
    reactions: [
      { type: '(n,γ) Radiative Capture', mt: 102, threshold: 0, max: 0.5e-3, data: [[0.001, 0.19e-3], [0.01, 0.15e-3], [0.1, 0.08e-3], [1, 0.02e-3], [10, 0.005e-3]] },
      { type: '(n,α) Alpha Production', mt: 107, threshold: 2.35, max: 0.15, data: [[2.35, 0], [3, 0.05], [5, 0.12], [8, 0.15], [14, 0.08], [20, 0.03]] },
      { type: '(n,p) Proton Production', mt: 103, threshold: 10.2, max: 0.08, data: [[10.2, 0], [12, 0.03], [15, 0.06], [20, 0.08]] },
    ],
  },
  {
    symbol: 'H-1', z: 1, a: 1, name: 'Hydrogen-1 (Proton)',
    thermal: { capture: 0.332, scattering: 20.5 },
    reactions: [
      { type: '(n,γ) Radiative Capture', mt: 102, threshold: 0, max: 0.332, data: [[0.001, 0.332], [0.01, 0.32], [0.1, 0.25], [1, 0.15], [10, 0.05]] },
      { type: '(n,elastic) Scattering', mt: 2, threshold: 0, max: 20.5, data: [[0.001, 20.5], [0.01, 20.5], [0.1, 15.0], [1, 4.0], [10, 1.5]] },
    ],
  },
  {
    symbol: 'Fe-56', z: 26, a: 56, name: 'Iron-56',
    thermal: { capture: 2.56, scattering: 11.2 },
    reactions: [
      { type: '(n,γ) Radiative Capture', mt: 102, threshold: 0, max: 2.56, data: [[0.001, 2.56], [0.01, 1.8], [0.1, 0.8], [1, 0.2], [10, 0.03]] },
      { type: '(n,elastic) Scattering', mt: 2, threshold: 0, max: 11.2, data: [[0.001, 11.2], [0.01, 11.0], [0.1, 8.0], [1, 3.0], [10, 1.2]] },
      { type: '(n,2n) Production', mt: 16, threshold: 11.2, max: 1.5, data: [[11.2, 0], [12, 0.3], [14, 0.8], [16, 1.2], [20, 1.5]] },
      { type: '(n,p) Mn-56 Production', mt: 103, threshold: 4.9, max: 0.3, data: [[4.9, 0], [6, 0.1], [8, 0.2], [10, 0.25], [14, 0.3], [20, 0.2]] },
    ],
  },
  {
    symbol: 'Pb-208', z: 82, a: 208, name: 'Lead-208',
    thermal: { capture: 0.5e-3, scattering: 11.4 },
    reactions: [
      { type: '(n,γ) Radiative Capture', mt: 102, threshold: 0, max: 0.5e-3, data: [[0.001, 0.5e-3], [0.01, 0.4e-3], [0.1, 0.2e-3], [1, 0.05e-3]] },
      { type: '(n,elastic) Scattering', mt: 2, threshold: 0, max: 11.4, data: [[0.001, 11.4], [0.01, 11.0], [0.1, 8.0], [1, 3.5], [10, 1.5]] },
    ],
  },
  {
    symbol: 'W-184', z: 74, a: 184, name: 'Tungsten-184',
    thermal: { capture: 0.6, scattering: 7.0 },
    reactions: [
      { type: '(n,γ) Radiative Capture', mt: 102, threshold: 0, max: 0.6, data: [[0.001, 0.6], [0.01, 0.45], [0.1, 0.2], [1, 0.05], [10, 0.01]] },
      { type: '(n,elastic) Scattering', mt: 2, threshold: 0, max: 7.0, data: [[0.001, 7.0], [0.01, 6.5], [0.1, 4.5], [1, 2.0], [10, 0.8]] },
      { type: '(n,2n) Production', mt: 16, threshold: 8.1, max: 2.0, data: [[8.1, 0], [10, 0.5], [14, 1.2], [20, 2.0]] },
    ],
  },
  {
    symbol: 'B-10', z: 5, a: 10, name: 'Boron-10',
    thermal: { capture: 3840, scattering: 2.0 },
    reactions: [
      { type: '(n,α) Li-7 Production', mt: 107, threshold: 0, max: 3840, data: [[0.001, 3840], [0.01, 3000], [0.1, 1500], [1, 400], [10, 100]] },
      { type: '(n,elastic) Scattering', mt: 2, threshold: 0, max: 2.0, data: [[0.001, 2.0], [0.01, 2.0], [0.1, 1.5], [1, 0.5]] },
    ],
  },
  {
    symbol: 'C-12', z: 6, a: 12, name: 'Carbon-12',
    thermal: { capture: 3.4e-3, scattering: 4.74 },
    reactions: [
      { type: '(n,γ) Radiative Capture', mt: 102, threshold: 0, max: 3.4e-3, data: [[0.001, 3.4e-3], [0.01, 2.5e-3], [0.1, 1.2e-3], [1, 0.3e-3]] },
      { type: '(n,elastic) Scattering', mt: 2, threshold: 0, max: 4.74, data: [[0.001, 4.74], [0.01, 4.5], [0.1, 3.0], [1, 1.2], [10, 0.5]] },
      { type: '(n,n′3α) Spallation', mt: 5, threshold: 7.4, max: 0.3, data: [[7.4, 0], [10, 0.1], [15, 0.2], [20, 0.3]] },
    ],
  },
  {
    symbol: 'Cu-63', z: 29, a: 63, name: 'Copper-63',
    thermal: { capture: 4.5, scattering: 8.5 },
    reactions: [
      { type: '(n,γ) Radiative Capture', mt: 102, threshold: 0, max: 4.5, data: [[0.001, 4.5], [0.01, 3.5], [0.1, 1.8], [1, 0.5], [10, 0.08]] },
      { type: '(n,elastic) Scattering', mt: 2, threshold: 0, max: 8.5, data: [[0.001, 8.5], [0.01, 7.5], [0.1, 5.0], [1, 2.0], [10, 0.8]] },
      { type: '(n,2n) Cu-62 Production', mt: 16, threshold: 10.8, max: 0.5, data: [[10.8, 0], [12, 0.1], [15, 0.3], [20, 0.5]] },
    ],
  },
  {
    symbol: 'N-14', z: 7, a: 14, name: 'Nitrogen-14',
    thermal: { capture: 0.075, scattering: 10.0 },
    reactions: [
      { type: '(n,p) C-14 Production', mt: 103, threshold: 0.6, max: 1.85, data: [[0.6, 0], [1, 0.5], [2, 1.0], [5, 1.6], [10, 1.85], [14, 1.5], [20, 1.0]] },
      { type: '(n,γ) Radiative Capture', mt: 102, threshold: 0, max: 0.075, data: [[0.001, 0.075], [0.01, 0.06], [0.1, 0.03], [1, 0.01]] },
    ],
  },
  {
    symbol: 'Al-27', z: 13, a: 27, name: 'Aluminum-27',
    thermal: { capture: 0.23, scattering: 1.4 },
    reactions: [
      { type: '(n,γ) Radiative Capture', mt: 102, threshold: 0, max: 0.23, data: [[0.001, 0.23], [0.01, 0.18], [0.1, 0.08], [1, 0.02], [10, 0.005]] },
      { type: '(n,elastic) Scattering', mt: 2, threshold: 0, max: 1.4, data: [[0.001, 1.4], [0.01, 1.3], [0.1, 0.9], [1, 0.4], [10, 0.15]] },
      { type: '(n,α) Na-24 Production', mt: 107, threshold: 3.25, max: 0.12, data: [[3.25, 0], [5, 0.05], [8, 0.1], [14, 0.12], [20, 0.08]] },
    ],
  },
];

// Label import needed
function _Label(props: any) { return <label {...props} className={`text-sm font-medium ${props.className || ''}`} />; }

interface Props { open: boolean; onOpenChange: (open: boolean) => void; }

export default function JENDL5DataViewer({ open, onOpenChange }: Props) {
  const [search, setSearch] = useState('');
  const [selectedNuclide, setSelectedNuclide] = useState<NuclideData>(JENDL5_NUCLIDES[0]);
  const [selectedReaction, setSelectedReaction] = useState(0);

  const filtered = JENDL5_NUCLIDES.filter(n =>
    n.symbol.toLowerCase().includes(search.toLowerCase()) ||
    n.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  const reaction = selectedNuclide.reactions[selectedReaction];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">JENDL-5 Nuclear Data Viewer</h2>
            <span className="text-[10px] text-slate-400">Japanese Evaluated Nuclear Data Library</span>
          </div>
          <button aria-label="Cerrar JENDL-5 Data Viewer" onClick={() => onOpenChange(false)} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left — Nuclide List */}
          <div className="w-56 border-r border-slate-200 flex flex-col">
            <div className="p-2 border-b border-slate-200">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search nuclide..."
                  className="w-full h-8 pl-7 pr-2 text-[11px] border rounded-lg" />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-1.5">
              {filtered.map(n => (
                <button key={n.symbol} onClick={() => { setSelectedNuclide(n); setSelectedReaction(0); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[11px] transition-colors mb-0.5 ${
                    selectedNuclide.symbol === n.symbol ? 'bg-blue-50 text-blue-800' : 'hover:bg-slate-50 text-slate-600'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{n.symbol}</span>
                    <span className="text-[9px] text-slate-400">Z={n.z}</span>
                  </div>
                  <p className="text-[9px] text-slate-400">{n.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right — Data */}
          <div className="flex-1 overflow-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedNuclide.symbol} — {selectedNuclide.name}</h3>
                <p className="text-[10px] text-slate-500">JENDL-5 — Iwamoto et al., JNST 59, 665-675 (2022)</p>
              </div>
              <div className="flex gap-2">
                {selectedNuclide.reactions.map((r, i) => (
                  <button key={i} onClick={() => setSelectedReaction(i)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                      selectedReaction === i ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                    {r.type.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Thermal Cross-Sections */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-blue-700">{selectedNuclide.thermal.capture < 1 ? selectedNuclide.thermal.capture.toExponential(2) : selectedNuclide.thermal.capture.toFixed(2)}</p>
                <p className="text-[9px] text-slate-500">σ_capture (barns)</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-green-700">{selectedNuclide.thermal.scattering.toFixed(2)}</p>
                <p className="text-[9px] text-slate-500">σ_scattering (barns)</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-purple-700">{reaction.threshold.toFixed(1)}</p>
                <p className="text-[9px] text-slate-500">Threshold (MeV)</p>
              </div>
            </div>

            {/* Cross-Section Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                <p className="text-[11px] font-semibold text-slate-700">{reaction.type} — MT={reaction.mt}</p>
              </div>
              <table className="w-full text-[10px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-3 py-1.5 font-semibold text-slate-600">Energy (MeV)</th>
                    <th className="text-right px-3 py-1.5 font-semibold text-slate-600">Cross-Section (barns)</th>
                    <th className="text-right px-3 py-1.5 font-semibold text-slate-600">Visualization</th>
                  </tr>
                </thead>
                <tbody>
                  {reaction.data.map(([e, xs], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-3 py-1.5 font-mono">{e.toFixed(3)}</td>
                      <td className="text-right px-3 py-1.5 font-mono text-blue-700">{xs < 0.01 ? xs.toExponential(2) : xs.toFixed(3)}</td>
                      <td className="text-right px-3 py-1.5">
                        <div className="w-24 h-2 bg-slate-100 rounded-full ml-auto overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (xs / reaction.max) * 100)}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2 text-[9px] text-amber-700">
              <p><strong>Note:</strong> Values shown are representative. For production calculations, use ACE files from JENDL-5 distribution via PHITS/MCNP nuclear data interfaces.</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-[10px] text-slate-400">JENDL-5: 780+ nuclides, 0.001 eV – 200 MeV</p>
          <div className="flex gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><Atom className="w-3 h-3" /> {JENDL5_NUCLIDES.length} nuclides shown</span>
            <span className="flex items-center gap-1"><Radio className="w-3 h-3" /> MT reactions: {selectedNuclide.reactions.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
