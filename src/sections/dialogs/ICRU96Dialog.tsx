import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calculator,
  BookOpen,
  FlaskConical,
  Shield,
  AlertTriangle,
  CheckCircle2,
  FileDown,
  Activity,
  Crosshair,
} from "lucide-react";

interface ICRU96DialogProps {
  open: boolean;
  onClose: () => void;
}

const radionuclides = [
  { name: "I-131", emission: "Beta + Gamma (364 keV)", e_avg: "192", app: "Hipertiroidismo / Cancer tiroideo", shielding: "Sala hospitalizada", hvl_pb: "2.9", tvl_pb: "9.6", notes: "Hospitalizacion obligatoria (dosis alta)" },
  { name: "I-131 (MIBG)", emission: "Beta + Gamma", e_avg: "192", app: "Feocromocitoma / neuroblastoma", shielding: "Sala paciente", hvl_pb: "2.9", tvl_pb: "9.6", notes: "Terapia metabolica" },
  { name: "Lu-177 (DOTATATE)", emission: "Beta + Gamma (208 keV)", e_avg: "134", app: "Tumores neuroendocrinos (NET)", shielding: "Sala ambulatoria", hvl_pb: "0.8", tvl_pb: "2.7", notes: "NETTER-1: 7.4 GBq x 4 ciclos" },
  { name: "Lu-177 (PSMA-617)", emission: "Beta + Gamma", e_avg: "134", app: "Cancer de prostata metastasico", shielding: "Sala ambulatoria", hvl_pb: "0.8", tvl_pb: "2.7", notes: "VISION trial aprobado" },
  { name: "Y-90 (microesferas)", emission: "Beta (puro)", e_avg: "935", app: "Radioembolizacion hepatica (SIRT)", shielding: "Sala preparacion", hvl_pb: "N/A", tvl_pb: "N/A", notes: "Bremsstrahlung; manejo remoto" },
  { name: "Y-90 (ibritumomab)", emission: "Beta", e_avg: "935", app: "Linfoma no-Hodgkin (Zevalin)", shielding: "Sala admin.", hvl_pb: "N/A", tvl_pb: "N/A", notes: "Terapia radioinmunologica" },
  { name: "Ra-223", emission: "Alpha (puro)", e_avg: "~5800", app: "Cancer prostata metastasico oseo", shielding: "Sala admin.", hvl_pb: "0.5", tvl_pb: "1.5", notes: "ALSYMPCA; riesgo contaminacion > irradiacion" },
  { name: "Ac-225", emission: "Alpha + Beta", e_avg: "~5800", app: "Cancer prostata (terapia alpha)", shielding: "Sala admin.", hvl_pb: "2.0", tvl_pb: "6.0", notes: "Terapia alpha emergente; cadena de decaimiento" },
  { name: "Sr-89", emission: "Beta", e_avg: "583", app: "Metastasis oseas (dolor)", shielding: "Sala admin.", hvl_pb: "N/A", tvl_pb: "N/A", notes: "Cloruro de estroncio" },
  { name: "Sm-153 (EDTMP)", emission: "Beta + Gamma (103 keV)", e_avg: "233", app: "Metastasis oseas", shielding: "Sala admin.", hvl_pb: "1.2", tvl_pb: "4.0", notes: "Quadramet" },
  { name: "Re-186 (HEDP)", emission: "Beta + Gamma (137 keV)", e_avg: "362", app: "Metastasis oseas", shielding: "Sala admin.", hvl_pb: "1.5", tvl_pb: "5.0", notes: "-" },
  { name: "Re-188 (HEDP)", emission: "Beta", e_avg: "764", app: "Metastasis oseas / dolor", shielding: "Sala admin.", hvl_pb: "N/A", tvl_pb: "N/A", notes: "Generador W-188/Re-188" },
  { name: "Tb-161", emission: "Beta + Auger", e_avg: "154", app: "Terapia beta emergente", shielding: "Sala ambulatoria", hvl_pb: "0.9", tvl_pb: "3.0", notes: "Alternativa a Lu-177" },
];

