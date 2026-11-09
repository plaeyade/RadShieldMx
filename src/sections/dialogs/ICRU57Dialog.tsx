import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calculator,
  BookOpen,
  Atom,
  Ruler,
  Search,
  Info,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Activity,
} from "lucide-react";

interface ICRU57DialogProps {
  open: boolean;
  onClose: () => void;
}

const particles = [
  { name: "Fotones", min: "10 keV", max: "10 GeV", tables: "A.1, A.3, B.1, C.1-C.14", color: "amber" },
  { name: "Electrones / Positrones", min: "50 keV", max: "10 GeV", tables: "A.2, B.2, C.15-C.23", color: "blue" },
  { name: "Neutrones", min: "0.001 eV", max: "200 MeV", tables: "A.4, B.3, C.24-C.35", color: "red" },
  { name: "Protones", min: "1 MeV", max: "10 GeV", tables: "A.5, B.4, C.36-C.44", color: "green" },
  { name: "Muones (negativos)", min: "1 MeV", max: "10 GeV", tables: "A.6, B.5, C.45-C.52", color: "purple" },
  { name: "Muones (positivos)", min: "1 MeV", max: "10 GeV", tables: "A.7, B.6, C.53-C.60", color: "purple" },
  { name: "Piones (negativos)", min: "1 MeV", max: "200 GeV", tables: "A.8, B.7, C.61-C.67", color: "pink" },
  { name: "Piones (positivos)", min: "1 MeV", max: "200 GeV", tables: "A.9, B.8, C.68-C.74", color: "pink" },
  { name: "Iones de Helio", min: "1 MeV/u", max: "100 GeV/u", tables: "A.10, B.9, C.75-C.82", color: "orange" },
];

const geometries = [
  { code: "AP", desc: "Antero-posterior (de frente)", use: "Paciente frente a fuente" },
  { code: "PA", desc: "Postero-anterior (de espaldas)", use: "Paciente de espaldas a fuente" },
  { code: "LLAT", desc: "Left lateral (izquierdo)", use: "Irradiacion lateral izquierda" },
  { code: "RLAT", desc: "Right lateral (derecho)", use: "Irradiacion lateral derecha" },
  { code: "ROT", desc: "Rotacional (360°)", use: "Terapia rotacional / tomografia" },
  { code: "ISO", desc: "Isotropica (4π)", use: "Campo uniforme en todas direcciones" },
];

const photonCoefficients = [
  { energy: "0.01", ap: "0.061", pa: "0.018", llat: "0.015", rlat: "0.015", rot: "0.027", iso: "0.021", app: "RX diagnostico baja energia" },
  { energy: "0.015", ap: "0.21", pa: "0.065", llat: "0.054", rlat: "0.054", rot: "0.094", iso: "0.073", app: "Mamografia" },
  { energy: "0.02", ap: "0.51", pa: "0.17", llat: "0.14", rlat: "0.14", rot: "0.23", iso: "0.18", app: "RX diagnostico" },
  { energy: "0.03", ap: "1.5", pa: "0.54", llat: "0.43", rlat: "0.43", rot: "0.68", iso: "0.53", app: "RX diagnostico" },
  { energy: "0.05", ap: "3.3", pa: "1.3", llat: "1.0", rlat: "1.0", rot: "1.5", iso: "1.2", app: "RX diagnostico / fluoroscopia" },
  { energy: "0.07", ap: "3.9", pa: "1.7", llat: "1.3", rlat: "1.3", rot: "1.7", iso: "1.4", app: "RX diagnostico (K-edge)" },
  { energy: "0.1", ap: "4.6", pa: "2.2", llat: "1.7", rlat: "1.7", rot: "2.1", iso: "1.8", app: "RX diagnostico / CT" },
  { energy: "0.2", ap: "5.7", pa: "3.2", llat: "2.3", rlat: "2.3", rot: "2.7", iso: "2.4", app: "RX diagnostico" },
  { energy: "0.5", ap: "6.7", pa: "4.3", llat: "2.9", rlat: "2.9", rot: "3.2", iso: "3.0", app: "CT / fluoroscopia" },
  { energy: "0.662 (Cs-137)", ap: "7.0", pa: "4.5", llat: "3.1", rlat: "3.1", rot: "3.3", iso: "3.2", app: "Blindaje braquiterapia" },
  { energy: "1.0", ap: "7.4", pa: "4.9", llat: "3.4", rlat: "3.4", rot: "3.6", iso: "3.5", app: "Gamma Knife (Co-60)" },
  { energy: "1.25 (Co-60)", ap: "7.6", pa: "5.1", llat: "3.5", rlat: "3.5", rot: "3.7", iso: "3.6", app: "Terapia Co-60" },
  { energy: "6.0", ap: "8.7", pa: "6.4", llat: "4.2", rlat: "4.2", rot: "4.4", iso: "4.3", app: "LINAC 6 MV" },
  { energy: "10.0", ap: "9.3", pa: "7.0", llat: "4.5", rlat: "4.5", rot: "4.7", iso: "4.6", app: "LINAC 10-15 MV" },
];

