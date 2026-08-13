import { useCallback, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { X, Radiation, Zap, Brain, Atom, Scan, Microscope, FlaskConical, Factory, ShieldCheck, Stethoscope, Activity, ChevronRight, BookOpen, Check, Maximize2, Minimize2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SourceItem {
  id: string;
  name: string;
  category: string;
  energy: string;
  standard: string;
  ncrp_report: string | null;
  aapm_tg: string | null;
  iaea_ref: string | null;
  cnsns_ref: string | null;
  workload_default: number;
  description: string;
}

export type SourceCatalogItem = SourceItem;

const CATALOG: SourceItem[] = [
  { id: 'x_ray_diagnostic', name: 'Rayos X Diagnostico', category: 'diagnostic', energy: '100-150 kVp', standard: 'NCRP-147', ncrp_report: '147', aapm_tg: null, iaea_ref: 'IAEA SSG-46', cnsns_ref: 'NOM-008-NUCL', workload_default: 300, description: 'Sala de rayos X general. Barrera primaria concreto 100-150mm.' },
  { id: 'mammography', name: 'Mamografia / DBT', category: 'diagnostic', energy: '25-35 kVp', standard: 'NCRP-147', ncrp_report: '147', aapm_tg: 'TG240', iaea_ref: 'IAEA SSG-46', cnsns_ref: 'NOM-008-NUCL', workload_default: 100, description: 'Mamografia digital / tomosintesis. Barrera minima: plomo 0.3mm.' },
  { id: 'fluoroscopy', name: 'Fluoroscopia / C-arm', category: 'diagnostic', energy: '75-125 kVp', standard: 'NCRP-147', ncrp_report: '147', aapm_tg: null, iaea_ref: 'IAEA SSG-46', cnsns_ref: 'NOM-008-NUCL', workload_default: 500, description: 'Fluoroscopia intervencionista. Alta carga de trabajo.' },
  { id: 'ct_scanner', name: 'Tomografo CT / PET-CT', category: 'diagnostic', energy: '120-140 kVp / 511 keV', standard: 'NCRP-147', ncrp_report: '147', aapm_tg: null, iaea_ref: 'IAEA SSG-46', cnsns_ref: 'NOM-008-NUCL', workload_default: 250, description: 'CT multidetector o PET/CT. Blindaje para scatter isotropico.' },
  { id: 'dental_cbct', name: 'Dental / CBCT', category: 'diagnostic', energy: '60-120 kVp', standard: 'NCRP-145', ncrp_report: '145', aapm_tg: null, iaea_ref: null, cnsns_ref: 'NOM-008-NUCL', workload_default: 50, description: 'Radiografia dental o CBCT. Blindaje minimo.' },
  { id: 'mobile_xray', name: 'Rayos X Portatil', category: 'diagnostic', energy: '50-110 kVp', standard: 'NCRP-168', ncrp_report: '168', aapm_tg: null, iaea_ref: null, cnsns_ref: 'NOM-008-NUCL', workload_default: 100, description: 'Unidad movil de RX. Blindaje depende del uso.' },
  { id: 'linac_6mv', name: 'LINAC 6 MV', category: 'therapy', energy: '6 MV', standard: 'NCRP-151', ncrp_report: '151', aapm_tg: 'TG51', iaea_ref: 'TRS-398', cnsns_ref: 'LA-007/01', workload_default: 450, description: 'Acelerador lineal 6 MV. TVL concreto = 34cm.' },
  { id: 'linac_10mv', name: 'LINAC 10 MV', category: 'therapy', energy: '10 MV', standard: 'NCRP-151', ncrp_report: '151', aapm_tg: 'TG51', iaea_ref: 'TRS-398', cnsns_ref: 'LA-007/01', workload_default: 450, description: 'LINAC 10 MV. Inicio produccion de neutrones.' },
  { id: 'linac_15mv', name: 'LINAC 15 MV', category: 'therapy', energy: '15 MV', standard: 'NCRP-151', ncrp_report: '151', aapm_tg: 'TG51', iaea_ref: 'TRS-398', cnsns_ref: 'LA-007/01', workload_default: 450, description: 'LINAC 15 MV. TVL concreto = 43cm. Blindaje neutrones obligatorio.' },
  { id: 'linac_18mv', name: 'LINAC 18 MV', category: 'therapy', energy: '18 MV', standard: 'NCRP-151', ncrp_report: '151', aapm_tg: 'TG51', iaea_ref: 'TRS-398', cnsns_ref: 'LA-007/01', workload_default: 450, description: 'LINAC 18 MV. TVL concreto = 46cm. Maxima produccion de neutrones.' },
  { id: 'cobalt_60', name: 'Cobalto-60 (Theratron)', category: 'therapy', energy: '1.17 + 1.33 MeV', standard: 'NCRP-151', ncrp_report: '151', aapm_tg: 'TG51', iaea_ref: 'TRS-398', cnsns_ref: 'LA-007/01', workload_default: 20, description: 'Unidad de Cobalto-60. TVL concreto = 19.6cm.' },
  { id: 'gamma_knife', name: 'Gamma Knife (Leksell)', category: 'radiosurgery', energy: 'Co-60 (1.25 MeV avg)', standard: 'AAPM-TG108', ncrp_report: null, aapm_tg: 'TG108', iaea_ref: 'TRS-398', cnsns_ref: 'LA-007/01', workload_default: 50, description: 'Gamma Knife Perfexion/Icon. 201 fuentes Co-60.' },
  { id: 'cyberknife', name: 'CyberKnife', category: 'radiosurgery', energy: '6 MV', standard: 'AAPM-TG108', ncrp_report: null, aapm_tg: 'TG108', iaea_ref: 'TRS-398', cnsns_ref: 'LA-007/01', workload_default: 30, description: 'CyberKnife M6/S7. LINAC en brazo robotico.' },
  { id: 'pet_f18', name: 'PET/CT — F-18 FDG', category: 'nuclear_medicine', energy: '511 keV', standard: 'AAPM-TG108', ncrp_report: '155', aapm_tg: 'TG108', iaea_ref: 'RS-G-1.7', cnsns_ref: 'NOM-040-NUCL', workload_default: 150, description: 'PET/CT con F-18 FDG. Concreto baritado 150-200mm.' },
  { id: 'spect_tc99m', name: 'SPECT — Tc-99m', category: 'nuclear_medicine', energy: '140 keV', standard: 'NCRP-155', ncrp_report: '155', aapm_tg: null, iaea_ref: 'RS-G-1.7', cnsns_ref: 'NOM-040-NUCL', workload_default: 100, description: 'Gamma camera con Tc-99m. Blindaje moderado con plomo.' },
  { id: 'i131_therapy', name: 'I-131 Terapia', category: 'nuclear_medicine', energy: '364 keV', standard: 'NCRP-155', ncrp_report: '155', aapm_tg: null, iaea_ref: 'RS-G-1.7', cnsns_ref: 'NOM-040-NUCL', workload_default: 50, description: 'Terapia con I-131 (tiroides). Paciente como fuente ambulatoria.' },
  { id: 'hdr_ir192', name: 'HDR — Ir-192', category: 'brachytherapy', energy: '380 keV avg', standard: 'NCRP-155', ncrp_report: '155', aapm_tg: 'TG56', iaea_ref: 'TRS-398', cnsns_ref: 'LA-007/01', workload_default: 40, description: 'HDR braquiterapia con Ir-192. Bunker concreto 600-800mm.' },
  { id: 'hdr_co60', name: 'HDR — Co-60', category: 'brachytherapy', energy: '1.25 MeV', standard: 'NCRP-155', ncrp_report: '155', aapm_tg: 'TG56', iaea_ref: 'TRS-398', cnsns_ref: 'LA-007/01', workload_default: 40, description: 'HDR braquiterapia con Co-60. Bunker pesado.' },
  { id: 'cyclotron', name: 'Ciclotron (FDG)', category: 'cyclotron', energy: 'Variable (hasta 18 MeV)', standard: 'NCRP-144', ncrp_report: '144', aapm_tg: null, iaea_ref: 'TRS-314', cnsns_ref: 'LA-007/01', workload_default: 500, description: 'Ciclotron para FDG. Blindaje para neutrones y activacion.' },
];

const CAT_CFG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  diagnostic: { label: 'Diagnostico', icon: <Scan className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50' },
  therapy: { label: 'Radioterapia', icon: <Zap className="w-3.5 h-3.5" />, color: 'text-red-600 bg-red-50' },
  radiosurgery: { label: 'Radiocirugia', icon: <Brain className="w-3.5 h-3.5" />, color: 'text-purple-600 bg-purple-50' },
  nuclear_medicine: { label: 'Med. Nuclear', icon: <Atom className="w-3.5 h-3.5" />, color: 'text-amber-600 bg-amber-50' },
  brachytherapy: { label: 'Braquiterapia', icon: <FlaskConical className="w-3.5 h-3.5" />, color: 'text-pink-600 bg-pink-50' },
  cyclotron: { label: 'Ciclotron', icon: <Factory className="w-3.5 h-3.5" />, color: 'text-slate-600 bg-slate-50' },
};

interface Props {
  onSelect: (source: SourceItem) => void;
  onClose: () => void;
  selectedId?: string | null;
}

export default function SourceSelector({ onSelect, onClose, selectedId }: Props) {
  const [activeCat, setActiveCat] = useState<string | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const shellStyle = useMemo(() => {
    if (maximized) return { transform: 'none' };
    return { transform: `translate(${position.x}px, ${position.y}px)` };
  }, [maximized, position.x, position.y]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (maximized) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('button,input')) return;
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [maximized, position.x, position.y]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setPosition({
      x: dragRef.current.originX + event.clientX - dragRef.current.startX,
      y: dragRef.current.originY + event.clientY - dragRef.current.startY,
    });
  }, []);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
  }, []);

  const cats = [...new Set(CATALOG.map(s => s.category))];
  const filtered = CATALOG.filter(s => {
    const mc = activeCat === 'all' || s.category === activeCat;
    const ms = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.energy.toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-start justify-end bg-transparent p-3"
      role="dialog"
      aria-modal="false"
      aria-label="Selector de fuente radiologica"
      data-testid="f376-source-selector-overlay"
      data-f376-source-pass-through="true"
    >
      <div
        className={`pointer-events-auto bg-white rounded-xl shadow-2xl border border-slate-200 ${maximized ? 'w-[calc(100vw-32px)] h-[calc(100vh-32px)]' : minimized ? 'fixed bottom-4 right-4 w-[360px]' : 'w-[500px] max-h-[85vh]'} flex flex-col overflow-hidden`}
        onClick={e => e.stopPropagation()}
        style={minimized ? undefined : shellStyle}
        data-testid="f376-source-selector-window"
        data-f376-source-minimized={minimized ? 'true' : 'false'}
        data-f376-source-maximized={maximized ? 'true' : 'false'}
      >
        <div
          className="flex cursor-move select-none items-center justify-between px-4 py-3 border-b border-slate-100"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          title="Arrastrar selector de fuentes"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-100"><Radiation className="w-5 h-5 text-orange-600" /></div>
            <div>
              <h3 className="flex items-center gap-1.5 font-semibold text-sm text-slate-800"><Move className="h-3.5 w-3.5 text-slate-400" />Fuente de Radiacion</h3>
              <p className="text-[10px] text-slate-400">18 fuentes reales — normativa aplicada automaticamente</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={() => setMinimized((value) => !value)}
              aria-label={minimized ? 'Restaurar selector de fuentes' : 'Minimizar selector de fuentes'}
              title={minimized ? 'Restaurar selector de fuentes' : 'Minimizar selector de fuentes'}
              data-testid="f376-source-selector-minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={() => {
                setMaximized((value) => !value);
                setMinimized(false);
              }}
              aria-label={maximized ? 'Restaurar tamano del selector de fuentes' : 'Expandir selector de fuentes'}
              title={maximized ? 'Restaurar tamano' : 'Expandir selector de fuentes'}
              data-testid="f376-source-selector-expand"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={onClose}
              aria-label="Cerrar selector de fuentes"
              title="Cerrar selector de fuentes"
              data-testid="f376-source-selector-close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {minimized && (
          <button
            className="px-4 py-2 text-left text-[11px] font-medium text-slate-600 hover:bg-orange-50"
            onClick={() => setMinimized(false)}
            data-testid="f376-source-selector-minimized"
          >
            Selector minimizado. Pulse para restaurar y continuar colocando fuentes.
          </button>
        )}
        {!minimized && <div className="px-4 py-2 border-b border-slate-100">
          <input type="text" placeholder="Buscar nombre, energia, normativa..." className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200" value={search} onChange={e => setSearch(e.target.value)} />
        </div>}
        {!minimized && <div className="px-3 py-2 border-b border-slate-100 flex gap-1 flex-wrap">
          <button className={`px-2 py-1 rounded-full text-[10px] font-medium ${activeCat === 'all' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setActiveCat('all')}>Todas ({CATALOG.length})</button>
          {cats.map(cat => { const c = CAT_CFG[cat]; return <button key={cat} className={`px-2 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 ${activeCat === cat ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => setActiveCat(cat)}>{c?.icon}{c?.label}</button>; })}
        </div>}
        {!minimized && <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {filtered.map(s => { const c = CAT_CFG[s.category]; const isExp = expanded === s.id; const isSel = selectedId === s.id; return (
            <div key={s.id} className={`rounded-lg border ${isSel ? 'border-orange-300 bg-orange-50' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2 px-3 py-2 cursor-pointer" onClick={() => setExpanded(isExp ? null : s.id)}>
                <div className={`p-1 rounded ${c?.color}`}>{c?.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5"><span className="text-xs font-medium text-slate-700">{s.name}</span>{isSel && <Check className="w-3 h-3 text-orange-500" />}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-400">{s.energy}</span>
                    <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${s.standard.startsWith('NCRP') ? 'bg-blue-50 text-blue-600' : s.standard.startsWith('AAPM') ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}>{s.standard}</span>
                  </div>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-300 transition-transform ${isExp ? 'rotate-90' : ''}`} />
              </div>
              {isExp && (
                <div className="px-3 pb-3 border-t border-slate-50 pt-2 space-y-2">
                  <p className="text-[11px] text-slate-600">{s.description}</p>
                  <div className="flex gap-1 flex-wrap">
                    {s.ncrp_report && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1"><BookOpen className="w-3 h-3" /> NCRP {s.ncrp_report}</span>}
                    {s.aapm_tg && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 flex items-center gap-1"><Activity className="w-3 h-3" /> AAPM {s.aapm_tg}</span>}
                    {s.iaea_ref && <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {s.iaea_ref}</span>}
                    {s.cnsns_ref && <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1"><Stethoscope className="w-3 h-3" /> {s.cnsns_ref}</span>}
                  </div>
                  <Button size="sm" className={`w-full text-xs h-7 ${isSel ? 'bg-orange-100 text-orange-700' : 'bg-orange-500 text-white'}`} onClick={() => onSelect(s)}>{isSel ? 'Seleccionado' : 'Seleccionar fuente'}</Button>
                </div>
              )}
            </div>
          ); })}
        </div>}
        {!minimized && <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 rounded-b-xl text-[9px] text-slate-400">Los calculos se ajustan automaticamente a la normativa correspondiente</div>}
      </div>
    </div>
  );
}

export { CATALOG };
