// BraquiterapiaCo60Dialog.tsx -- Dialogo especializado para Braquiterapia HDR Co-60
// Basado en Anexo CNSNS Permiso Construccion IJC Zapopan A00.200/2445/2023

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Atom, Shield, Activity, FileText, Download, Calculator, CheckCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BraquiterapiaCo60Dialog({ open, onOpenChange }: Props) {
  const [calcB, setCalcB] = useState<{ P: number; d: number; W: number; T: number; result: number } | null>(null);

  const handleExport = () => {
    const lines: string[] = [];
    lines.push('BRAQUITERAPIA HDR CO-60 — Datos Tecnicos y de Blindaje');
    lines.push('Basado en: Anexo CNSNS A00.200/2445/2023, IJC Zapopan');
    lines.push('');
    lines.push('=== ESPECIFICACIONES ===');
    lines.push('Equipo: Braquiterapia HDR de carga diferida, Elekta Flexitron HDR');
    lines.push('Radionuclido: Cobalto-60 (Co-60), 1.25 MeV promedio');
    lines.push('Actividad maxima: 111 GBq (3.0 Ci)');
    lines.push('Actividad almacenamiento max: 81 GBq (2.1891 Ci)');
    lines.push('Carga trabajo: 256.41 mGy m2/sem (25 pac/sem, 10 Gy, 18 min/pac)');
    lines.push('');
    lines.push('=== HVL / TVL CO-60 ===');
    lines.push('Concreto 2.35: HVL 6.20 cm, TVL 20.60 cm');
    lines.push('Plomo 11.34: HVL 1.20 cm, TVL 4.00 cm');
    lines.push('Acero 7.87: HVL 2.10 cm, TVL 6.90 cm');
    lines.push('');
    lines.push('=== FORMULA ===');
    lines.push('B = (P x d^2) / (W x U x T)');
    lines.push('t = TVL x log10(1/B)');
    lines.push('');
    lines.push('=== RESULTADOS EJEMPLO IJC ZAPOPAN ===');
    lines.push('A/i (Subsuelo, T=1/16): 60 cm concreto');
    lines.push('B/ii (Bunker LINAC, T=1/2): 56 cm req, existente 200+120 cm OK');
    lines.push("B'/ii (LINAC otro lado, T=1/16): pared secundaria 120 cm OK");
    lines.push('C/iii (Pasillo, T=1/4): 50 cm concreto');
    lines.push('D/iv (Recuperacion, T=1): 85 cm concreto');
    lines.push('E/v (Azotea, T=1/16): 50 cm concreto');
    lines.push('P (Puerta, T=1/8): 7.5 cm plomo');
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Braquiterapia_Co60_Datos_Tecnicos.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Datos Braqui Co-60 exportados');
  };

  const doCalc = () => {
    const P = 0.1; // mSv/sem POE
    const d = 2.5; // m
    const W = 256.41; // mGy m2/sem
    const T = 0.125; // 1/8
    const B = (P * d * d) / (W * 1 * T);
    setCalcB({ P, d, W, T, result: B });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Atom className="w-5 h-5 text-amber-700" />
            Braquiterapia HDR Co-60 — Datos Tecnicos y de Blindaje
            <Badge variant="outline" className="ml-auto text-[10px]">CNSNS A00.200/2445/2023</Badge>
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1">
            Basado en Anexo al Permiso de Construccion CNSNS — Instituto Jalisciense de Cancerologia, Unidad Zapopan.
            Elekta Flexitron HDR con fuente Co-60 de 111 GBq (3 Ci).
          </p>
        </DialogHeader>

        <Tabs defaultValue="specs" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 shrink-0 grid grid-cols-5 h-8">
            <TabsTrigger value="specs" className="text-xs gap-1"><Atom className="w-3 h-3" /> Especificaciones</TabsTrigger>
            <TabsTrigger value="shielding" className="text-xs gap-1"><Shield className="w-3 h-3" /> Blindaje</TabsTrigger>
            <TabsTrigger value="results" className="text-xs gap-1"><CheckCircle className="w-3 h-3" /> Resultados</TabsTrigger>
            <TabsTrigger value="method" className="text-xs gap-1"><FileText className="w-3 h-3" /> Metodologia</TabsTrigger>
            <TabsTrigger value="calc" className="text-xs gap-1"><Calculator className="w-3 h-3" /> Calculadora</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-4">
            <TabsContent value="specs" className="mt-0 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Atom className="w-4 h-4 text-amber-600" /> Especificaciones tecnicas — Elekta Flexitron HDR Co-60</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Equipo / Marca / Modelo', value: 'Braquiterapia HDR — Elekta — Flexitron HDR' },
                  { label: 'Radionuclido', value: 'Cobalto-60 (Co-60) — Emisiones 1.17 y 1.33 MeV' },
                  { label: 'Energia promedio', value: '1.25 MeV (promedio ponderado Co-60)' },
                  { label: 'Actividad maxima inicial', value: '111 GBq (3.0 Ci) — Licencia CNSNS' },
                  { label: 'Actividad almacenamiento max', value: '81 GBq (2.1891 Ci) — Capacidad safe' },
                  { label: 'Dosis prescripcion tipica', value: '10 Gy a 1 cm de la fuente' },
                  { label: 'Duracion maxima tratamiento', value: '18 minutos por paciente' },
                  { label: 'Pacientes / semana', value: '25 pac/sem (5 dias x 5 pac/dia)' },
                  { label: 'Carga trabajo semanal [W]', value: '256.41 mGy m²/sem (comprometida CNSNS)' },
                  { label: 'Tipo aplicadores', value: 'Intracavitarios / Intersticiales / Superficie' },
                  { label: 'Constante gamma Co-60', value: '1.32 R m²/h Ci (Shleien Tabla 6.2.2)' },
                  { label: 'Constante dosis Co-60 (1m)', value: '3.70E-4 mSv h⁻¹ / MBq (Shleien)' },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-md p-3 border border-gray-100">
                    <div className="text-xs font-medium text-gray-700">{item.label}</div>
                    <div className="text-[11px] text-gray-500 mt-1">{item.value}</div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="shielding" className="mt-0 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Shield className="w-4 h-4 text-amber-600" /> HVL y TVL para Co-60 (1.25 MeV)</h3>
              <div className="overflow-auto">
                <table className="w-full text-[10px] border-collapse">
                  <thead><tr className="bg-gray-100"><th className="p-1 border">Material</th><th className="p-1 border">Densidad (g/cm³)</th><th className="p-1 border">HVL (cm)</th><th className="p-1 border">TVL (cm)</th><th className="p-1 border">Nota</th></tr></thead>
                  <tbody>
                    <tr><td className="p-1 border font-medium">Concreto ordinario</td><td className="p-1 border text-center">2.35</td><td className="p-1 border text-center font-bold">6.20</td><td className="p-1 border text-center font-bold">20.60</td><td className="p-1 border">Bunker estandar</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border font-medium">Concreto magnetita</td><td className="p-1 border text-center">3.2</td><td className="p-1 border text-center">4.8</td><td className="p-1 border text-center">16.0</td><td className="p-1 border">Alto densidad</td></tr>
                    <tr><td className="p-1 border font-medium">Acero / Hierro</td><td className="p-1 border text-center">7.87</td><td className="p-1 border text-center">2.10</td><td className="p-1 border text-center">6.90</td><td className="p-1 border">Estructural</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border font-medium">Plomo</td><td className="p-1 border text-center">11.34</td><td className="p-1 border text-center font-bold">1.20</td><td className="p-1 border text-center font-bold">4.00</td><td className="p-1 border">Puertas / compacto</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-semibold text-gray-800 mt-4 flex items-center gap-2"><Shield className="w-4 h-4 text-amber-600" /> Distancias isocentro-paredes (Ejemplo IJC Zapopan)</h3>
              <div className="overflow-auto">
                <table className="w-full text-[10px] border-collapse">
                  <thead><tr className="bg-gray-100"><th className="p-1 border">Punto</th><th className="p-1 border">Pared</th><th className="p-1 border">Distancia (m)</th><th className="p-1 border">Colindancia</th><th className="p-1 border">Tipo area</th></tr></thead>
                  <tbody>
                    <tr><td className="p-1 border">i / A</td><td className="p-1 border">Pared i</td><td className="p-1 border text-center">1.89</td><td className="p-1 border">Subsuelo / Terreno</td><td className="p-1 border">Supervisada</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border">ii / B</td><td className="p-1 border">Pared ii</td><td className="p-1 border text-center">3.80</td><td className="p-1 border">Bunker Acelerador Lineal</td><td className="p-1 border">Controlada</td></tr>
                    <tr><td className="p-1 border">iii / C</td><td className="p-1 border">Pared iii</td><td className="p-1 border text-center">3.11</td><td className="p-1 border">Pasillo interno</td><td className="p-1 border">Controlada</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border">iv / D</td><td className="p-1 border">Pared iv</td><td className="p-1 border text-center">1.60</td><td className="p-1 border">Recuperacion / Preparacion</td><td className="p-1 border">Supervisada</td></tr>
                    <tr><td className="p-1 border">v / E</td><td className="p-1 border">Techo (Pared v)</td><td className="p-1 border text-center">3.48</td><td className="p-1 border">Azotea / Area verde</td><td className="p-1 border">Supervisada</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border">vi</td><td className="p-1 border">Piso / Suelo</td><td className="p-1 border text-center">0.70</td><td className="p-1 border">Subsuelo / Terreno</td><td className="p-1 border">Supervisada</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-semibold text-gray-800 mt-4 flex items-center gap-2"><Shield className="w-4 h-4 text-amber-600" /> Factores de uso y ocupacion</h3>
              <div className="overflow-auto">
                <table className="w-full text-[10px] border-collapse">
                  <thead><tr className="bg-gray-100"><th className="p-1 border">Punto</th><th className="p-1 border">Colindancia</th><th className="p-1 border">U</th><th className="p-1 border">T</th><th className="p-1 border">P (mSv/sem)</th><th className="p-1 border">Limite anual</th></tr></thead>
                  <tbody>
                    <tr><td className="p-1 border">A / i</td><td className="p-1 border">Subsuelo</td><td className="p-1 border text-center">1</td><td className="p-1 border text-center">1/16</td><td className="p-1 border text-center">0.01</td><td className="p-1 border">0.5 mSv/ano (publico)</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border">B / ii</td><td className="p-1 border">Bunker LINAC</td><td className="p-1 border text-center">1</td><td className="p-1 border text-center">1/2</td><td className="p-1 border text-center">0.10</td><td className="p-1 border">5 mSv/ano (POE)</td></tr>
                    <tr><td className="p-1 border">B' / ii</td><td className="p-1 border">Bunker LINAC (otro lado)</td><td className="p-1 border text-center">1</td><td className="p-1 border text-center">1/16</td><td className="p-1 border text-center">0.02</td><td className="p-1 border">1 mSv/ano (publico)</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border">C / iii</td><td className="p-1 border">Pasillo</td><td className="p-1 border text-center">1</td><td className="p-1 border text-center">1/4</td><td className="p-1 border text-center">0.05</td><td className="p-1 border">2.5 mSv/ano (POE)</td></tr>
                    <tr><td className="p-1 border">D / iv</td><td className="p-1 border">Recuperacion</td><td className="p-1 border text-center">1</td><td className="p-1 border text-center">1</td><td className="p-1 border text-center">0.02</td><td className="p-1 border">1 mSv/ano (publico)</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border">E / v</td><td className="p-1 border">Azotea</td><td className="p-1 border text-center">1</td><td className="p-1 border text-center">1/16</td><td className="p-1 border text-center">0.01</td><td className="p-1 border">0.5 mSv/ano (publico)</td></tr>
                    <tr><td className="p-1 border">P</td><td className="p-1 border">Puerta / Vestibulo</td><td className="p-1 border text-center">1</td><td className="p-1 border text-center">1/8</td><td className="p-1 border text-center">0.10</td><td className="p-1 border">5 mSv/ano (POE)</td></tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="results" className="mt-0 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-600" /> Resultados de blindaje — Ejemplo IJC Zapopan</h3>
              <div className="overflow-auto">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-1 border">Punto</th><th className="p-1 border">Colindancia</th><th className="p-1 border">Tipo</th>
                      <th className="p-1 border">P (mSv/sem)</th><th className="p-1 border">d (m)</th>
                      <th className="p-1 border">B</th><th className="p-1 border">1/B</th>
                      <th className="p-1 border">Concreto (cm)</th><th className="p-1 border">Plomo (cm)</th>
                      <th className="p-1 border">Espesor final</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-1 border">A / i</td><td className="p-1 border">Subsuelo</td><td className="p-1 border">Supervisada</td>
                      <td className="p-1 border text-center">0.01</td><td className="p-1 border text-center">1.89</td>
                      <td className="p-1 border text-center">0.00011</td><td className="p-1 border text-center">9090</td>
                      <td className="p-1 border text-center font-bold">60</td><td className="p-1 border text-center">—</td>
                      <td className="p-1 border">60 cm concreto 2.35</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-1 border">B / ii</td><td className="p-1 border">Bunker LINAC</td><td className="p-1 border">Controlada</td>
                      <td className="p-1 border text-center">0.10</td><td className="p-1 border text-center">3.80</td>
                      <td className="p-1 border text-center">0.0017</td><td className="p-1 border text-center">588</td>
                      <td className="p-1 border text-center">56</td><td className="p-1 border text-center">—</td>
                      <td className="p-1 border">Pared primaria 200 cm + secundaria 120 cm</td>
                    </tr>
                    <tr>
                      <td className="p-1 border">B' / ii</td><td className="p-1 border">Bunker LINAC</td><td className="p-1 border">Supervisada</td>
                      <td className="p-1 border text-center">0.02</td><td className="p-1 border text-center">3.80</td>
                      <td className="p-1 border text-center">0.00021</td><td className="p-1 border text-center">4761</td>
                      <td className="p-1 border text-center">Suf.</td><td className="p-1 border text-center">—</td>
                      <td className="p-1 border">Pared secundaria 120 cm del LINAC</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-1 border">C / iii</td><td className="p-1 border">Pasillo</td><td className="p-1 border">Controlada</td>
                      <td className="p-1 border text-center">0.05</td><td className="p-1 border text-center">3.11</td>
                      <td className="p-1 border text-center">0.00085</td><td className="p-1 border text-center">1176</td>
                      <td className="p-1 border text-center font-bold">50</td><td className="p-1 border text-center">—</td>
                      <td className="p-1 border">50 cm concreto 2.35</td>
                    </tr>
                    <tr>
                      <td className="p-1 border">D / iv</td><td className="p-1 border">Recuperacion</td><td className="p-1 border">Supervisada</td>
                      <td className="p-1 border text-center">0.02</td><td className="p-1 border text-center">1.60</td>
                      <td className="p-1 border text-center">0.00062</td><td className="p-1 border text-center">1612</td>
                      <td className="p-1 border text-center font-bold">85</td><td className="p-1 border text-center">—</td>
                      <td className="p-1 border">85 cm concreto 2.35</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-1 border">E / v</td><td className="p-1 border">Azotea</td><td className="p-1 border">Supervisada</td>
                      <td className="p-1 border text-center">0.01</td><td className="p-1 border text-center">3.48</td>
                      <td className="p-1 border text-center">0.00014</td><td className="p-1 border text-center">7142</td>
                      <td className="p-1 border text-center font-bold">50</td><td className="p-1 border text-center">—</td>
                      <td className="p-1 border">50 cm concreto 2.35</td>
                    </tr>
                    <tr>
                      <td className="p-1 border">P</td><td className="p-1 border">Puerta</td><td className="p-1 border">Controlada</td>
                      <td className="p-1 border text-center">0.10</td><td className="p-1 border text-center">2.50</td>
                      <td className="p-1 border text-center">0.0010</td><td className="p-1 border text-center">1000</td>
                      <td className="p-1 border text-center">—</td><td className="p-1 border text-center font-bold">7.5</td>
                      <td className="p-1 border">7.5 cm plomo 11.0 g/cm³</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-green-50 rounded-md p-3 border border-green-100">
                <div className="text-xs font-medium text-green-800">Verificacion barrera existente — Bunker LINAC adyacente</div>
                <div className="text-[10px] text-green-700 mt-1">
                  La barrera B/ii colinda con el bunker de un Acelerador Lineal existente. La pared primaria del LINAC tiene <strong>200 cm de concreto</strong>, 
                  que excede ampliamente los <strong>56 cm requeridos</strong> para la braquiterapia. La pared secundaria del LINAC (120 cm) 
                  es suficiente para proteger el area no controlada del otro lado (B'/ii). <strong>No se requiere blindaje adicional.</strong>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="method" className="mt-0 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><FileText className="w-4 h-4 text-amber-600" /> Metodologia NCRP 151 + Shleien</h3>

              <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                <div className="text-xs font-medium text-gray-700">Metodo principal — NCRP Report No. 151</div>
                <div className="text-[11px] text-gray-600 mt-1 space-y-1">
                  <p><strong>1. Calcular carga de trabajo W:</strong></p>
                  <p className="font-mono text-center">W = N × D × t × (1 m)² / d²</p>
                  <p>Donde N = pacientes/semana, D = dosis Gy, t = tiempo h, d = distancia m.</p>
                  <p>Ejemplo: 25 pac × 10 Gy × 0.30 h / (1 m)² = <strong>75 mGy m²/sem</strong> (simplificado; valor real comprometido: 256.41)</p>

                  <p className="mt-2"><strong>2. Calcular factor de transmision B:</strong></p>
                  <p className="font-mono text-center">B = (P × d²) / (W × U × T)</p>
                  <p>Donde P = limite mSv/sem, d = distancia m, W = mGy m²/sem, U = 1, T = factor ocupacion.</p>

                  <p className="mt-2"><strong>3. Calcular espesor de blindaje:</strong></p>
                  <p className="font-mono text-center">t = TVL × log₁₀(1 / B)</p>
                  <p>Donde TVL = tenth-value layer del material (cm).</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                <div className="text-xs font-medium text-gray-700">Metodo alternativo — Factor barrera por curie (Shleien 1998, Tabla 6.6)</div>
                <div className="text-[11px] text-gray-600 mt-1 space-y-1">
                  <p>Para Co-60: <strong>B = 0.00192 × A(Ci) × (1/d)²</strong> para 2.5 mR/h (0.025 mGy/h) a 40 h/sem.</p>
                  <p>Ejemplo: A = 3 Ci, d = 2 m → B = 0.00192 × 3 × 0.25 = <strong>0.00144</strong></p>
                  <p>Espesor concreto = 20.6 × log₁₀(1/0.00144) = 20.6 × 2.84 = <strong>58.5 cm</strong></p>
                  <p className="text-gray-500 italic">Resultado consistente con metodo NCRP 151 para configuraciones similares.</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                <div className="text-xs font-medium text-gray-700">Consideraciones especificas Braquiterapia HDR</div>
                <div className="text-[10px] text-gray-600 mt-1 space-y-1">
                  <p>• El paciente actua como atenuador parcial (factor de atenuacion tisular ~ 30-50% para Co-60).</p>
                  <p>• La fuente se mueve (dwell positions); la distancia efectiva promedio a paredes puede variar ±20%.</p>
                  <p>• U = 1 siempre (la fuente siempre esta activa durante tratamiento en la sala).</p>
                  <p>• Beam-off: cuando la fuente esta en el safe, la dosis exterior es despreciable (blindaje interno del safe excede 10 TVL).</p>
                  <p>• La distancia corta isocentro-pared (menor a 2 m en algunos puntos) puede requerir espesores importantes.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="calc" className="mt-0 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Calculator className="w-4 h-4 text-amber-600" /> Calculadora rapida de blindaje Braqui HDR Co-60</h3>
              <div className="bg-gray-50 rounded-md p-3 border border-gray-100 space-y-2">
                <div className="text-[11px] text-gray-600">
                  <strong>Ejemplo precalculado:</strong> Punto P (puerta), POE, P = 0.1 mSv/sem, d = 2.5 m, W = 256.41 mGy m²/sem, T = 1/8.
                </div>
                <Button size="sm" onClick={doCalc} className="text-xs">Calcular B y espesor</Button>
                {calcB && (
                  <div className="p-2 bg-white rounded border text-[11px] space-y-1">
                    <p><strong>B</strong> = (P × d²) / (W × U × T) = ({calcB.P} × {calcB.d}²) / ({calcB.W} × 1 × {calcB.T}) = <strong>{calcB.result.toExponential(4)}</strong></p>
                    <p><strong>1/B</strong> = <strong>{(1/calcB.result).toFixed(0)}</strong></p>
                    <p><strong>Plomo</strong> = TVL × log₁₀(1/B) = 4.0 × log₁₀({(1/calcB.result).toFixed(0)}) = <strong>{(4.0 * Math.log10(1/calcB.result)).toFixed(2)} cm</strong></p>
                    <p><strong>Concreto</strong> = TVL × log₁₀(1/B) = 20.6 × log₁₀({(1/calcB.result).toFixed(0)}) = <strong>{(20.6 * Math.log10(1/calcB.result)).toFixed(2)} cm</strong></p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                <div className="text-xs font-medium text-gray-700">Parametros de entrada (template)</div>
                <div className="grid grid-cols-2 gap-2 text-[10px] mt-1">
                  <div className="p-2 bg-white rounded border"><div className="font-medium">Actividad fuente (GBq):</div><div className="text-amber-700 font-mono">[Ingresar]</div></div>
                  <div className="p-2 bg-white rounded border"><div className="font-medium">Pacientes/semana:</div><div className="text-amber-700 font-mono">[Ingresar]</div></div>
                  <div className="p-2 bg-white rounded border"><div className="font-medium">Dosis/tratamiento (Gy):</div><div className="text-amber-700 font-mono">[Ingresar]</div></div>
                  <div className="p-2 bg-white rounded border"><div className="font-medium">Tiempo/paciente (h):</div><div className="text-amber-700 font-mono">[Ingresar]</div></div>
                  <div className="p-2 bg-white rounded border"><div className="font-medium">Distancia pared (m):</div><div className="text-amber-700 font-mono">[Ingresar]</div></div>
                  <div className="p-2 bg-white rounded border"><div className="font-medium">Factor ocupacion T:</div><div className="text-amber-700 font-mono">[1 / 1/2 / 1/4 / 1/8 / 1/16]</div></div>
                  <div className="p-2 bg-white rounded border"><div className="font-medium">Limite dosis P (mSv/sem):</div><div className="text-amber-700 font-mono">[0.1 POE / 0.02 publico / 0.01 publico]</div></div>
                  <div className="p-2 bg-white rounded border"><div className="font-medium">Material:</div><div className="text-amber-700 font-mono">[Concreto / Plomo / Acero]</div></div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="px-4 py-3 border-t border-gray-200 shrink-0 flex justify-between items-center">
          <div className="text-[10px] text-gray-400">
            Fuente: Anexo CNSNS A00.200/2445/2023 — IJC Zapopan — Elekta Flexitron HDR Co-60
          </div>
          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleExport}>
            <Download className="w-3 h-3" /> Exportar datos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