const mirdSchema = [
  { param: "Dosis absorbida", symbol: "D(r_T, t)", formula: "Sumatoria A_h(t) * S(r_T <- r_S, t)", unit: "Gy" },
  { param: "Actividad fuente", symbol: "A_h(t)", formula: "Actividad acumulada o funcion temporal", unit: "MBq" },
  { param: "S-value", symbol: "S(r_T <- r_S)", formula: "Dosis en r_T por unidad actividad en r_S", unit: "mGy/MBq·s o Gy/MBq" },
  { param: "Actividad acumulada", symbol: "A_h", formula: "Integral temporal de A_h(t) dt", unit: "MBq·s" },
  { param: "Actividad admin.", symbol: "A_0", formula: "Actividad inicial al paciente", unit: "MBq o GBq" },
  { param: "Dosis total", symbol: "D(r_T)", formula: "A_h * S(r_T <- r_S)", unit: "Gy" },
  { param: "Tasa de dosis", symbol: "dD/dt", formula: "A_h(t) * S(r_T <- r_S, t)", unit: "Gy/h" },
  { param: "Decaimiento", symbol: "lambda", formula: "ln(2) / T_{1/2}", unit: "h^{-1}" },
  { param: "Vida media ef.", symbol: "T_eff", formula: "(T_bio * T_phys) / (T_bio + T_phys)", unit: "h" },
];

const shieldingAreas = [
  { area: "Sala de inyeccion / admin.", nuclides: "Lu-177, I-131", shieldType: "Paredes y ventana", thickness: "1-3 mm plomo", material: "Plomo / barita", notes: "Dosis a operator por inyeccion IV" },
  { area: "Sala espera pacientes (I-131)", nuclides: "I-131 (364 keV)", shieldType: "Paredes, suelo, techo", thickness: "3-8 mm plomo eq.", material: "Plomo / barita / concreto", notes: "Pacientes hospitalizados 1-3 dias" },
  { area: "Sala espera (Lu-177)", nuclides: "Lu-177 (208 keV)", shieldType: "Paredes", thickness: "1-2 mm plomo eq.", material: "Plomo / barita", notes: "Ambulatorio, espera 30-60 min" },
  { area: "Cuarto paciente (I-131 alta)", nuclides: "I-131", shieldType: "Paredes + puerta", thickness: "8-15 mm plomo eq.", material: "Plomo / barita", notes: "Habitacion con bano privado blindado" },
  { area: "Hot lab (preparacion)", nuclides: "Todos", shieldType: "Campana + blindaje", thickness: "5-20 mm plomo", material: "Plomo / vidrio plomado", notes: "Manipulacion radiofarmacos" },
  { area: "Almacen desechos", nuclides: "Todos", shieldType: "Contenedores + paredes", thickness: "Variable", material: "Plomo / concreto", notes: "Segun actividad y almacenamiento" },
  { area: "Sala admin. Y-90 (SIRT)", nuclides: "Y-90", shieldType: "Blindaje minimo", thickness: "5-10 mm acrilico + 1-2 mm Pb", material: "Acrilico + plomo", notes: "Bremsstrahlung de betas" },
  { area: "Sala admin. Ra-223", nuclides: "Ra-223", shieldType: "Blindaje bajo", thickness: "0.5-1 mm plomo", material: "Plomo fino", notes: "Riesgo: contaminacion, no irradiacion" },
  { area: "Sala admin. Ac-225", nuclides: "Ac-225", shieldType: "Moderado + contencion", thickness: "2-5 mm plomo", material: "Plomo", notes: "Riesgo fugas cadena decaimiento" },
];

