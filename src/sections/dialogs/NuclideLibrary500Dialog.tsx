import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAppStore, dialogoAbierto } from '@/stores/appStore';
import { Atom, BookOpen } from 'lucide-react';

interface Nuclide {
  symbol: string; name: string; z: number; a: number; half: number; halfUnit: string;
  gamma: number; emit: string[]; uses: string[]; category: string;
}

const NUCLIDES: Nuclide[] = [
  // Diagnostic
  { symbol: 'H-3', name: 'Tritio', z: 1, a: 3, half: 12.3, halfUnit: 'años', gamma: 0, emit: ['beta'], uses: ['Radioluminiscencia','Marcadores'], category: 'Diag' },
  { symbol: 'C-14', name: 'Carbono-14', z: 6, a: 14, half: 5730, halfUnit: 'años', gamma: 0, emit: ['beta'], uses: ['Datacion','Biologia'], category: 'Diag' },
  { symbol: 'F-18', name: 'Fluor-18', z: 9, a: 18, half: 109.8, halfUnit: 'min', gamma: 0.511, emit: ['beta+'], uses: ['PET/CT','Oncologia'], category: 'Diag' },
  { symbol: 'Ga-68', name: 'Galio-68', z: 31, a: 68, half: 67.7, halfUnit: 'min', gamma: 1.077, emit: ['beta+'], uses: ['PET','Neuroendocrino'], category: 'Diag' },
  { symbol: 'Tc-99m', name: 'Tecnecio-99m', z: 43, a: 99, half: 6.01, halfUnit: 'h', gamma: 0.140, emit: ['gamma','IC'], uses: ['SPECT','Cardiologia','Oseo'], category: 'Diag' },
  { symbol: 'In-111', name: 'Indio-111', z: 49, a: 111, half: 67.3, halfUnit: 'h', gamma: 0.245, emit: ['gamma','EC'], uses: ['SPECT','Leucocitos'], category: 'Diag' },
  { symbol: 'I-123', name: 'Yodo-123', z: 53, a: 123, half: 13.2, halfUnit: 'h', gamma: 0.159, emit: ['gamma','EC'], uses: ['SPECT','Tiroides'], category: 'Diag' },
  { symbol: 'I-125', name: 'Yodo-125', z: 53, a: 125, half: 59.4, halfUnit: 'dias', gamma: 0.027, emit: ['gamma','EC'], uses: ['Braquiterapia','Prostata'], category: 'Terap' },
  // Therapy
  { symbol: 'I-131', name: 'Yodo-131', z: 53, a: 131, half: 8.02, halfUnit: 'dias', gamma: 0.364, emit: ['beta','gamma'], uses: ['Terapia Tiroides','Hipertiroidismo'], category: 'Terap' },
  { symbol: 'Cs-137', name: 'Cesio-137', z: 55, a: 137, half: 30.17, halfUnit: 'años', gamma: 0.662, emit: ['beta','gamma'], uses: ['Braquiterapia','Calibracion'], category: 'Terap' },
  { symbol: 'Y-90', name: 'Itrio-90', z: 39, a: 90, half: 64.0, halfUnit: 'h', gamma: 0, emit: ['beta'], uses: ['Terapia molecular','Radioembolizacion'], category: 'Terap' },
  { symbol: 'Lu-177', name: 'Lutecio-177', z: 71, a: 177, half: 6.65, halfUnit: 'dias', gamma: 0.208, emit: ['beta','gamma'], uses: ['PRRT','Neuroendocrino'], category: 'Terap' },
  { symbol: 'Ra-223', name: 'Radio-223', z: 88, a: 223, half: 11.4, halfUnit: 'dias', gamma: 0.154, emit: ['alpha','beta','gamma'], uses: ['Terapia osea','Prostata'], category: 'Terap' },
  // Industrial / High energy
  { symbol: 'Co-60', name: 'Cobalto-60', z: 27, a: 60, half: 5.27, halfUnit: 'años', gamma: 1.17, emit: ['beta','gamma'], uses: ['Teleterapia','Esterilizacion','NDT'], category: 'Ind' },
  { symbol: 'Ir-192', name: 'Iridio-192', z: 77, a: 192, half: 73.8, halfUnit: 'dias', gamma: 0.38, emit: ['beta','gamma'], uses: ['Braquiterapia HDR','Gammagrafia'], category: 'Ind' },
  { symbol: 'Se-75', name: 'Selenio-75', z: 34, a: 75, half: 119.8, halfUnit: 'dias', gamma: 0.265, emit: ['gamma','EC'], uses: ['Gammagrafia industrial'], category: 'Ind' },
  { symbol: 'Am-241', name: 'Americio-241', z: 95, a: 241, half: 432, halfUnit: 'años', gamma: 0.059, emit: ['alpha','gamma'], uses: ['Humedad','Densidad','Detectores'], category: 'Ind' },
  { symbol: 'Cf-252', name: 'Californio-252', z: 98, a: 252, half: 2.65, halfUnit: 'años', gamma: 2.14, emit: ['alpha','neutron','gamma'], uses: ['Neutronografia','Reactor'], category: 'Ind' },
  { symbol: 'Pu-238', name: 'Plutonio-238', z: 94, a: 238, half: 87.7, halfUnit: 'años', gamma: 0.04, emit: ['alpha'], uses: ['RTG espacial','Energia'], category: 'Ind' },
  { symbol: 'Xe-133', name: 'Xenon-133', z: 54, a: 133, half: 5.27, halfUnit: 'dias', gamma: 0.081, emit: ['beta','gamma'], uses: ['Ventilacion pulmonar','Nuclear'], category: 'Diag' },
  { symbol: 'Sr-90', name: 'Estroncio-90', z: 38, a: 90, half: 28.8, halfUnit: 'años', gamma: 0, emit: ['beta'], uses: ['Aplicaciones oculares','Fuentes'], category: 'Terap' },
  { symbol: 'Au-198', name: 'Oro-198', z: 79, a: 198, half: 2.70, halfUnit: 'dias', gamma: 0.412, emit: ['beta','gamma'], uses: ['Terapia peritoneal','Linfoma'], category: 'Terap' },
  { symbol: 'Ra-226', name: 'Radio-226', z: 88, a: 226, half: 1600, halfUnit: 'años', gamma: 0.047, emit: ['alpha','beta','gamma'], uses: ['Historico','Museo'], category: 'Ind' },
  { symbol: 'Yb-169', name: 'Yterbio-169', z: 70, a: 169, half: 32.0, halfUnit: 'dias', gamma: 0.063, emit: ['gamma','EC'], uses: ['Gammagrafia delgada'], category: 'Ind' },
  { symbol: 'P-32', name: 'Fosforo-32', z: 15, a: 32, half: 14.3, halfUnit: 'dias', gamma: 0, emit: ['beta'], uses: ['Terapia de superficie','Ocular'], category: 'Terap' },
  { symbol: 'Sm-153', name: 'Samario-153', z: 62, a: 153, half: 46.3, halfUnit: 'h', gamma: 0.103, emit: ['beta','gamma'], uses: ['Palo dolor oseo','Palliative'], category: 'Terap' },
  { symbol: 'Tb-161', name: 'Terbio-161', z: 65, a: 161, half: 6.89, halfUnit: 'dias', gamma: 0.05, emit: ['beta','gamma'], uses: ['Terapia molecular emergente'], category: 'Terap' },
  { symbol: 'Ac-225', name: 'Actinio-225', z: 89, a: 225, half: 9.92, halfUnit: 'dias', gamma: 0.1, emit: ['alpha','beta','gamma'], uses: ['Terapia alpha dirigida','Investigacion'], category: 'Terap' },
  { symbol: 'Th-227', name: 'Torio-227', z: 90, a: 227, half: 18.7, halfUnit: 'dias', gamma: 0.24, emit: ['alpha','beta','gamma'], uses: ['Terapia alpha','Investigacion'], category: 'Terap' },
  { symbol: 'At-211', name: 'Astato-211', z: 85, a: 211, half: 7.21, halfUnit: 'h', gamma: 0.687, emit: ['alpha','EC'], uses: ['Terapia alpha','Neuroendocrino'], category: 'Terap' },
  { symbol: 'Pb-212', name: 'Plomo-212', z: 82, a: 212, half: 10.6, halfUnit: 'h', gamma: 0.239, emit: ['beta','gamma','alpha'], uses: ['Terapia alpha','Generador'], category: 'Terap' },
  { symbol: 'Bi-213', name: 'Bismuto-213', z: 83, a: 213, half: 45.6, halfUnit: 'min', gamma: 0.44, emit: ['alpha','beta','gamma'], uses: ['Radioinmunoterapia alpha','Leucemia'], category: 'Terap' },
  { symbol: 'Ge-68', name: 'Germanio-68', z: 32, a: 68, half: 270.8, halfUnit: 'dias', gamma: 0.511, emit: ['EC','beta+'], uses: ['Generador Ga-68','PET'], category: 'Diag' },
  { symbol: 'Rb-82', name: 'Rubidio-82', z: 37, a: 82, half: 1.27, halfUnit: 'min', gamma: 0.511, emit: ['beta+'], uses: ['PET cardiaco','Perfusion miocardica'], category: 'Diag' },
  { symbol: 'N-13', name: 'Nitrogeno-13', z: 7, a: 13, half: 9.97, halfUnit: 'min', gamma: 0.511, emit: ['beta+'], uses: ['PET cardiaco','Amoniaco'], category: 'Diag' },
  { symbol: 'O-15', name: 'Oxigeno-15', z: 8, a: 15, half: 122, halfUnit: 's', gamma: 0.511, emit: ['beta+'], uses: ['PET','Flujo sanguineo','Agua'], category: 'Diag' },
  { symbol: 'C-11', name: 'Carbono-11', z: 6, a: 11, half: 20.4, halfUnit: 'min', gamma: 0.511, emit: ['beta+'], uses: ['PET','Metabolismo','Colina'], category: 'Diag' },
  { symbol: 'Zr-89', name: 'Circonio-89', z: 40, a: 89, half: 78.4, halfUnit: 'h', gamma: 0.909, emit: ['beta+','EC'], uses: ['PET immuno','Anticuerpos'], category: 'Diag' },
  { symbol: 'Cu-64', name: 'Cobre-64', z: 29, a: 64, half: 12.7, halfUnit: 'h', gamma: 0.511, emit: ['beta+','EC','beta-'], uses: ['PET teranostico','Peptidos'], category: 'Diag' },
  { symbol: 'I-124', name: 'Yodo-124', z: 53, a: 124, half: 4.18, halfUnit: 'dias', gamma: 0.511, emit: ['beta+','EC'], uses: ['PET tiroides','Dosimetria'], category: 'Diag' },
];

const CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
  Diag: { label: 'Diagnostico', color: '#059669', bg: '#ecfdf5' },
  Terap: { label: 'Terapia', color: '#dc2626', bg: '#fef2f2' },
  Ind: { label: 'Industrial', color: '#2563eb', bg: '#eff6ff' },
};

export default function NuclideLibrary500Dialog() {
  const open = useAppStore(s => dialogoAbierto(s.dialogs.nuclideLibrary500));
  const close = () => useAppStore.getState().close('nuclideLibrary500');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const filtered = useMemo(() => {
    return NUCLIDES.filter(n => {
      const matchesSearch = !search || n.symbol.toLowerCase().includes(search.toLowerCase()) || n.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = !catFilter || n.category === catFilter;
      return matchesSearch && matchesCat;
    });
  }, [search, catFilter]);

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Atom className="w-5 h-5 text-[#7c3aed]" /> Extended Radionuclide Library — v123
            <span className="text-[10px] font-mono text-slate-400">{NUCLIDES.length} nuclidos</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-2"><Input placeholder="Buscar por simbolo o nombre..." value={search} onChange={e => setSearch(e.target.value)} className="h-7 text-xs" /></div>
            <div>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="w-full text-xs border rounded h-7 px-1">
                <option value="">Todas las categorias</option>
                <option value="Diag">Diagnostico</option>
                <option value="Terap">Terapia</option>
                <option value="Ind">Industrial</option>
              </select>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center">{filtered.length} de {NUCLIDES.length} resultados</div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-1">
            {filtered.map(n => {
              const cat = CATEGORIES[n.category];
              return (
                <div key={n.symbol} className="flex items-center gap-2 p-1.5 rounded border border-slate-100 hover:bg-slate-50 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: cat.bg, color: cat.color }}>{n.symbol}</span>
                  <span className="font-semibold w-24 truncate">{n.name}</span>
                  <span className="text-slate-400 w-8">Z={n.z}</span>
                  <span className="text-slate-400 w-10">A={n.a}</span>
                  <span className="text-slate-500 w-20">{n.half} {n.halfUnit}</span>
                  <span className="text-slate-500 w-12">{n.gamma > 0 ? n.gamma + ' MeV' : '—'}</span>
                  <span className="text-slate-400 flex-1 truncate">{n.uses.join(', ')}</span>
                  <span className="px-1 rounded text-[9px]" style={{ backgroundColor: cat.bg, color: cat.color }}>{cat.label}</span>
                </div>
              );
            })}
          </div>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><BookOpen className="w-3 h-3" />Ref: ICRP 107 | NCRP 155 | IAEA STI/PUB/1560 | MicroShield Library</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
