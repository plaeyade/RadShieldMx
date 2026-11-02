// v96: Radioactive Material Transport — Based on IAEA SSR-6
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Truck, Package, AlertTriangle, FileCheck,
  Radiation, Scale, BookOpen, Info,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const TRANSPORT_CATEGORIES = [
  {
    cat: "I-BLANCO", name: "Excepcion (I-Blanco)",
    description: "Dosis superficial < 5 uSv/h. Etiqueta EXCEPCION.",
    examples: ["Fuentes de calibracion debil", "Muestras de laboratorio (< A2)"],
    limit: "Tasa de dosis < 5 uSv/h a la superficie del envase",
    color: "bg-slate-100 text-slate-700 border-slate-300",
    risk: "Nulo"
  },
  {
    cat: "II-AMARILLO", name: "Tipo A / B(U) — Categoria II (Amarillo)",
    description: "Dosis superficial 5 uSv/h — 500 uSv/h. Etiqueta AMARILLA II.",
    examples: ["Generadores de Mo-99/Tc-99m", "Fuentes de Ir-192 para braquiterapia", "Fuentes de I-131 terapeutico"],
    limit: "Tasa de dosis: 5-500 uSv/h superficie. < 10 mSv/h a 1m.",
    color: "bg-yellow-50 text-yellow-800 border-yellow-400",
    risk: "Medio"
  },
  {
    cat: "III-AMARILLO", name: "Tipo B(U)/B(M) — Categoria III (Amarillo-III)",
    description: "Dosis superficial > 500 uSv/h o > 10 mSv/h a 1m. Etiqueta AMARILLA III.",
    examples: ["Fuentes de Co-60 para teleterapia", "Contenedores de Ir-192 de alta actividad", "Material irradiado (MTR/SNF)"],
    limit: "Tasa de dosis > 500 uSv/h superficie O > 10 mSv/h a 1m.",
    color: "bg-orange-50 text-orange-800 border-orange-500",
    risk: "Alto"
  },
];

const SSR6_REQUIREMENTS = [
  { id: "r1", title: "Envase resistente a la intemperie", mandatory: true, category: "embalaje" },
  { id: "r2", title: "Cierre de seguridad hermetico", mandatory: true, category: "embalaje" },
  { id: "r3", title: "Material absorbente (2x contenido liquido)", mandatory: true, category: "embalaje" },
  { id: "r4", title: "Blindaje suficiente (dosis < limites)", mandatory: true, category: "blindaje" },
  { id: "r5", title: "Etiqueta de categoria I/II/III", mandatory: true, category: "etiquetado" },
  { id: "r6", title: "Placa de identificacion UN numero", mandatory: true, category: "etiquetado" },
  { id: "r7", title: "Declaracion del expedidor", mandatory: true, category: "documentacion" },
  { id: "r8", title: "Instrucciones de manejo de emergencia", mandatory: true, category: "documentacion" },
  { id: "r9", title: "Certificado de diseno del envase", mandatory: false, category: "documentacion" },
  { id: "r10", title: "Seguro de responsabilidad civil", mandatory: true, category: "seguro" },
  { id: "r11", title: "Transportista autorizado por CNSNS", mandatory: true, category: "autorizacion" },
  { id: "r12", title: "Plan de emergencia radiologica", mandatory: true, category: "plan" },
];