const doseThresholds = [
  { modality: "Tumores neuroendocrinos (NET)", tumorDose: "~100-200 Gy", toxicDose: "Rinon: 23-27 Gy", nuclide: "Lu-177-DOTATATE", ref: "NETTER-1" },
  { modality: "Cancer de prostata (PSMA)", tumorDose: "~40-100 Gy", toxicDose: "Rinon: 27-40 Gy; Parotida: 20-30 Gy", nuclide: "Lu-177-PSMA-617", ref: "VISION" },
  { modality: "Radioembolizacion hepatica (HCC)", tumorDose: "~120-400 Gy", toxicDose: "Pulmon: 30 Gy; Estomago: 12.5 Gy", nuclide: "Y-90 microesferas", ref: "SIR-Spheres" },
  { modality: "Cancer tiroideo diferenciado", tumorDose: "~100-300 Gy", toxicDose: "Medula osea: 2 Gy (cuerpo entero)", nuclide: "I-131", ref: "Protocolos estandar" },
  { modality: "Metastasis oseas (dolor)", tumorDose: "~10-40 Gy", toxicDose: "Medula osea: 1.5-2 Gy", nuclide: "Sr-89 / Sm-153", ref: "Protocolos paliativos" },
  { modality: "Cancer de prostata oseo", tumorDose: "~10-20 Gy", toxicDose: "Medula osea: 2 Gy", nuclide: "Ra-223", ref: "ALSYMPCA" },
  { modality: "Linfoma no-Hodgkin", tumorDose: "~15-40 Gy", toxicDose: "Medula osea: 1.5 Gy", nuclide: "Y-90-ibritumomab", ref: "Zevalin" },
];

const reportingLevels = [
  { level: "Nivel 1 (Minimo)", desc: "Prescripcion basada en actividad", data: "Actividad (MBq), peso, fecha, radionuclido", shielding: "Blindaje estandar (tablas base)" },
  { level: "Nivel 2 (Recomendado)", desc: "Prescripcion basada en dosis estimada", data: "+ Dosimetria MIRD: actividad fuente, S-values, dosis tumor/organos", shielding: "Blindaje ajustado a dosis estimada" },
  { level: "Nivel 3 (Optimizado)", desc: "Dosimetria imagen-guided (3D voxel)", data: "+ SPECT/CT o PET/CT cuantitativo, farmacocinetica, DVH tumoral", shielding: "Blindaje personalizado por paciente" },
];

