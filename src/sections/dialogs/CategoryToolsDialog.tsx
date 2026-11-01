/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v34 — Category Tools Dialog
 *  DX/TX/NM/CY quick-access panel with category-specific tools, calculators,
 *  equipment data, and regulatory references.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import 'sonner';
import {
  Stethoscope, Zap, Activity, Radio, Microscope,
  ChevronRight, BookOpen, FileText,
  Radiation, Scan, ScanLine, Sparkles, FlaskConical, Hexagon,
  AlertTriangle, Info, Box, Atom, Server, Crosshair
} from 'lucide-react';

type Category = 'diagnostic' | 'therapy' | 'nuclear' | 'cyclotron';

interface CategoryDef {
  id: Category;
  label: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: any;
}

const CATEGORIES: CategoryDef[] = [
  { id: 'diagnostic', label: 'DX — Diagnostico', subtitle: 'Radiologia, CT, Fluoroscopia, Mamografia', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: Radiation },
  { id: 'therapy', label: 'TX — Terapia', subtitle: 'LINAC, Gamma Knife, Braquiterapia, Protones', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', icon: Zap },
  { id: 'nuclear', label: 'NM — Medicina Nuclear', subtitle: 'PET/CT, SPECT, Terapia Radionucleida', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', icon: Radio },
  { id: 'cyclotron', label: 'CY — Ciclotron', subtitle: 'Produccion FDG, Blindaje Neutronico', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', icon: Atom },
];

interface ToolItem {
  name: string;
  desc: string;
  icon: any;
  action: string;
  normativa: string;
  ncrpTable?: string;
}

const TOOLS: Record<Category, ToolItem[]> = {
  diagnostic: [
    { name: 'CT Shielding (NCRP 147)', desc: 'Blindaje para CT scanner — isodose, workload, dosis en puerta', icon: Scan, action: 'shieldingCalculator', normativa: 'NCRP 147, Sec. 4.2', ncrpTable: 'Tabla 4.3' },
    { name: 'Radiografia General (RX)', desc: 'Blindaje para salas de radiografia — barrera primaria/secundaria', icon: Radiation, action: 'shieldingCalculator', normativa: 'NCRP 147, Sec. 4.1', ncrpTable: 'Tabla A.1' },
    { name: 'Mamografia Shielding', desc: 'Blindaje para unidad de mamografia — dosis glandular, HVL Mo/Mo-Rh', icon: Activity, action: 'shieldingCalculator', normativa: 'NCRP 147, Sec. 4.5', ncrpTable: 'Tabla A.3' },
    { name: 'Fluoroscopia / Angiografia', desc: 'Blindaje para C-arm, angio — workload alto, barra de tierra', icon: ScanLine, action: 'shieldingCalculator', normativa: 'NCRP 147, Sec. 4.3', ncrpTable: 'Tabla 4.7' },
    { name: 'Dental X-ray', desc: 'Blindaje para radiografia dental intraoral/panoramica', icon: Stethoscope, action: 'shieldingCalculator', normativa: 'NCRP 145', ncrpTable: '—' },
    { name: 'Bone Densitometry (DEXA)', desc: 'Blindaje DEXA — dosis muy baja, requisitos minimos', icon: Activity, action: 'shieldingCalculator', normativa: 'NCRP 145', ncrpTable: '—' },
    { name: 'CBCT Shielding', desc: 'Blindaje para CBCT kV — dosis por volumen, scatter', icon: Box, action: 'cbctigrt', normativa: 'AAPM TG 108', ncrpTable: '—' },
    { name: 'Interventional Radiology', desc: 'Blindaje para sala de hemodinamica — workload prolongado', icon: Scan, action: 'shieldingCalculator', normativa: 'NCRP 168', ncrpTable: 'Tabla 3.1' },
  ],
  therapy: [
    { name: 'LINAC 6 MV Blindaje', desc: 'Blindaje primario/secundario para LINAC 6 MV — NCRP 151', icon: Zap, action: 'shieldingCalculator', normativa: 'NCRP 151, Sec. 4.1.1', ncrpTable: 'Tabla B.1-B.4' },
    { name: 'LINAC 15-25 MV Blindaje', desc: 'Blindaje para alta energia — neutrones (p,2n), contaminacion', icon: Zap, action: 'shieldingCalculator', normativa: 'NCRP 151, Sec. 4.1.1, 5.1', ncrpTable: 'Tabla B.5' },
    { name: 'Gamma Knife', desc: 'Blindaje para unidad Co-60 — 192 fuentes, helmet', icon: Sparkles, action: 'gammaKnife', normativa: 'NCRP 151, Sec. 4.1.2.1', ncrpTable: 'Tabla 4.1' },
    { name: 'CyberKnife', desc: 'Blindaje para CK M6 — FFF, robot arm, dosis SRS/SBRT', icon: Crosshair, action: 'shieldingCalculator', normativa: 'NCRP 151, Sec. 4.1.2.2', ncrpTable: '—' },
    { name: 'TomoTherapy / Radixact', desc: 'Blindaje helical delivery — MVCT, jawless', icon: Scan, action: 'shieldingCalculator', normativa: 'NCRP 151, Sec. 4.1.2.3', ncrpTable: '—' },
    { name: 'HDR Brachytherapy', desc: 'Blindaje Co-60/Ir-192 HDR — carga remota, laberinto', icon: Hexagon, action: 'braquiCo60', normativa: 'NCRP 151, Sec. 4.1.4', ncrpTable: 'Tabla 4.4' },
    { name: 'Proton Therapy', desc: 'Blindaje protones 70-250 MeV — neutrones secundarios', icon: Atom, action: 'shieldingCalculator', normativa: 'NCRP 151, Sec. 4.1.3', ncrpTable: 'Tabla B.7' },
    { name: 'BNCT', desc: 'Boron Neutron Capture Therapy — blindaje neutronico especializado', icon: FlaskConical, action: 'neutronShielding', normativa: 'IAEA-TECDOC-1223', ncrpTable: '—' },
    { name: 'MR-Linac Shielding', desc: 'Blindaje RF + 7 MV — jaula de Faraday, RF door', icon: Microscope, action: 'shieldingCalculator', normativa: 'AAPM TG 309', ncrpTable: '—' },
    { name: 'Electron Applicator', desc: 'Blindaje aplicadores electrones — NCRP 151 Appendix B', icon: Zap, action: 'electronApplicator', normativa: 'NCRP 151, App. B', ncrpTable: 'Tabla B.6' },
  ],
  nuclear: [
    { name: 'PET/CT FDG Shielding', desc: 'Blindaje PET/CT con F-18 — 511 keV, inject, scan, uptake', icon: Scan, action: 'shieldingCalculator', normativa: 'NCRP 147, Sec. 5.2', ncrpTable: 'Tabla 5.2' },
    { name: 'SPECT Shielding (Tc-99m)', desc: 'Blindaje SPECT — 140 keV, LEHR collimator', icon: Activity, action: 'shieldingCalculator', normativa: 'NCRP 147, Sec. 5.1', ncrpTable: 'Tabla 5.1' },
    { name: 'SPECT I-131', desc: 'Blindaje SPECT I-131 — 364 keV, dosis terapeutica', icon: Activity, action: 'shieldingCalculator', normativa: 'NCRP 147, Sec. 5.1.2', ncrpTable: 'Tabla 5.3' },
    { name: 'I-131 Therapy Ward', desc: 'Blindaje sala terapia tiroidea I-131 — paciente hospitalizado', icon: Stethoscope, action: 'shieldingCalculator', normativa: 'NCRP 155', ncrpTable: 'Tabla 4.1' },
    { name: 'Y-90 SIRT', desc: 'Selective Internal Radiation Therapy — microesferas resin/glass', icon: FlaskConical, action: 'shieldingCalculator', normativa: 'AAPM TG 144', ncrpTable: '—' },
    { name: 'Lu-177 DOTATATE', desc: 'PRRT con Lu-177 — 208 keV gamma, terapia ambulatoria', icon: FlaskConical, action: 'shieldingCalculator', normativa: 'IAEA SSG-46', ncrpTable: '—' },
    { name: 'Radioiodine Contamination', desc: 'Control de contaminacion I-131 — survey, wipe test', icon: AlertTriangle, action: 'nuclearMedicine', normativa: 'CNSNS LA-004/01', ncrpTable: '—' },
    { name: 'PET Hot Lab', desc: 'Laboratorio caliente FDG — sintesis, QC, dispensacion', icon: FlaskConical, action: 'shieldingCalculator', normativa: 'NCRP 147, Sec. 5.3', ncrpTable: 'Tabla 5.5' },
    { name: 'Waste Storage', desc: 'Almacenamiento desechos radiactivos — decaimiento, entierro', icon: Server, action: 'batemanDecay', normativa: 'CNSNS LA-005/01', ncrpTable: '—' },
    { name: 'Patient Release', desc: 'Criterios de alta de paciente terapia I-131/Lu-177', icon: BookOpen, action: 'nuclearMedicine', normativa: 'NCRP 155, Sec. 5.2', ncrpTable: 'Tabla 5.1' },
  ],
  cyclotron: [
    { name: 'IBA KIUBE 18 MeV', desc: 'Ciclotron 18 MeV protones — produccion FDG, blindaje neutronico', icon: Zap, action: 'cycloneKIUBE', normativa: 'NCRP 144, Sec. 4.2', ncrpTable: 'Tabla 4.2' },
    { name: 'GE PETtrace 16.5 MeV', desc: 'PETtrace — blindaje bunker, targetry, beam stop', icon: Zap, action: 'cycloneKIUBE', normativa: 'NCRP 144, Sec. 4.2', ncrpTable: 'Tabla 4.2' },
    { name: 'IBA Cyclone 30 MeV', desc: 'Alta energia — multiples radionucleidos (N-13, O-15, C-11, F-18)', icon: Zap, action: 'cycloneKIUBE', normativa: 'NCRP 144, Sec. 4.3', ncrpTable: '—' },
    { name: 'Neutron Shield Calculator', desc: 'Calculadora blindaje neutronico — removal XS, TVLa', icon: Atom, action: 'neutronShielding', normativa: 'NCRP 144, Sec. 5.1', ncrpTable: 'Tabla 5.1' },
    { name: 'MCNP Cyclotron Input', desc: 'Generar input MCNP6 para ciclotron — neutrones, prompt gamma', icon: FileText, action: 'mcnpCyclotron', normativa: 'MCNP6 User Manual', ncrpTable: '—' },
    { name: 'FDG Production Shielding', desc: 'Blindaje linea sintesis FDG — celdas calientes, transporte', icon: FlaskConical, action: 'shieldingCalculator', normativa: 'NCRP 144, Sec. 6.2', ncrpTable: 'Tabla 6.1' },
    { name: 'Targetry Design', desc: 'Diseno de blanco O-18 — refrigeracion, erosion, yield', icon: Crosshair, action: 'cycloneKIUBE', normativa: 'IAEA-TECDOC-1343', ncrpTable: '—' },
    { name: 'GMP Facility Layout', desc: 'Layout instalacion GMP — flujo aseptico, grados de limpieza', icon: Box, action: 'layoutBunker', normativa: 'EU GMP Annex 1', ncrpTable: '—' },
    { name: 'Ventilation (ACH)', desc: 'Ventilacion bunker ciclotron — cambios aire/hora, filtracion', icon: ScanLine, action: 'ventilation', normativa: 'NCRP 144, Sec. 6.3', ncrpTable: '—' },
    { name: 'Skyshine Calculator', desc: 'Radiacion dispersada techo - neutrones y gamma', icon: AlertTriangle, action: 'neutronShielding', normativa: 'NCRP 151, Sec. 4.2.3', ncrpTable: '—' },
  ],
};

interface CategoryToolsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialCategory?: Category;
  onOpenTool: (toolAction: string) => void;
}

export default function CategoryToolsDialog({ open, onOpenChange, initialCategory = 'diagnostic', onOpenTool }: CategoryToolsDialogProps) {
  const [activeCat, setActiveCat] = useState<Category>(initialCategory);

  const cat = CATEGORIES.find(c => c.id === activeCat)!;

  const handleToolClick = (tool: ToolItem) => {
    onOpenChange(false);
    setTimeout(() => {
      onOpenTool(tool.action);
    }, 150);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-5 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <cat.icon className={`w-5 h-5 ${cat.color}`} />
            <span className={cat.color}>{cat.label}</span>
            <span className="text-slate-400 font-normal text-sm">— {cat.subtitle}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Category selector pills */}
        <div className="px-5 pt-3 pb-1 shrink-0 flex gap-1.5">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-semibold border transition-all ${
                activeCat === c.id
                  ? `${c.bgColor} ${c.borderColor} ${c.color} shadow-sm`
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <c.icon className="w-3 h-3" />
              {c.label.split(' — ')[0]}
            </button>
          ))}
        </div>

        <ScrollArea className="flex-1 overflow-auto px-5 py-3">
          {/* Summary stats */}
          <div className={`${cat.bgColor} ${cat.borderColor} border rounded-lg p-3 mb-3`}>
            <div className="flex items-center gap-2 text-[11px]">
              <Info className={`w-3.5 h-3.5 ${cat.color}`} />
              <span className={`font-semibold ${cat.color}`}>{TOOLS[activeCat].length} herramientas disponibles</span>
              <span className="text-slate-500">— Seleccione una herramienta para abrir el modulo correspondiente</span>
            </div>
          </div>

          {/* Tools grid */}
          <div className="grid grid-cols-1 gap-1.5">
            {TOOLS[activeCat].map((tool, i) => (
              <button
                key={i}
                onClick={() => handleToolClick(tool)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all hover:shadow-sm group ${cat.bgColor} ${cat.borderColor} border hover:brightness-95`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cat.bgColor} ${cat.borderColor} border`}>
                  <tool.icon className={`w-4 h-4 ${cat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold ${cat.color}`}>{tool.name}</span>
                    <Badge variant="outline" className="text-[7px] h-3.5 px-1">{tool.normativa}</Badge>
                    {tool.ncrpTable && tool.ncrpTable !== '—' && (
                      <Badge className={`text-[7px] h-3.5 px-1 ${cat.bgColor} ${cat.color} border-0`}>{tool.ncrpTable}</Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{tool.desc}</div>
                </div>
                <ChevronRight className={`w-4 h-4 ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </button>
            ))}
          </div>

          <Separator className="my-3" />

          {/* Quick refs */}
          <div className="text-[10px] text-slate-500 space-y-1 pb-2">
            <div className="font-semibold text-slate-600 text-[11px]">Referencias normativas aplicables:</div>
            {activeCat === 'diagnostic' && (
              <ul className="ml-3 list-disc space-y-0.5">
                <li>NCRP Report 147 — Structural Shielding Design for Medical X-Ray Imaging Facilities</li>
                <li>NCRP Report 145 — Radiation Protection in Dental Radiology</li>
                <li>NCRP Report 168 — Radiation Dose Management for Fluoroscopically-Guided Procedures</li>
                <li>ICRP Publication 135 — Diagnostic Reference Levels in Medical Imaging</li>
              </ul>
            )}
            {activeCat === 'therapy' && (
              <ul className="ml-3 list-disc space-y-0.5">
                <li>NCRP Report 151 — Structural Shielding Design for Megavoltage X- and Gamma-Ray Radiotherapy Facilities</li>
                <li>NCRP Report 144 — Radiation Protection for Particle Accelerator Facilities</li>
                <li>AAPM TG 108 — Guidance for Shielding of Medical Linear Accelerators</li>
                <li>IEC 60601-2-1 — Medical Electrical Equipment: Safety of Electron Accelerators</li>
              </ul>
            )}
            {activeCat === 'nuclear' && (
              <ul className="ml-3 list-disc space-y-0.5">
                <li>NCRP Report 147 — Structural Shielding Design (PET/CT, SPECT)</li>
                <li>NCRP Report 155 — Management of Radionuclide Therapy Patients</li>
                <li>IAEA Safety Standards SSR-6 — Regulations for the Safe Transport of Radioactive Material</li>
                <li>ICRP Publication 140 — Radiological Protection in Therapy with Radiopharmaceuticals</li>
              </ul>
            )}
            {activeCat === 'cyclotron' && (
              <ul className="ml-3 list-disc space-y-0.5">
                <li>NCRP Report 144 — Radiation Protection for Particle Accelerator Facilities</li>
                <li>NCRP Report 51 — Radiation Protection Design Guidelines for 0.1-100 MeV</li>
                <li>IAEA SSG-17 — Radiation Safety in Radiopharmaceutical Production Facilities</li>
                <li>ANSI/HPS N43.1 — Radiological Safety in Design and Operation of Particle Accelerators</li>
              </ul>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
