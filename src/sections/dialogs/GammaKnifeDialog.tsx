// GammaKnifeDialog.tsx -- Dialogo especializado para Gamma Knife (Elekta Perfexion/Esprit)
// Basado en datos extraidos de Memoria Analitica HAHS Pedregal + Informe Anual 2024

import CalculadoraCo60 from './CalculadoraCo60';
import { OBJETIVO_GAMMA_KNIFE, blindajeCo60 } from '@/lib/calculadorasNormativas';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Atom, Shield, Activity, Stethoscope, FileText, Download, Calculator, Clock, Users } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Ejemplo S1a: kerma semanal sin blindaje (μSv) con las tasas del fabricante a 2.5 m (0.42 × 60 h + 1.2 × 96 h). */
const S1A_D_ACUM_uSv = 0.42 * 60 + 1.2 * 96;

export default function GammaKnifeDialog({ open, onOpenChange }: Props) {
  const P_uSv = OBJETIVO_GAMMA_KNIFE.P_mSv_semana * 1000;
  const s1a = blindajeCo60(S1A_D_ACUM_uSv / 1000, OBJETIVO_GAMMA_KNIFE.P_mSv_semana, 1, 1);
  const handleExport = () => {
    const lines: string[] = [];
    lines.push('GAMMA KNIFE — Datos Tecnicos y de Blindaje (Elekta Esprit/Perfexion)');
    lines.push('Extraido de: Memoria Analitica HAHS Pedregal + Informe Anual 2024');
    lines.push('');
    lines.push('=== ESPECIFICACIONES TECNICAS ===');
    lines.push('Equipo: Leksell Gamma Knife (Esprit/Perfexion)');
    lines.push('Marca: Elekta AB');
    lines.push('Fuentes: 192 (Perfexion) o 201 (Icon) de Co-60');
    lines.push('Energia: 1.25 MeV promedio (lineas 1.17 + 1.33 MeV)');
    lines.push('Actividad maxima: 6600 Ci');
    lines.push('HVL Concreto: 6.20 cm | TVL Concreto: 20.60 cm');
    lines.push('HVL Acero: 2.10 cm | TVL Acero: 6.90 cm');
    lines.push('HVL Plomo: 1.20 cm | TVL Plomo: 4.00 cm');
    lines.push('');
    lines.push('=== FORMULA DE BLINDAJE ===');
    lines.push('t = (HVL / ln 2) * ln( (T * U * D_acum) / P )  [equivalente: t = TVL * log10(1/B), B = P / (T * U * D_acum)]');
    lines.push('Donde: P = limite dosis (uSv/sem), T = factor ocupacion, U = 1, D_acum = carga dosis semanal');
    lines.push('');
    lines.push('=== PACIENTES 2024 (58 casos) ===');
    lines.push('Metastasis: 11 (19.0%)');
    lines.push('Neurinoma Acustico: 9 (15.5%)');
    lines.push('Meningioma: 8 (13.8%)');
    lines.push('Adenoma Hipofisis: 8 (13.8%)');
    lines.push('MAV: 5 (8.6%)');
    lines.push('Schwannoma Trigeminal: 4 (6.9%)');
    lines.push('Otros: 13 (22.4%)');
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GammaKnife_Datos_Tecnicos.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Datos Gamma Knife exportados');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Atom className="w-5 h-5 text-cyan-700" />
            Gamma Knife — Datos Tecnicos y de Blindaje
            <Badge variant="outline" className="ml-auto text-[10px]">Elekta Esprit / Perfexion</Badge>
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1">
            Datos extraidos de Memoria Analitica HAHS Pedregal e Informe Anual 2024. 
            Incluye especificaciones tecnicas, tablas de dosis, calculo de blindaje y estadisticas clinicas.
          </p>
        </DialogHeader>

        <Tabs defaultValue="specs" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 shrink-0 grid grid-cols-5 h-8">
            <TabsTrigger value="specs" className="text-xs gap-1"><Atom className="w-3 h-3" /> Especificaciones</TabsTrigger>
            <TabsTrigger value="dose" className="text-xs gap-1"><Activity className="w-3 h-3" /> Tasas de dosis</TabsTrigger>
            <TabsTrigger value="shielding" className="text-xs gap-1"><Shield className="w-3 h-3" /> Blindaje</TabsTrigger>
            <TabsTrigger value="clinical" className="text-xs gap-1"><Stethoscope className="w-3 h-3" /> Clinico</TabsTrigger>
            <TabsTrigger value="calc" className="text-xs gap-1"><Calculator className="w-3 h-3" /> Calculo</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-4">
            <TabsContent value="specs" className="mt-0 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Atom className="w-4 h-4 text-cyan-600" /> Especificaciones tecnicas Leksell Gamma Knife</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                  <div className="text-xs font-medium text-gray-700">Equipo / Marca / Modelo</div>
                  <div className="text-[11px] text-gray-500 mt-1">Leksell Gamma Knife — Elekta AB — Esprit / Perfexion / Icon</div>
                </div>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                  <div className="text-xs font-medium text-gray-700">Numero de fuentes</div>
                  <div className="text-[11px] text-gray-500 mt-1">192 (Perfexion) o 201 (Icon) — Cobalto-60 (Co-60)</div>
                </div>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                  <div className="text-xs font-medium text-gray-700">Energia gamma</div>
                  <div className="text-[11px] text-gray-500 mt-1">1.25 MeV promedio (lineas de emision: 1.17 y 1.33 MeV)</div>
                </div>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                  <div className="text-xs font-medium text-gray-700">Actividad maxima inicial</div>
                  <div className="text-[11px] text-gray-500 mt-1">6600 Ci (especificacion del fabricante)</div>
                </div>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                  <div className="text-xs font-medium text-gray-700">Vida media Co-60</div>
                  <div className="text-[11px] text-gray-500 mt-1">5.27 anos (T1/2 = 5.27 anos ~ 1925.5 dias)</div>
                </div>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                  <div className="text-xs font-medium text-gray-700">Dosis de prescripcion tipica</div>
                  <div className="text-[11px] text-gray-500 mt-1">12-15 Gy al margen del 50% (margen prescripcion ~ 50% del maximo)</div>
                </div>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                  <div className="text-xs font-medium text-gray-700">Numero de isocentros promedio</div>
                  <div className="text-[11px] text-gray-500 mt-1">6-10 isocentros por sesion de tratamiento</div>
                </div>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                  <div className="text-xs font-medium text-gray-700">Tiempo de tratamiento</div>
                  <div className="text-[11px] text-gray-500 mt-1">30-75 min totales; 15-45 min Beam On por paciente</div>
                </div>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                  <div className="text-xs font-medium text-gray-700">Pacientes/semana tipico</div>
                  <div className="text-[11px] text-gray-500 mt-1">12-36 pac/sem (2 turnos/dia x 6 pac/turno x 6 dias)</div>
                </div>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                  <div className="text-xs font-medium text-gray-700">Blindaje estandar</div>
                  <div className="text-[11px] text-gray-500 mt-1">Bunker concreto ~90 cm + techo ~65 cm (ejemplo HAHS Pedregal)</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dose" className="mt-0 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-600" /> Tasas de dosis exterior — Horizontal (uSv/h) a 6600 Ci</h3>
              <div className="overflow-auto">
                <table className="w-full text-[10px] border-collapse">
                  <thead><tr className="bg-gray-100"><th className="p-1 border">Distancia (m)</th><th className="p-1 border">Beam On</th><th className="p-1 border">Beam Off</th><th className="p-1 border">Nota</th></tr></thead>
                  <tbody>
                    <tr><td className="p-1 border text-center">0.3</td><td className="p-1 border text-center font-bold text-red-600">273.0</td><td className="p-1 border text-center">1.8</td><td className="p-1 border">Sobre el casco (registro real)</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border text-center">0.5</td><td className="p-1 border text-center">19.5</td><td className="p-1 border text-center">1.6</td><td className="p-1 border">Cerca del casco</td></tr>
                    <tr><td className="p-1 border text-center">1.0</td><td className="p-1 border text-center">4.7</td><td className="p-1 border text-center">1.5</td><td className="p-1 border">1 metro</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border text-center">1.5</td><td className="p-1 border text-center">1.8</td><td className="p-1 border text-center">1.4</td><td className="p-1 border">1.5 m</td></tr>
                    <tr><td className="p-1 border text-center">2.0</td><td className="p-1 border text-center">0.78</td><td className="p-1 border text-center">1.3</td><td className="p-1 border">2 m</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border text-center">2.5</td><td className="p-1 border text-center">0.42</td><td className="p-1 border text-center">1.2</td><td className="p-1 border">2.5 m</td></tr>
                    <tr><td className="p-1 border text-center">3.0</td><td className="p-1 border text-center">0.25</td><td className="p-1 border text-center">1.1</td><td className="p-1 border">3 m</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border text-center">4.0</td><td className="p-1 border text-center">0.11</td><td className="p-1 border text-center">0.93</td><td className="p-1 border">4 m</td></tr>
                    <tr><td className="p-1 border text-center">5.0</td><td className="p-1 border text-center">0.06</td><td className="p-1 border text-center">0.81</td><td className="p-1 border">5 m</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-semibold text-gray-800 mt-4 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-600" /> Vertical hacia arriba (uSv/h)</h3>
              <div className="overflow-auto">
                <table className="w-full text-[10px] border-collapse">
                  <thead><tr className="bg-gray-100"><th className="p-1 border">Distancia (m)</th><th className="p-1 border">Beam On</th><th className="p-1 border">Beam Off</th></tr></thead>
                  <tbody>
                    <tr><td className="p-1 border text-center">0.5</td><td className="p-1 border text-center">14.0</td><td className="p-1 border text-center">1.5</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border text-center">1.0</td><td className="p-1 border text-center">3.4</td><td className="p-1 border text-center">1.4</td></tr>
                    <tr><td className="p-1 border text-center">2.0</td><td className="p-1 border text-center">0.56</td><td className="p-1 border text-center">1.2</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border text-center">3.0</td><td className="p-1 border text-center">0.18</td><td className="p-1 border text-center">1.0</td></tr>
                    <tr><td className="p-1 border text-center">5.0</td><td className="p-1 border text-center">0.04</td><td className="p-1 border text-center">0.76</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-semibold text-gray-800 mt-4 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-600" /> Vertical hacia abajo (uSv/h)</h3>
              <div className="overflow-auto">
                <table className="w-full text-[10px] border-collapse">
                  <thead><tr className="bg-gray-100"><th className="p-1 border">Distancia (m)</th><th className="p-1 border">Beam On</th><th className="p-1 border">Beam Off</th></tr></thead>
                  <tbody>
                    <tr><td className="p-1 border text-center">0.5</td><td className="p-1 border text-center">0.72</td><td className="p-1 border text-center">1.5</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border text-center">1.0</td><td className="p-1 border text-center">0.36</td><td className="p-1 border text-center">1.4</td></tr>
                    <tr><td className="p-1 border text-center">2.0</td><td className="p-1 border text-center">0.10</td><td className="p-1 border text-center">1.2</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border text-center">3.0</td><td className="p-1 border text-center">0.04</td><td className="p-1 border text-center">1.0</td></tr>
                    <tr><td className="p-1 border text-center">5.0</td><td className="p-1 border text-center">0.01</td><td className="p-1 border text-center">0.76</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="text-[10px] text-gray-400 italic mt-2">
                Fuente: Elekta Esprit Site Planning Guide — Tablas de tasas de dosis exterior normalizadas a 6600 Ci.
              </div>
            </TabsContent>

            <TabsContent value="shielding" className="mt-0 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-600" /> HVL y TVL para Co-60 (1.25 MeV)</h3>
              <div className="overflow-auto">
                <table className="w-full text-[10px] border-collapse">
                  <thead><tr className="bg-gray-100"><th className="p-1 border">Material</th><th className="p-1 border">Densidad (g/cm3)</th><th className="p-1 border">HVL (cm)</th><th className="p-1 border">TVL (cm)</th><th className="p-1 border">Nota</th></tr></thead>
                  <tbody>
                    <tr><td className="p-1 border font-medium">Concreto ordinario</td><td className="p-1 border text-center">2.35</td><td className="p-1 border text-center font-bold">6.20</td><td className="p-1 border text-center font-bold">20.60</td><td className="p-1 border">Standard bunker</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border font-medium">Concreto magnetita</td><td className="p-1 border text-center">3.2</td><td className="p-1 border text-center">4.8</td><td className="p-1 border text-center">16.0</td><td className="p-1 border">Alto densidad</td></tr>
                    <tr><td className="p-1 border font-medium">Acero / Hierro</td><td className="p-1 border text-center">7.87</td><td className="p-1 border text-center">2.10</td><td className="p-1 border text-center">6.90</td><td className="p-1 border">Estructural</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border font-medium">Plomo</td><td className="p-1 border text-center">11.35</td><td className="p-1 border text-center font-bold">1.20</td><td className="p-1 border text-center font-bold">4.00</td><td className="p-1 border">Blindaje compacto</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-semibold text-gray-800 mt-4 flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-600" /> Resultados del expediente — Memoria HAHS Pedregal (transcritos, no recalculados)</h3>
              <div className="text-[10px] text-amber-700">* S1a: el expediente usa P = 400 μSv/semana; el objetivo de NCRP 147/151 para área controlada es 100 μSv/semana (ver «Calculo»).</div>
              <div className="overflow-auto">
                <table className="w-full text-[10px] border-collapse">
                  <thead><tr className="bg-gray-100"><th className="p-1 border">Punto</th><th className="p-1 border">Colindancia</th><th className="p-1 border">Tipo</th><th className="p-1 border">P (uSv/sem)</th><th className="p-1 border">T</th><th className="p-1 border">Concreto (cm)</th><th className="p-1 border">Plomo (mm)</th></tr></thead>
                  <tbody>
                    <tr><td className="p-1 border">S1a</td><td className="p-1 border">Cuarto control</td><td className="p-1 border">Controlada</td><td className="p-1 border text-center" title={`Criterio del expediente; ${OBJETIVO_GAMMA_KNIFE.fuente}`}>400*</td><td className="p-1 border text-center">1</td><td className="p-1 border text-center font-bold">11.47</td><td className="p-1 border text-center">29.16</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border">S1b</td><td className="p-1 border">Patio</td><td className="p-1 border">Supervisada</td><td className="p-1 border text-center">10</td><td className="p-1 border text-center">1/20</td><td className="p-1 border text-center">3.36</td><td className="p-1 border text-center">8.55</td></tr>
                    <tr><td className="p-1 border">S2a-c</td><td className="p-1 border">Terreno natural</td><td className="p-1 border">Supervisada</td><td className="p-1 border text-center">20</td><td className="p-1 border text-center">0</td><td className="p-1 border text-center">0</td><td className="p-1 border text-center">0</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border">S3a</td><td className="p-1 border">Terreno natural</td><td className="p-1 border">Supervisada</td><td className="p-1 border text-center">20</td><td className="p-1 border text-center">0</td><td className="p-1 border text-center">0</td><td className="p-1 border text-center">0</td></tr>
                    <tr><td className="p-1 border">S3b</td><td className="p-1 border">Bunker 2</td><td className="p-1 border">Supervisada</td><td className="p-1 border text-center">10</td><td className="p-1 border text-center">1/2</td><td className="p-1 border text-center">8.91</td><td className="p-1 border text-center">22.67</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border">S4a-c</td><td className="p-1 border">Bunker 2</td><td className="p-1 border">Supervisada</td><td className="p-1 border text-center">10</td><td className="p-1 border text-center">1/2</td><td className="p-1 border text-center">8.91</td><td className="p-1 border text-center">22.67</td></tr>
                    <tr><td className="p-1 border">S5a-d</td><td className="p-1 border">Circulacion vehicular</td><td className="p-1 border">Supervisada</td><td className="p-1 border text-center">10</td><td className="p-1 border text-center">1/20</td><td className="p-1 border text-center">3.36</td><td className="p-1 border text-center">8.55</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 rounded-md p-3 border border-gray-100 mt-2">
                <div className="text-xs font-medium text-gray-700">Formula de blindaje (Elekta Site Planning Guide)</div>
                <div className="text-[11px] text-gray-600 mt-1 font-mono text-center py-2">
                  t = (HVL / ln 2) × ln( T × U × D<sub>acum</sub> / P ) = TVL × log₁₀(1/B), con B = P / (T × U × D<sub>acum</sub>)
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  Donde: P = limite dosis (uSv/sem), T = factor ocupacion, U = 1 (uso unitario Gamma Knife), 
                  D<sub>acum</sub> = D&#775;<sub>on</sub>×T<sub>on</sub> + D&#775;<sub>off</sub>×T<sub>off</sub> (carga dosis semanal sin blindaje).
                </div>
              </div>
            </TabsContent>

            <TabsContent value="clinical" className="mt-0 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-cyan-600" /> Estadisticas clinicas — Informe Anual 2024 (58 casos)</h3>
              <div className="overflow-auto">
                <table className="w-full text-[10px] border-collapse">
                  <thead><tr className="bg-gray-100"><th className="p-1 border">Diagnostico</th><th className="p-1 border">No. casos</th><th className="p-1 border">%</th><th className="p-1 border">Nota</th></tr></thead>
                  <tbody>
                    <tr><td className="p-1 border font-medium">Metastasis cerebrales</td><td className="p-1 border text-center">11</td><td className="p-1 border text-center font-bold">19.0%</td><td className="p-1 border">Diversos primarios (pulmon, mama, melanoma, etc.)</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border font-medium">Neurinoma Acustico</td><td className="p-1 border text-center">9</td><td className="p-1 border text-center font-bold">15.5%</td><td className="p-1 border">Schwannoma del nervio acustico (VIII par)</td></tr>
                    <tr><td className="p-1 border font-medium">Meningioma</td><td className="p-1 border text-center">8</td><td className="p-1 border text-center">13.8%</td><td className="p-1 border">Tumores meningeos</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border font-medium">Adenoma de Hipofisis</td><td className="p-1 border text-center">8</td><td className="p-1 border text-center">13.8%</td><td className="p-1 border">Tumores hipofisarios (funcionales y no funcionales)</td></tr>
                    <tr><td className="p-1 border font-medium">MAV</td><td className="p-1 border text-center">5</td><td className="p-1 border text-center">8.6%</td><td className="p-1 border">Malformacion Arteriovenosa</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border font-medium">Schwannoma Trigeminal</td><td className="p-1 border text-center">4</td><td className="p-1 border text-center">6.9%</td><td className="p-1 border">Nervio trigemino (V par)</td></tr>
                    <tr><td className="p-1 border font-medium">Astrocitoma Anaplasico</td><td className="p-1 border text-center">3</td><td className="p-1 border text-center">5.2%</td><td className="p-1 border">Tumores gliales</td></tr>
                    <tr className="bg-gray-50"><td className="p-1 border font-medium">Otros diagnosticos</td><td className="p-1 border text-center">10</td><td className="p-1 border text-center">17.2%</td><td className="p-1 border">TNE, Neuralgia, Craneofaringioma, GBM, Glomus, etc.</td></tr>
                    <tr className="bg-gray-100"><td className="p-1 border font-bold">TOTAL</td><td className="p-1 border text-center font-bold">58</td><td className="p-1 border text-center font-bold">100%</td><td className="p-1 border">Periodo Dic 2023 — Nov 2024</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-semibold text-gray-800 mt-4 flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-600" /> Estructura del Informe Anual (plantilla)</h3>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {icon: Users, label: 'Anexo A', desc: 'Relacion de pacientes y carga de trabajo (procedimientos/mes, diagnosticos)'},
                  {icon: Clock, label: 'Anexo B', desc: 'Mantenimiento y calibraciones periodicas (preventivo, dosimetrico, verificaciones)'},
                  {icon: Users, label: 'Anexo C', desc: 'Personal POE (autorizados, dosimetria externa, niveles de investigacion)'},
                  {icon: Activity, label: 'Anexo D', desc: 'Equipo de monitoreo (monitores de area, dosimetros directos, calibraciones)'},
                  {icon: Shield, label: 'Anexo E', desc: 'Levantamiento niveles de radiacion en colindancias (semestral)'},
                  {icon: Atom, label: 'Anexo F', desc: 'Pruebas de fuga de fuentes selladas (limite CNSNS: 1850 Bq)'},
                  {icon: Stethoscope, label: 'Anexo G', desc: 'Examenes medicos POE (NOM-026-NUCL-1999)'},
                  {icon: FileText, label: 'Anexo H', desc: 'Curso de reentrenamiento en proteccion radiologica'},
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-md p-2 border border-gray-100">
                    <item.icon className="w-3.5 h-3.5 text-cyan-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-gray-700">{item.label}</div>
                      <div className="text-[10px] text-gray-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="calc" className="mt-0 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><Calculator className="w-4 h-4 text-cyan-600" /> Calculadora rapida de blindaje Gamma Knife</h3>
              <div className="text-[11px] text-gray-600">
                Kerma semanal sin blindaje en el punto a partir de las tasas del fabricante (haz encendido y apagado) y las horas por semana.
                Valores iniciales: punto S1a del ejemplo (cuarto de control). Todos editables.
              </div>
              <CalculadoraCo60 inicial={{ modo: 'tasa', tasaOn_uSv_h: 0.42, horasOn: 60, tasaOff_uSv_h: 1.2, horasOff: 96, P_mSv: OBJETIVO_GAMMA_KNIFE.P_mSv_semana, T: 1 }} />

              <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                <div className="text-xs font-medium text-gray-700">Ejemplo practico — S1a (Cuarto de control)</div>
                <div className="text-[10px] text-gray-600 mt-1 space-y-1">
                  <p>Distancia (di) = 2.5 m → D&#775;<sub>on</sub> = 0.42 uSv/h, D&#775;<sub>off</sub> = 1.2 uSv/h</p>
                  <p>T<sub>on</sub> = 60 h/sem, T<sub>off,lab</sub> = 96 h/sem</p>
                  <p>D<sub>acum,on</sub> = 0.42 × 60 = 25.2 uSv/sem</p>
                  <p>D<sub>acum,off</sub> = 1.2 × 96 = 115.2 uSv/sem</p>
                  <p>D<sub>acum,total</sub> = 25.2 + 115.2 = <strong>140.4 uSv/sem</strong></p>
                  <p data-testid="gk-p">P = {P_uSv.toFixed(0)} μSv/semana ({OBJETIVO_GAMMA_KNIFE.fuente}), T = 1, U = 1.
                    El expediente usaba {(OBJETIVO_GAMMA_KNIFE.P_expediente_mSv_semana * 1000).toFixed(0)} μSv/semana, cuatro veces ese objetivo.</p>
                  <p>B = P/(T·U·D<sub>acum</sub>) = {P_uSv.toFixed(0)}/{S1A_D_ACUM_uSv.toFixed(1)} = <span data-testid="gk-b">{s1a.B_requerida.toFixed(3)}</span>
                    {s1a.B_requerida < 1
                      ? <> → <strong data-testid="gk-t">{s1a.espesores_cm.concrete.toFixed(1)} cm de concreto o {(s1a.espesores_cm.lead * 10).toFixed(0)} mm de plomo</strong> (NCRP 151 Tabla B.2, Co-60) adicionales en S1a.</>
                      : <>: <strong>no se requiere blindaje adicional</strong> en S1a con estas tasas.</>}
                    {' '}(Una versión anterior invertía el cociente y daba 9.4 cm de concreto.)</p>
                  <p className="text-gray-500 italic">Nota: Los valores reales de la memoria pueden variar segun tasas exactas del fabricante y distancias especificas del proyecto.</p>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="px-4 py-3 border-t border-gray-200 shrink-0 flex justify-between items-center">
          <div className="text-[10px] text-gray-400">
            Fuente: Memoria Analitica HAHS Pedregal + Informe Anual 2024 — Centro Neuro-Radiocirugia San Javier
          </div>
          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleExport}>
            <Download className="w-3 h-3" /> Exportar datos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