export default function ICRU96Dialog({ open, onClose }: ICRU96DialogProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [calcData, setCalcData] = useState({ activity: "7400", time: "1", distance: "1", gammaFactor: "0.054" });
  const [calcResult, setCalcResult] = useState<any>(null);

  const runCalc = () => {
    const A = parseFloat(calcData.activity) || 0; // MBq
    const t = parseFloat(calcData.time) || 0; // hours
    const d = parseFloat(calcData.distance) || 1; // meters
    const gamma = parseFloat(calcData.gammaFactor) || 0.054; // uSv m2 / (MBq h)

    const dose = (A * t * gamma) / (d * d); // uSv
    const dose_mSv = dose / 1000;

    setCalcResult({
      dose_uSv: dose.toFixed(2),
      dose_mSv: dose_mSv.toFixed(4),
      dose_mRem: (dose_mSv * 100).toFixed(2),
    });
  };

  const exportCSV = () => {
    const rows = [
      ["Radionuclido", "Emision", "E_avg_keV", "Aplicacion", "HVL_Pb_mm", "TVL_Pb_mm"],
      ...radionuclides.map(r => [r.name, r.emission, r.e_avg, r.app, r.hvl_pb, r.tvl_pb]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "icru_96_radionuclidos.csv";
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FlaskConical className="h-6 w-6 text-emerald-600" />
            ICRU Report 96 (2021) - Dosimetry-Guided Radiopharmaceutical Therapy
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Terapia guiada por dosimetria con radiofarmacos (RPT) - Blindajes y dosimetria interna
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pb-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview"><BookOpen className="h-4 w-4 mr-1" /> General</TabsTrigger>
            <TabsTrigger value="radionuclides"><AtomIcon className="h-4 w-4 mr-1" /> Radionuclidos</TabsTrigger>
            <TabsTrigger value="shielding"><Shield className="h-4 w-4 mr-1" /> Blindaje</TabsTrigger>
            <TabsTrigger value="mird"><Crosshair className="h-4 w-4 mr-1" /> MIRD</TabsTrigger>
            <TabsTrigger value="doses"><Activity className="h-4 w-4 mr-1" /> Dosis</TabsTrigger>
            <TabsTrigger value="calculator"><Calculator className="h-4 w-4 mr-1" /> Calculadora</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4 pr-2">
            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-sm mb-3">Documento</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Titulo:</span><span className="text-right max-w-[220px]">Dosimetry-Guided Radiopharmaceutical Therapy</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Organismo:</span><span>ICRU (2021)</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Editores:</span><span className="text-right">Sgouros, Bolch, Chiti, Dewaraja, Eberlein</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Paginas:</span><span>212</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">DOI:</span><span className="font-mono text-xs">10.1093/jicru/rdab106</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Framework:</span><span>MIRD / ICRP 53/80/128/30</span></div>
                  </div>
                </div>
                <div className="rounded-lg border p-4 bg-emerald-50">
                  <h3 className="font-semibold text-sm mb-2 text-emerald-800">Concepto Central</h3>
                  <p className="text-sm text-emerald-900">
                    Transicion de la prescripcion basada en actividad (MBq) a la prescripcion 
                    basada en dosis absorbida (Gy). La dosimetria guiada permite personalizar 
                    la terapia maximizando la dosis tumoral mientras se limita la toxicidad 
                    a organos criticos (rinon, medula osea, parotidas).
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white rounded p-2">
                      <div className="font-bold text-emerald-700">NETTER-1</div>
                      <div>Lu-177-DOTATATE</div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="font-bold text-emerald-700">VISION</div>
                      <div>Lu-177-PSMA-617</div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="font-bold text-emerald-700">ALSYMPCA</div>
                      <div>Ra-223</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-sm mb-3">Niveles de Reporte ICRU para RPT</h3>
                <div className="space-y-3">
                  {reportingLevels.map((r, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <Badge variant={i === 0 ? "outline" : i === 1 ? "secondary" : "default"} className="shrink-0 mt-0.5">
                        {r.level}
                      </Badge>
                      <div className="text-sm">
                        <div className="font-medium">{r.desc}</div>
                        <div className="text-muted-foreground">{r.data}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Blindaje: {r.shielding}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* RADIONUCLIDES TAB */}
            <TabsContent value="radionuclides" className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">Radionuclidos Terapeuticos Cubiertos</h3>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <FileDown className="h-4 w-4 mr-2" /> Exportar CSV
                </Button>
              </div>
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left p-2">Radionuclido</th>
                      <th className="text-left p-2">Emision</th>
                      <th className="text-right p-2">E_avg (keV)</th>
                      <th className="text-left p-2">Aplicacion</th>
                      <th className="text-right p-2">HVL Pb (mm)</th>
                      <th className="text-right p-2">TVL Pb (mm)</th>
                      <th className="text-left p-2">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {radionuclides.map((r, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-2 font-semibold">{r.name}</td>
                        <td className="p-2 text-xs">{r.emission}</td>
                        <td className="p-2 text-right font-mono">{r.e_avg}</td>
                        <td className="p-2 text-xs">{r.app}</td>
                        <td className="p-2 text-right font-mono">{r.hvl_pb}</td>
                        <td className="p-2 text-right font-mono">{r.tvl_pb}</td>
                        <td className="p-2 text-xs text-muted-foreground">{r.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg border p-4 bg-amber-50">
                <h3 className="font-semibold text-sm mb-2 text-amber-800">Notas de Blindaje</h3>
                <ul className="text-sm text-amber-900 space-y-1 list-disc pl-4">
                  <li><strong>Y-90 (beta puro):</strong> No requiere blindaje de plomo masivo. El riesgo principal es el Bremsstrahlung (radiacion de frenado) que requiere acrilico + plomo fino.</li>
                  <li><strong>Ra-223 (alpha):</strong> Blindaje externo minimo. El riesgo principal es la contaminacion por la cadena de decaimiento (emite Rn-219).</li>
                  <li><strong>Ac-225 (alpha):</strong> Cadena de decaimiento con 4 emisiones alpha. Requiere contencion estricta ademas de blindaje.</li>
                  <li><strong>Lu-177:</strong> Energia gamma 208 keV. Blindaje moderado. Tratamiento ambulatorio tipico.</li>
                  <li><strong>I-131:</strong> Energia gamma 364 keV. Requiere blindaje sustancial. Hospitalizacion para dosis terapeuticas altas.</li>
                </ul>
              </div>
            </TabsContent>

            {/* SHIELDING TAB */}
            <TabsContent value="shielding" className="space-y-3">
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left p-2">Area</th>
                      <th className="text-left p-2">Radionuclidos</th>
                      <th className="text-left p-2">Blindaje</th>
                      <th className="text-right p-2">Espesor</th>
                      <th className="text-left p-2">Material</th>
                      <th className="text-left p-2">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shieldingAreas.map((s, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-2 font-medium">{s.area}</td>
                        <td className="p-2 text-xs">{s.nuclides}</td>
                        <td className="p-2 text-xs">{s.shieldType}</td>
                        <td className="p-2 text-right font-mono">{s.thickness}</td>
                        <td className="p-2 text-xs">{s.material}</td>
                        <td className="p-2 text-xs text-muted-foreground">{s.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-sm mb-2">Formulas de Blindaje para Areas de Radiofarmacos</h3>
                <div className="text-sm space-y-2">
                  <p><strong>Dosis a 1 m por GBq·h:</strong> Gamma_factor = 0.5 × Σ(E_i × Y_i) [μSv·m² / (GBq·h)]</p>
                  <p><strong>Dosis en punto de interes:</strong> D = (A × t × Gamma) / d² [μSv]</p>
                  <p><strong>Actividad residual:</strong> A(t) = A₀ × e^(−λ×t) [MBq]</p>
                  <p><strong>Dosis acumulada (hospitalizacion):</strong> D_total = ∫₀^T [A(t) × Gamma / d²] dt [mSv]</p>
                  <p><strong>Distancia de seguridad:</strong> d = √(A × Gamma / P_límite) [m]</p>
                </div>
              </div>
            </TabsContent>

            {/* MIRD TAB */}
            <TabsContent value="mird" className="space-y-3">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-sm mb-3">Esquema MIRD - Formulas de Dosis Absorbida</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left p-2">Parametro</th>
                      <th className="text-left p-2 font-mono">Simbolo</th>
                      <th className="text-left p-2">Formula / Definicion</th>
                      <th className="text-left p-2">Unidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mirdSchema.map((m, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-2">{m.param}</td>
                        <td className="p-2 font-mono text-xs">{m.symbol}</td>
                        <td className="p-2 text-muted-foreground">{m.formula}</td>
                        <td className="p-2 font-mono text-xs">{m.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg border p-4 bg-blue-50">
                <h3 className="font-semibold text-sm mb-2 text-blue-800">Esquema de Calculo MIRD</h3>
                <div className="text-sm text-blue-900 space-y-2">
                  <p><strong>Paso 1:</strong> Cuantificacion de la actividad en cada organo fuente (SPECT/CT o PET/CT)</p>
                  <p><strong>Paso 2:</strong> Determinacion de la funcion temporal de actividad (farmacocinetica)</p>
                  <p><strong>Paso 3:</strong> Calculo de la actividad acumulada (integracion temporal)</p>
                  <p><strong>Paso 4:</strong> Obtencion de S-values especificos para cada par organo fuente → organo blanco</p>
                  <p><strong>Paso 5:</strong> Multiplicacion: Dosis = A_acumulada × S-value</p>
                  <p><strong>Paso 6:</strong> Comparacion con umbrales de toxicidad (rinon, medula, higado, etc.)</p>
                </div>
              </div>
            </TabsContent>

            {/* DOSES TAB */}
            <TabsContent value="doses" className="space-y-3">
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left p-2">Modalidad</th>
                      <th className="text-right p-2">Dosis tumoral (Gy)</th>
                      <th className="text-left p-2">Dosis toxica organo critico</th>
                      <th className="text-left p-2">Radionuclido</th>
                      <th className="text-left p-2">Referencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doseThresholds.map((d, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-2 font-medium">{d.modality}</td>
                        <td className="p-2 text-right font-mono">{d.tumorDose}</td>
                        <td className="p-2 text-xs">{d.toxicDose}</td>
                        <td className="p-2 text-xs font-semibold">{d.nuclide}</td>
                        <td className="p-2 text-xs"><Badge variant="outline">{d.ref}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg border p-4 bg-red-50">
                <h3 className="font-semibold text-sm mb-2 text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Organos Limitantes de Dosis
                </h3>
                <div className="grid grid-cols-3 gap-3 text-sm text-red-900">
                  <div className="bg-white rounded p-2">
                    <div className="font-bold">Rinones</div>
                    <div className="text-xs">Limite: 23-40 Gy (acumulado)</div>
                    <div className="text-xs text-muted-foreground">Relevante: Lu-177, Y-90</div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="font-bold">Medula Osea</div>
                    <div className="text-xs">Limite: 1.5-2 Gy (cuerpo entero)</div>
                    <div className="text-xs text-muted-foreground">Relevante: I-131, Ra-223, Sr-89</div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="font-bold">Parotidas / Lagrimales</div>
                    <div className="text-xs">Limite: 20-30 Gy</div>
                    <div className="text-xs text-muted-foreground">Relevante: Lu-177-PSMA</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* CALCULATOR TAB */}
            <TabsContent value="calculator" className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Calculadora de Dosis Externa por Paciente con Radiofarmaco</h3>
                  <div className="space-y-2">
                    <div className="space-y-1.5">
                      <Label>Actividad administrada (MBq)</Label>
                      <Input value={calcData.activity} onChange={(e) => setCalcData({...calcData, activity: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tiempo de exposicion (h)</Label>
                      <Input value={calcData.time} onChange={(e) => setCalcData({...calcData, time: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Distancia (m)</Label>
                      <Input value={calcData.distance} onChange={(e) => setCalcData({...calcData, distance: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Factor gamma (uSv·m² / GBq·h)</Label>
                      <Input value={calcData.gammaFactor} onChange={(e) => setCalcData({...calcData, gammaFactor: e.target.value})} />
                      <p className="text-xs text-muted-foreground">Ejemplos: I-131 = 0.22; Lu-177 = 0.054; Tc-99m = 0.030</p>
                    </div>
                    <Button onClick={runCalc} className="w-full"><Calculator className="h-4 w-4 mr-2" /> Calcular dosis</Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Resultado</h3>
                  {calcResult ? (
                    <div className="rounded-lg border p-4 bg-green-50">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">Dosis estimada al personal</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span>Dosis:</span><span className="font-mono font-bold">{calcResult.dose_uSv} uSv</span></div>
                        <div className="flex justify-between"><span>Dosis:</span><span className="font-mono font-bold">{calcResult.dose_mSv} mSv</span></div>
                        <div className="flex justify-between"><span>Dosis:</span><span className="font-mono font-bold">{calcResult.dose_mRem} mrem</span></div>
                      </div>
                      <Separator className="my-2" />
                      <p className="text-xs text-muted-foreground">
                        Formula: D = (A[GBq] × t[h] × Gamma) / d²[m²].
                        Limite anual ocupacional: 20 mSv (promedio 5 anos).
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border p-8 text-center text-muted-foreground text-sm">
                      Ingrese parametros y presione Calcular
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-sm mb-2">Factores Gamma Tipicos (uSv·m² / GBq·h)</h3>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div className="text-center p-2 bg-muted rounded"><div className="font-bold">I-131</div><div className="font-mono">0.22</div></div>
                  <div className="text-center p-2 bg-muted rounded"><div className="font-bold">Lu-177</div><div className="font-mono">0.054</div></div>
                  <div className="text-center p-2 bg-muted rounded"><div className="font-bold">Y-90</div><div className="font-mono">~0.001</div></div>
                  <div className="text-center p-2 bg-muted rounded"><div className="font-bold">Tc-99m</div><div className="font-mono">0.030</div></div>
                  <div className="text-center p-2 bg-muted rounded"><div className="font-bold">Cs-137</div><div className="font-mono">0.081</div></div>
                  <div className="text-center p-2 bg-muted rounded"><div className="font-bold">Co-60</div><div className="font-mono">0.35</div></div>
                  <div className="text-center p-2 bg-muted rounded"><div className="font-bold">Ra-223</div><div className="font-mono">~0.01</div></div>
                  <div className="text-center p-2 bg-muted rounded"><div className="font-bold">Sr-89</div><div className="font-mono">~0.002</div></div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="px-6 pb-4 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            ICRU Report 96 (2021) | DOI: 10.1093/jicru/rdab106 | RadShield-MX v13.0
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AtomIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" />
      <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" />
    </svg>
  );
}