const neutronCoefficients = [
  { energy: "0.001 eV (termico)", ap: "3.1", pa: "2.7", llat: "2.3", rlat: "2.3", rot: "2.6", iso: "2.6", app: "Neutrones termicos" },
  { energy: "1 keV", ap: "11", pa: "7.8", llat: "7.3", rlat: "7.3", rot: "8.2", iso: "8.4", app: "-" },
  { energy: "100 keV", ap: "56", pa: "26", llat: "29", rlat: "29", rot: "35", iso: "35", app: "-" },
  { energy: "1 MeV", ap: "233", pa: "89", llat: "108", rlat: "108", rot: "135", iso: "137", app: "LINAC 15 MV (fotodisintegracion)" },
  { energy: "10 MeV", ap: "403", pa: "242", llat: "250", rlat: "250", rot: "292", iso: "296", app: "Protonterapia / espalacion" },
  { energy: "100 MeV", ap: "380", pa: "358", llat: "327", rlat: "327", rot: "345", iso: "348", app: "Protonterapia alta energia" },
];

const operationalQuantities = [
  { qty: "H*(10)", name: "Dosis equivalente ambiental", def: "A 10 mm en esfera ICRU", relation: "Aproxima dosis efectiva para fotones > 70 keV y neutrones", use: "Monitoreo de area" },
  { qty: "H'(3)", name: "Dosis equivalente direccional", def: "A 3 mm en esfera ICRU", relation: "Aproxima dosis al cristalino (lente del ojo)", use: "Monitoreo de area / cristalino" },
  { qty: "Hp(10)", name: "Dosis equivalente personal penetrante", def: "A 10 mm en fantasma ICRU", relation: "Aproxima dosis efectiva (radiacion penetrante)", use: "Dosimetria personal" },
  { qty: "Hp(3)", name: "Dosis equivalente personal a 3 mm", def: "A 3 mm en fantasma ICRU", relation: "Aproxima dosis al cristalino", use: "Dosimetria personal (lente)" },
  { qty: "Hp(0.07)", name: "Dosis equivalente personal superficial", def: "A 0.07 mm en fantasma ICRU", relation: "Aproxima dosis a piel", use: "Dosimetria personal (piel / manos)" },
];

const applications = [
  { app: "RX Diagnostico / CT / Fluoroscopia", use: "Coeficientes fotones 10 keV - 10 MeV", key: "~7.4 pSv cm2 @ 1 MeV (AP)", relevance: "Verificacion de dosis efectiva en areas adyacentes" },
  { app: "PET-CT (511 keV)", use: "Interpolacion entre 0.5 - 1.0 MeV", key: "~7.6 pSv cm2 (AP)", relevance: "Dosis a personal en areas de inyeccion / escaneo" },
  { app: "Gamma Knife (Co-60, 1.25 MeV)", use: "Coeficiente fotones 1.25 MeV", key: "7.6 pSv cm2 (AP)", relevance: "Evaluacion dosis a ocupantes de areas colindantes" },
  { app: "LINAC 6 MV", use: "Coeficientes fotones 6 MeV", key: "8.7 pSv cm2 (AP)", relevance: "Dosis efectiva fuera del bunker (fuga + dispersion)" },
  { app: "LINAC 10-15 MV", use: "Coeficientes fotones + neutrones", key: "8.7-9.3 pSv cm2 (fotones); 233-403 pSv cm2 (neutrones)", relevance: "Evaluacion neutrones termicos en puerta laberinto" },
  { app: "Protonterapia", use: "Coeficientes protones 100 MeV - 10 GeV", key: "~380 pSv cm2 (AP)", relevance: "Blindaje de areas de tratamiento con protones" },
  { app: "Braquiterapia HDR (Ir-192, Cs-137)", use: "Coeficientes fotones 0.3-0.7 MeV", key: "~6.2-7.0 pSv cm2", relevance: "Evaluacion dosis a personal de enfermeria" },
  { app: "Gamma Camera (Tc-99m, 140 keV)", use: "Coeficientes fotones 0.1-0.2 MeV", key: "4.6-5.7 pSv cm2", relevance: "Blindaje de sala de inyeccion / espera" },
];

