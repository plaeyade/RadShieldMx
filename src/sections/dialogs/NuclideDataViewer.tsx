import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Atom, Search } from 'lucide-react';

interface Nuclide {
  symbol: string;
  name: string;
  z: number;
  a: number;
  halfLife: string;
  halfLife_sec: number;
  decayModes: string[];
  principalEnergies_keV: number[];
  dcf_Sv_per_Bq_ingestion: number;
  dcf_Sv_per_Bq_inhalation: number;
  source: 'ICRP-38' | 'ICRP-107';
  commonUse: string;
}

const NUCLIDES: Nuclide[] = [
  { symbol: 'Co-60', name: 'Cobalto-60', z: 27, a: 60, halfLife: '5.27 a', halfLife_sec: 1.66e8, decayModes: ['beta-', 'gamma'], principalEnergies_keV: [1173, 1332], dcf_Sv_per_Bq_ingestion: 3.4e-9, dcf_Sv_per_Bq_inhalation: 1.1e-8, source: 'ICRP-38', commonUse: 'Terapia gamma, industrial' },
  { symbol: 'Cs-137', name: 'Cesio-137', z: 55, a: 137, halfLife: '30.17 a', halfLife_sec: 9.51e8, decayModes: ['beta-', 'gamma'], principalEnergies_keV: [662], dcf_Sv_per_Bq_ingestion: 1.3e-8, dcf_Sv_per_Bq_inhalation: 3.9e-8, source: 'ICRP-38', commonUse: 'Terapia braquiterapia, industrial' },
  { symbol: 'Ir-192', name: 'Iridio-192', z: 77, a: 192, halfLife: '73.83 d', halfLife_sec: 6.38e6, decayModes: ['beta-', 'gamma', 'EC'], principalEnergies_keV: [316, 468], dcf_Sv_per_Bq_ingestion: 1.4e-9, dcf_Sv_per_Bq_inhalation: 4.2e-9, source: 'ICRP-38', commonUse: 'Braquiterapia HDR' },
  { symbol: 'I-131', name: 'Yodo-131', z: 53, a: 131, halfLife: '8.02 d', halfLife_sec: 6.93e5, decayModes: ['beta-', 'gamma'], principalEnergies_keV: [364], dcf_Sv_per_Bq_ingestion: 2.2e-8, dcf_Sv_per_Bq_inhalation: 7.4e-9, source: 'ICRP-38', commonUse: 'Medicina nuclear, terapia tiroidea' },
  { symbol: 'Tc-99m', name: 'Tecnecio-99m', z: 43, a: 99, halfLife: '6.01 h', halfLife_sec: 2.16e4, decayModes: ['IT', 'gamma'], principalEnergies_keV: [140], dcf_Sv_per_Bq_ingestion: 2.9e-11, dcf_Sv_per_Bq_inhalation: 2.0e-11, source: 'ICRP-38', commonUse: 'Diagnostico (marcador)' },
  { symbol: 'F-18', name: 'Fluor-18', z: 9, a: 18, halfLife: '109.8 m', halfLife_sec: 6.59e3, decayModes: ['beta+', 'EC', 'gamma'], principalEnergies_keV: [511], dcf_Sv_per_Bq_ingestion: 4.9e-11, dcf_Sv_per_Bq_inhalation: 3.1e-11, source: 'ICRP-107', commonUse: 'PET-CT (FDG)' },
  { symbol: 'Lu-177', name: 'Lutecio-177', z: 71, a: 177, halfLife: '6.65 d', halfLife_sec: 5.75e5, decayModes: ['beta-', 'gamma'], principalEnergies_keV: [113, 208], dcf_Sv_per_Bq_ingestion: 4.6e-10, dcf_Sv_per_Bq_inhalation: 2.7e-9, source: 'ICRP-107', commonUse: 'Terapia molecular (PRRT)' },
  { symbol: 'Ra-226', name: 'Radio-226', z: 88, a: 226, halfLife: '1600 a', halfLife_sec: 5.05e10, decayModes: ['alpha', 'gamma'], principalEnergies_keV: [186, 262], dcf_Sv_per_Bq_ingestion: 2.8e-7, dcf_Sv_per_Bq_inhalation: 9.2e-6, source: 'ICRP-38', commonUse: 'Legacy sources, braquiterapia historica' },
  { symbol: 'Am-241', name: 'Americio-241', z: 95, a: 241, halfLife: '432.2 a', halfLife_sec: 1.36e10, decayModes: ['alpha', 'gamma'], principalEnergies_keV: [59.5], dcf_Sv_per_Bq_ingestion: 2.0e-7, dcf_Sv_per_Bq_inhalation: 3.9e-5, source: 'ICRP-38', commonUse: 'Detectores de humo, densitometria' },
  { symbol: 'Sr-90', name: 'Estroncio-90', z: 38, a: 90, halfLife: '28.79 a', halfLife_sec: 9.08e8, decayModes: ['beta-'], principalEnergies_keV: [546], dcf_Sv_per_Bq_ingestion: 2.8e-8, dcf_Sv_per_Bq_inhalation: 7.4e-8, source: 'ICRP-38', commonUse: 'Fuentes industriales, Y-90 generator' },
  { symbol: 'Y-90', name: 'Itrio-90', z: 39, a: 90, halfLife: '64.0 h', halfLife_sec: 2.30e5, decayModes: ['beta-'], principalEnergies_keV: [2270], dcf_Sv_per_Bq_ingestion: 2.7e-9, dcf_Sv_per_Bq_inhalation: 1.6e-8, source: 'ICRP-107', commonUse: 'Terapia con radiofarmacos (SIRT)' },
  { symbol: 'Ga-68', name: 'Galio-68', z: 31, a: 68, halfLife: '67.7 m', halfLife_sec: 4.06e3, decayModes: ['beta+', 'EC', 'gamma'], principalEnergies_keV: [511, 1077], dcf_Sv_per_Bq_ingestion: 2.1e-11, dcf_Sv_per_Bq_inhalation: 2.9e-11, source: 'ICRP-107', commonUse: 'PET (DOTATATE, PSMA)' },
];