const TIPIs = [
  { un: "UN2910", name: "Objetos radioactivos limitados", a1: "0.001-0.1", a2: "0.001-0.1" },
  { un: "UN2915", name: "Materiales radioactivos, Tipo A", a1: "40-4000", a2: "0.4-40" },
  { un: "UN2916", name: "Materiales radioactivos, Tipo B(U)", a1: "Ilimitado", a2: "Ilimitado" },
  { un: "UN2917", name: "Materiales radioactivos, Tipo B(M)", a1: "Ilimitado", a2: "Ilimitado" },
  { un: "UN3321", name: "Materiales radioactivos, Tipo C", a1: "Ilimitado", a2: "Ilimitado" },
  { un: "UN3322", name: "Material irradiado (MTR)", a1: "N/A", a2: "N/A" },
  { un: "UN3323", name: "Material irradiado (SNF)", a1: "N/A", a2: "N/A" },
  { un: "UN3332", name: "Materiales radioactivos, Tipo A especial", a1: "40-4000", a2: "0.4-40" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function RadioactiveTransportDialog({ open, onOpenChange }: Props) {
  const [activeTab, setActiveTab] = useState("categories");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => setChecked(p => ({ ...p, [id]: !p[id] }));
  const completed = Object.values(checked).filter(Boolean).length;
  const total = SSR6_REQUIREMENTS.length;
  const pct = Math.round((completed / total) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-500" />
            Transporte de Material Radiactivo
            <Badge variant="outline" className="text-[9px]">IAEA SSR-6 Rev.1</Badge>
          </DialogTitle>
          <p className="text-xs text-slate-400">Reglamento para el Transporte Seguro de Materiales Radiactivos (OIEA, 2018)</p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="categories" className="text-[10px]"><AlertTriangle className="w-3 h-3 mr-0.5" />Categorias</TabsTrigger>
            <TabsTrigger value="requirements" className="text-[10px]"><FileCheck className="w-3 h-3 mr-0.5" />Requisitos</TabsTrigger>
            <TabsTrigger value="un" className="text-[10px]"><Package className="w-3 h-3 mr-0.5" />UN/TIPI</TabsTrigger>
            <TabsTrigger value="calculator" className="text-[10px]"><Scale className="w-3 h-3 mr-0.5" />Calculadora</TabsTrigger>
            <TabsTrigger value="references" className="text-[10px]"><BookOpen className="w-3 h-3 mr-0.5" />Referencias</TabsTrigger>
          </TabsList>

          {/* Categorias */}
          <TabsContent value="categories" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-2">
                {TRANSPORT_CATEGORIES.map(cat => (
                  <div key={cat.cat} className={`p-3 rounded-lg border ${cat.color}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Radiation className="w-4 h-4" />
                      <span className="text-sm font-semibold">{cat.cat}</span>
                      <Badge variant="outline" className="text-[9px]">Riesgo: {cat.risk}</Badge>
                    </div>
                    <p className="text-xs">{cat.description}</p>
                    <p className="text-[10px] mt-1 font-medium">Ejemplos:</p>
                    <ul className="text-[10px] list-disc list-inside">
                      {cat.examples.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                    <p className="text-[10px] mt-1 text-slate-500">{cat.limit}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Requisitos SSR-6 */}
          <TabsContent value="requirements" className="flex-1 min-h-0 mt-2">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Progress value={pct} />
                <span className="text-[10px] text-slate-500">{completed}/{total} ({pct}%)</span>
              </div>
            </div>
            <ScrollArea className="h-[360px]">
              <div className="space-y-1 pr-2">
                {SSR6_REQUIREMENTS.map(req => (
                  <label key={req.id} className="flex items-start gap-2 p-2 rounded border hover:bg-slate-50 cursor-pointer transition-colors">
                    <input type="checkbox" checked={!!checked[req.id]} onChange={() => toggleCheck(req.id)} className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium">{req.title}</span>
                        {req.mandatory && <Badge className="bg-red-500 text-[8px] px-1">Obligatorio</Badge>}
                      </div>
                      <span className="text-[9px] text-slate-400">{req.category}</span>
                    </div>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* UN Numbers / TIPI */}
          <TabsContent value="un" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 gap-1 pr-2">
                {TIPIs.map(tipi => (
                  <div key={tipi.un} className="flex items-center gap-2 p-2 rounded border hover:bg-slate-50">
                    <Package className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-blue-600 text-[9px]">{tipi.un}</Badge>
                        <span className="text-xs font-medium">{tipi.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex gap-2">
                        <span>A1: {tipi.a1} TBq</span>
                        <span>A2: {tipi.a2} TBq</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Dose calculator */}
          <TabsContent value="calculator" className="flex-1 min-h-0 mt-2">
            <TransportDoseCalculator />
          </TabsContent>

          {/* References */}
          <TabsContent value="references" className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-2 text-xs">
                <p className="font-semibold text-slate-700">Normativa aplicable en Mexico:</p>
                <ul className="space-y-1 list-disc list-inside text-slate-600">
                  <li><strong>LAERA</strong> — Ley de Energia Atomica, Radiacion y Materiales Nucleares</li>
                  <li><strong>RETECO</strong> — Reglamento de Transporte de Energeticos y Combustibles (Secretaria de Energia)</li>
                  <li><strong>Norma Oficial Mexicana NOM-013-NUCL-2013</strong> — Transporte de materiales y residuos radioactivos</li>
                  <li><strong>Lineamientos CNSNS-L-010-2015</strong> — Autorizacion de transporte de material radiactivo</li>
                  <li><strong>IAEA SSR-6 Rev.1 (2018)</strong> — Reglamento para el Transporte Seguro de Materiales Radiactivos</li>
                  <li><strong>IAEA SSG-26 Rev.1 (2018)</strong> — Advisory Material for the IAEA Regulations for the Safe Transport of Radioactive Material</li>
                  <li><strong>ICAO TI 2023-2024</strong> — Technical Instructions for the Safe Transport of Dangerous Goods by Air</li>
                  <li><strong>IMDG Code 40-20</strong> — International Maritime Dangerous Goods Code</li>
                  <li><strong>ADR 2023</strong> — European Agreement concerning the International Carriage of Dangerous Goods by Road</li>
                </ul>
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-[10px] text-blue-800">
                  <Info className="w-3 h-3 inline mr-1" />
                  La Secretaria de Energia (SENER) y la CNSNS son las autoridades reguladoras del transporte de material radiactivo en Mexico.
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dose Calculator ───
function TransportDoseCalculator() {
  const [activity, setActivity] = useState("100");
  const [distance, setDistance] = useState("1");
  const [gammaConstant, setGammaConstant] = useState("0.13"); // Co-60 default
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const A = parseFloat(activity) || 0; // GBq
    const d = parseFloat(distance) || 1; // m
    const Gamma = parseFloat(gammaConstant) || 0.13; // uSv m2 / GBq h
    const dose = (A * Gamma) / (d * d);
    setResult(dose);
  };

  const nuclides = [
    { name: "Co-60", gamma: "0.13", type: "Terapia" },
    { name: "Ir-192", gamma: "0.13", type: "Braqui" },
    { name: "Cs-137", gamma: "0.077", type: "Terapia" },
    { name: "I-131", gamma: "0.059", type: "Nuclear" },
    { name: "Tc-99m", gamma: "0.019", type: "Diagnostico" },
    { name: "F-18", gamma: "0.14", type: "PET" },
    { name: "Mo-99", gamma: "0.084", type: "Generador" },
    { name: "Ra-226", gamma: "0.19", type: "Legacy" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-slate-500">Actividad (GBq)</label>
          <Input value={activity} onChange={e => setActivity(e.target.value)} className="h-8 text-xs" type="number" />
        </div>
        <div>
          <label className="text-[10px] text-slate-500">Distancia (m)</label>
          <Input value={distance} onChange={e => setDistance(e.target.value)} className="h-8 text-xs" type="number" />
        </div>
        <div>
          <label className="text-[10px] text-slate-500">Constante Gamma</label>
          <Input value={gammaConstant} onChange={e => setGammaConstant(e.target.value)} className="h-8 text-xs" type="number" step="0.001" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {nuclides.map(n => (
          <Button key={n.name} size="sm" variant="outline" className="h-6 text-[9px] px-2" onClick={() => { setGammaConstant(n.gamma); toast.success(`${n.name} seleccionado (${n.type})`); }}>
            {n.name}
          </Button>
        ))}
      </div>
      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 w-full" onClick={calculate}>
        <Scale className="w-3.5 h-3.5 mr-1" /> Calcular Dosis
      </Button>
      {result !== null && (
        <div className={`p-2 rounded-lg text-center ${result < 2 ? 'bg-green-50 border border-green-200' : result < 10 ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
          <p className="text-lg font-bold">{result.toFixed(2)} uSv/h</p>
          <p className="text-[10px]">{result < 2 ? 'Aceptable (Cat. I)' : result < 10 ? 'Cat. II-Amarillo' : 'Cat. III-Amarillo (Alto riesgo)'}</p>
        </div>
      )}
      <p className="text-[9px] text-slate-400">{'Formula: D = (A x \u0393) / d\u00b2 | Limites: Cat.I <2 uSv/h | Cat.II 2-10 uSv/h | Cat.III >10 uSv/h'}</p>
    </div>
  );
}