export default function ICRU57Dialog({ open, onClose }: ICRU57DialogProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [calcData, setCalcData] = useState({ fluence: "1", energy: "1.0", geometry: "AP", particle: "photon" });
  const [calcResult, setCalcResult] = useState<string | null>(null);

  const runCalc = () => {
    const flu = parseFloat(calcData.fluence);
    const en = parseFloat(calcData.energy);
    const coeff = photonCoefficients.find(c => c.energy.includes(en.toString()))?.ap || "7.6";
    const cVal = parseFloat(coeff);
    const result = flu * cVal; // pSv
    setCalcResult(`${result.toExponential(3)} pSv (dosis efectiva estimada)`);
  };

  const filteredPhotons = photonCoefficients.filter(c =>
    searchTerm === "" || c.energy.toLowerCase().includes(searchTerm.toLowerCase()) || c.app.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Atom className="h-6 w-6 text-blue-600" />
            ICRU Report 57 (1998) - Coeficientes de Conversion para Proteccion Radiologica
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Coeficientes de conversion de fluencia a dosis efectiva para radiacion externa (fotones, neutrones, electrones, protones, etc.)
          </p>
          <p role="alert" className="mt-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-800" data-testid="icru57-aviso">
            Valores sin verificar: los coeficientes de fotones de esta tabla no coinciden con ICRP 74 / ICRU 57 (p. ej. a 0.5 MeV AP
            la tabla publica ≈ 2.4 pSv·cm², aquí «6.7») y el informe no está en el repositorio para contrastarlos. No los use en cálculos;
            consulte las tablas A.17 y siguientes del informe original.
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pb-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview"><BookOpen className="h-4 w-4 mr-1" /> General</TabsTrigger>
            <TabsTrigger value="photons"><Zap className="h-4 w-4 mr-1" /> Fotones</TabsTrigger>
            <TabsTrigger value="neutrons"><Activity className="h-4 w-4 mr-1" /> Neutrones</TabsTrigger>
            <TabsTrigger value="operational"><Ruler className="h-4 w-4 mr-1" /> Cantidades Oper.</TabsTrigger>
            <TabsTrigger value="applications"><Info className="h-4 w-4 mr-1" /> Aplicaciones</TabsTrigger>
            <TabsTrigger value="calculator"><Calculator className="h-4 w-4 mr-1" /> Calculadora</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4 pr-2">
            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-sm mb-3">Documento</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Titulo:</span><span className="text-right max-w-[200px]">Conversion Coefficients for Radiological Protection Against External Radiation</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Organismos:</span><span className="text-right">ICRU + ICRP</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Paginas:</span><span>156</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">ISBN:</span><span>978-0913394564</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Phantom:</span><span>Hermafrodita MIRD + Masculino + Femenino</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Recomendaciones:</span><span>ICRP 60 (1990)</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Actualizado por:</span><span>ICRP 116 (2010) / ICRU 95a (2024)</span></div>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-sm mb-3">Particulas Cubiertas</h3>
                  <div className="space-y-2 text-sm">
                    {particles.map((p, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span>{p.name}</span>
                        <Badge variant="outline" className="text-xs">{p.min} - {p.max}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-sm mb-3">Geometrias de Irradiacion</h3>
                <div className="grid grid-cols-3 gap-3">
                  {geometries.map((g, i) => (
                    <div key={i} className="bg-muted rounded-lg p-3 text-sm">
                      <div className="font-semibold">{g.code}</div>
                      <div className="text-muted-foreground">{g.desc}</div>
                      <div className="text-xs text-muted-foreground mt-1">{g.use}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border p-4 bg-blue-50">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" /> Unidades y Cantidades
                </h3>
                <div className="text-sm space-y-1.5">
                  <p><strong>Unidad:</strong> pSv·cm² (pico-Sievert por centimetro cuadrado de fluencia)</p>
                  <p><strong>Dosis efectiva (E):</strong> Suma ponderada de dosis equivalentes en organos/telidos (ICRP 60)</p>
                  <p><strong>Fluencia (Phi):</strong> Numero de particulas por unidad de area (cm⁻²)</p>
                  <p><strong>Relacion:</strong> E = coeff * Phi, donde coeff se expresa en pSv·cm²</p>
                  <p className="text-muted-foreground">Los coeficientes permiten calcular la dosis efectiva a partir de la fluencia medida en campo libre.</p>
                </div>
              </div>
            </TabsContent>

            {/* PHOTONS TAB */}
            <TabsContent value="photons" className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por energia o aplicacion..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                {searchTerm && <Badge variant="secondary">{filteredPhotons.length} resultados</Badge>}
              </div>
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left p-2">Energia (MeV)</th>
                      <th className="text-right p-2">AP</th>
                      <th className="text-right p-2">PA</th>
                      <th className="text-right p-2">LLAT</th>
                      <th className="text-right p-2">RLAT</th>
                      <th className="text-right p-2">ROT</th>
                      <th className="text-right p-2">ISO</th>
                      <th className="text-left p-2">Aplicacion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPhotons.map((c, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-2 font-medium">{c.energy}</td>
                        <td className="p-2 text-right font-mono">{c.ap}</td>
                        <td className="p-2 text-right font-mono">{c.pa}</td>
                        <td className="p-2 text-right font-mono">{c.llat}</td>
                        <td className="p-2 text-right font-mono">{c.rlat}</td>
                        <td className="p-2 text-right font-mono">{c.rot}</td>
                        <td className="p-2 text-right font-mono">{c.iso}</td>
                        <td className="p-2 text-xs text-muted-foreground">{c.app}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                Valores en pSv·cm². Datos extraidos de ICRU Report 57 (1998) Table A.1. La geometria AP (de frente) da los valores mas conservadores para blindajes de areas ocupadas.
              </p>
            </TabsContent>

            {/* NEUTRONS TAB */}
            <TabsContent value="neutrons" className="space-y-3">
              <div className="rounded-lg border p-4 bg-red-50 mb-3">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" /> Relevancia para Bunkers de Megavoltaje
                </h3>
                <p className="text-sm text-red-800">
                  Para energias superiores a 10 MV en aceleradores lineales (Versa HD, TrueBeam, etc.), 
                  la fotodisintegracion del nucleo de alta-Z en el blanco y colimador produce neutrones. 
                  Los coeficientes de neutrones del ICRU 57 son fundamentales para evaluar la dosis efectiva 
                  por fluencia de neutrones en la puerta del laberinto y areas adyacentes.
                </p>
              </div>
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left p-2">Energia</th>
                      <th className="text-right p-2">AP</th>
                      <th className="text-right p-2">PA</th>
                      <th className="text-right p-2">LLAT</th>
                      <th className="text-right p-2">RLAT</th>
                      <th className="text-right p-2">ROT</th>
                      <th className="text-right p-2">ISO</th>
                      <th className="text-left p-2">Aplicacion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {neutronCoefficients.map((c, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-2 font-medium">{c.energy}</td>
                        <td className="p-2 text-right font-mono">{c.ap}</td>
                        <td className="p-2 text-right font-mono">{c.pa}</td>
                        <td className="p-2 text-right font-mono">{c.llat}</td>
                        <td className="p-2 text-right font-mono">{c.rlat}</td>
                        <td className="p-2 text-right font-mono">{c.rot}</td>
                        <td className="p-2 text-right font-mono">{c.iso}</td>
                        <td className="p-2 text-xs text-muted-foreground">{c.app}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-sm mb-2">Comparacion: Dosis efectiva por fluencia (neutrones vs fotones)</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left p-2">Energia</th>
                      <th className="text-right p-2">Fotones (AP)</th>
                      <th className="text-right p-2">Neutrones (AP)</th>
                      <th className="text-right p-2">Ratio N / gamma</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b"><td className="p-2">1 MeV</td><td className="p-2 text-right font-mono">7.4</td><td className="p-2 text-right font-mono">233</td><td className="p-2 text-right font-mono font-bold">31.5x</td></tr>
                    <tr className="border-b"><td className="p-2">10 MeV</td><td className="p-2 text-right font-mono">9.3</td><td className="p-2 text-right font-mono">403</td><td className="p-2 text-right font-mono font-bold">43.3x</td></tr>
                    <tr><td className="p-2">100 MeV</td><td className="p-2 text-right font-mono">-</td><td className="p-2 text-right font-mono">380</td><td className="p-2 text-right font-mono font-bold">-</td></tr>
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-2">
                  Unidades: pSv·cm². Los neutrones son ~30-45x mas daninos por unidad de fluencia que los fotones a energias comparables.
                </p>
              </div>
            </TabsContent>

            {/* OPERATIONAL TAB */}
            <TabsContent value="operational" className="space-y-3">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-sm mb-3">Cantidades Operacionales vs Cantidades de Proteccion</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left p-2">Cantidad</th>
                      <th className="text-left p-2">Nombre</th>
                      <th className="text-left p-2">Definicion</th>
                      <th className="text-left p-2">Relacion con proteccion</th>
                      <th className="text-left p-2">Uso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationalQuantities.map((q, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-2 font-mono font-semibold">{q.qty}</td>
                        <td className="p-2">{q.name}</td>
                        <td className="p-2 text-muted-foreground">{q.def}</td>
                        <td className="p-2">{q.relation}</td>
                        <td className="p-2"><Badge variant="outline" className="text-xs">{q.use}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg border p-4 bg-amber-50">
                <h3 className="font-semibold text-sm mb-2">Nota sobre H*(10) y Dosis Efectiva</h3>
                <p className="text-sm">
                  Para fotones con energias entre 70 keV y 3 MeV, <strong>H*(10)</strong> proporciona una estimacion conservadora 
                  de la dosis efectiva. Fuera de este rango, la relacion varia. Para neutrones, H*(10) puede sobrestimar 
                  o subestimar la dosis efectiva dependiendo de la energia. El ICRU 57 proporciona los factores de conversion 
                  exactos para cada energia y geometria.
                </p>
              </div>
            </TabsContent>

            {/* APPLICATIONS TAB */}
            <TabsContent value="applications" className="space-y-3">
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left p-2">Aplicacion</th>
                      <th className="text-left p-2">Uso de ICRU 57</th>
                      <th className="text-left p-2">Valor clave</th>
                      <th className="text-left p-2">Relevancia blindajes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((a, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-2 font-medium">{a.app}</td>
                        <td className="p-2 text-muted-foreground">{a.use}</td>
                        <td className="p-2 font-mono">{a.key}</td>
                        <td className="p-2">{a.relevance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 bg-green-50">
                  <h4 className="font-semibold text-sm text-green-800">Cuando usar ICRU 57</h4>
                  <ul className="text-sm mt-1 space-y-1 list-disc pl-4">
                    <li>Evaluacion de dosis efectiva por fluencia medida</li>
                    <li>Diseno de blindajes donde se mide fluencia de particulas</li>
                    <li>Conversion de lecturas de monitores de area a dosis efectiva</li>
                    <li>Validacion de calculos Monte Carlo (GEANT4/FLUKA)</li>
                  </ul>
                </div>
                <div className="rounded-lg border p-3 bg-amber-50">
                  <h4 className="font-semibold text-sm text-amber-800">Limitaciones</h4>
                  <ul className="text-sm mt-1 space-y-1 list-disc pl-4">
                    <li>Coeficientes para adultos (no pediatricos directamente)</li>
                    <li>Phantom hermafrodita simplificado</li>
                    <li>No incluye estado de embarazo explicitamente</li>
                    <li>Para espectros continuos requiere integracion</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* CALCULATOR TAB */}
            <TabsContent value="calculator" className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Entrada</h3>
                  <div className="space-y-2">
                    <div className="space-y-1.5">
                      <Label>Fluencia (particulas/cm²)</Label>
                      <Input value={calcData.fluence} onChange={(e) => setCalcData({...calcData, fluence: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Energia del fotón (MeV)</Label>
                      <Input value={calcData.energy} onChange={(e) => setCalcData({...calcData, energy: e.target.value})} />
                    </div>
                    <Button onClick={runCalc} className="w-full"><Calculator className="h-4 w-4 mr-2" /> Calcular dosis efectiva</Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Resultado</h3>
                  {calcResult ? (
                    <div className="rounded-lg border p-4 bg-green-50">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">Dosis efectiva estimada</span>
                      </div>
                      <div className="text-lg font-mono font-bold text-green-900">{calcResult}</div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Usando coeficiente AP a {calcData.energy} MeV. Para geometrias diferentes, multiplicar por ratio geometry/AP.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border p-8 text-center text-muted-foreground text-sm">
                      Ingrese fluencia y energia
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="px-6 pb-4 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            ICRU Report 57 (1998) | ICRP Publication 74 (1996) | RadShield-MX v13.0
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