interface NuclideDataViewerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function NuclideDataViewer({ open, onOpenChange }: NuclideDataViewerProps) {
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'ICRP-38' | 'ICRP-107'>('all');

  const filtered = useMemo(() => {
    return NUCLIDES.filter(n => {
      const matchesSearch = !search || n.symbol.toLowerCase().includes(search.toLowerCase()) || n.name.toLowerCase().includes(search.toLowerCase()) || n.commonUse.toLowerCase().includes(search.toLowerCase());
      const matchesSource = filterSource === 'all' || n.source === filterSource;
      return matchesSearch && matchesSource;
    });
  }, [search, filterSource]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Atom className="w-5 h-5 text-blue-500" />
            Nuclide Data Viewer — ICRP 38 & 107
            <Badge variant="outline" className="text-[10px]">{NUCLIDES.length} nuclidos</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Buscar por simbolo, nombre o uso..." className="pl-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Badge className={`cursor-pointer text-[9px] h-6 ${filterSource === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'}`} onClick={() => setFilterSource('all')}>Todas</Badge>
          <Badge className={`cursor-pointer text-[9px] h-6 ${filterSource === 'ICRP-38' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'}`} onClick={() => setFilterSource('ICRP-38')}>ICRP-38</Badge>
          <Badge className={`cursor-pointer text-[9px] h-6 ${filterSource === 'ICRP-107' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'}`} onClick={() => setFilterSource('ICRP-107')}>ICRP-107</Badge>
        </div>

        <ScrollArea className="px-6 pb-6 max-h-[55vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">Nuclido</TableHead>
                <TableHead className="text-[10px]">Z/A</TableHead>
                <TableHead className="text-[10px]">T1/2</TableHead>
                <TableHead className="text-[10px]">Modos</TableHead>
                <TableHead className="text-[10px] text-right">Energias (keV)</TableHead>
                <TableHead className="text-[10px] text-right">DCF Ing.</TableHead>
                <TableHead className="text-[10px] text-right">DCF Inh.</TableHead>
                <TableHead className="text-[10px]">Fuente</TableHead>
                <TableHead className="text-[10px]">Uso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(n => (
                <TableRow key={n.symbol}>
                  <TableCell className="text-xs font-bold">{n.symbol}</TableCell>
                  <TableCell className="text-xs">{n.z}/{n.a}</TableCell>
                  <TableCell className="text-xs font-mono">{n.halfLife}</TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      {n.decayModes.map(m => (
                        <Badge key={m} variant="outline" className="text-[8px] h-3.5 px-0.5">{m}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">{n.principalEnergies_keV.join(', ')}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{n.dcf_Sv_per_Bq_ingestion.toExponential(1)}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{n.dcf_Sv_per_Bq_inhalation.toExponential(1)}</TableCell>
                  <TableCell><Badge className="text-[8px] h-3.5 px-0.5 bg-slate-100">{n.source}</Badge></TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-[150px] truncate">{n.commonUse}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="px-6 pb-4 text-[10px] text-slate-500">
          DCF = Dose Conversion Factor (Sv/Bq). Datos de ICRP Publications 38, 68, 72 y 107.
          Energias principales de fotones/gamma en keV.
        </div>
      </DialogContent>
    </Dialog>
  );
}
