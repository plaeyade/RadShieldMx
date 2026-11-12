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
  Shield,
  Zap,
  Ruler,
  Info,
  AlertTriangle,
  CheckCircle2,
  FileDown,
} from "lucide-react";
import { barreraMV, MATERIALES_MV, NOMBRE_MATERIAL } from "@/lib/calculadorasNormativas";
import type { MaterialNCRP151 } from "@/lib/ncrp151";

interface VersaHD15MVDialogProps {
  open: boolean;
  onClose: () => void;
}

const techSpecs = [
  { param: "Fabricante", value: "Elekta AB", notes: "Stockholm, Sweden" },
  { param: "Modelo", value: "Versa HD", notes: "Acelerador lineal" },
  { param: "Energia fotones", value: "6 / 10 / 15 MV", notes: "Seleccionable electronica" },
  { param: "Energia electrones", value: "6 / 9 / 12 / 15 MeV", notes: "Con applicadores" },
  { param: "Tasa dosis max (modo normal)", value: "600 cGy/min", notes: "A 100 cm SSD" },
  { param: "Tasa dosis FFF 10 MV", value: "2400 cGy/min", notes: "Flatness Filter Free" },
  { param: "Tasa dosis FFF 6 MV", value: "1400 cGy/min", notes: "Flatness Filter Free" },
  { param: "SSD nominal", value: "100 cm", notes: "Fuente a isocentro" },
  { param: "MLC", value: "Agility 160 hojas", notes: "Resolucion 1 mm" },
  { param: "Campo maximo", value: "40 x 40 cm2", notes: "A 100 cm SSD" },
  { param: "Campo minimo", value: "0.5 x 0.5 cm2", notes: "Con Agility" },
  { param: "Imaging", value: "CBCT / XVI / iViewGT", notes: "kV + MV portal" },
  { param: "Tecnicas", value: "3D-CRT / IMRT / VMAT / SRS / SBRT / FFF", notes: "Incl. EMT opcional" },
];

const shieldingData = {
  tvl: {
    concrete: 44,
    lead: 5.7,
    steel: 11,
    concreteDisp: 35,
  },
  hvl: {
    concrete: 13.2,
    lead: 1.7,
    steel: 3.3,
  },
  occupancyFactors: [
    { area: "Control / Consola", t: "1", type: "Controlada" },
    { area: "Pasillo / Vestibulo", t: "1/2 - 1/5", type: "Controlada" },
    { area: "Sala de espera", t: "1/20", type: "No controlada" },
    { area: "Estacionamiento", t: "1/20 - 1/40", type: "No controlada" },
    { area: "Terreno libre", t: "0", type: "No controlada" },
    { area: "Oficinas / Taller", t: "1/2 - 1", type: "Controlada" },
    { area: "Vivienda / Hotel", t: "1", type: "No controlada" },
  ],
  useFactors: [
    { direction: "Gantry 0° (pared lateral)", u: "0.25" },
    { direction: "Gantry 90/270° (otras paredes)", u: "0.25" },
    { direction: "Gantry 0-10° (techo)", u: "0.05" },
    { direction: "Gantry 170-180° (piso)", u: "0.25" },
  ],
};

const exampleProjects = [
  { name: "Ejemplo 1", primary: 230, secondary: 180, ceiling: 180, door: "Pb+BPE 45 mm", workload: "Alta", notes: "Hospital privado CDMX" },
  { name: "Ejemplo 2", primary: 240, secondary: 170, ceiling: 160, door: "Laberinto + Pb 25 mm", workload: "Media", notes: "Centro oncologico" },
  { name: "Ejemplo 4", primary: 230, secondary: 190, ceiling: 190, door: "Pb+BPE 38 mm", workload: "Estandar", notes: "Hospital general" },
  { name: "Ejemplo 5", primary: 230, secondary: 180, ceiling: 170, door: "Laberinto", workload: "Alta IMRT", notes: "Instituto nacional" },
];

export default function VersaHD15MVDialog({ open, onClose }: VersaHD15MVDialogProps) {
  const [activeTab, setActiveTab] = useState("specs");
  const [calcData, setCalcData] = useState({
    w: "400",
    p: "0.02",
    d: "5.5",
    u: "0.25",
    t_occ: "0.5",
    material: "concrete",
  });
  const [result, setResult] = useState<any>(null);

  // Fase 8a: antes B = P(mSv)·d²/(W(Gy)·U·T) sin el factor 10⁻³ (≈ 3 TVL de menos) y el factor IMRT se aplicaba a la
  // primaria. Ahora: NCRP 151 con `barreraMV` (Ec. 2.1/2.3, TVL₁/TVLₑ de la Tabla B.2 a 15 MV); el factor IMRT (Ec. 3.6)
  // sólo afecta a la fuga de la barrera secundaria.
  const runCalculation = () => {
    const W = parseFloat(calcData.w) || 0;
    const P = parseFloat(calcData.p) || 0;
    const d = parseFloat(calcData.d) || 0;
    const U = parseFloat(calcData.u) || 0;
    const T = parseFloat(calcData.t_occ) || 0;
    if (W <= 0 || P <= 0 || d <= 0 || U <= 0 || !(T > 0 && T <= 1)) {
      setResult({ error: "W, P, d y U deben ser mayores que cero y T debe estar en (0, 1]" });
      return;
    }
    const material = calcData.material as MaterialNCRP151;
    const pri = barreraMV({ tipo: "primaria", haces: [{ energia: 15, W_Gy_semana: W }], material, P_mSv_semana: P, T, U, d_m: d });
    const sec = barreraMV({ tipo: "secundaria", haces: [{ energia: 15, W_Gy_semana: W, fraccionIMRT: 1, factorIMRT: 2.8 }], material, P_mSv_semana: P, T, U, d_m: d });
    const prim = pri.componentes[0];
    setResult({
      B: prim.B_requerida.toExponential(3),
      n: (prim.B_requerida >= 1 ? 0 : Math.log10(1 / prim.B_requerida)).toFixed(2),
      t: pri.espesor_cm.toFixed(1),
      t_rounded: pri.espesorRedondeado_cm.toFixed(1),
      cumple: pri.cumple,
      sec_t: sec.espesor_cm.toFixed(1),
      sec_t_rounded: sec.espesorRedondeado_cm.toFixed(1),
      sec_comp: sec.componentes.map((c) => `${c.nombre}: ${c.espesor_cm.toFixed(1)} cm`).join(" · "),
    });
  };

  const exportCSV = () => {
    const headers = ["Parametro", "Valor"];
    const rows = [
      ["Equipo", "Elekta Versa HD 15 MV"],
      ["W (Gy/sem)", calcData.w],
      ["P (mSv/sem)", calcData.p],
      ["d (m)", calcData.d],
      ["U", calcData.u],
      ["T", calcData.t_occ],
      ["Material", calcData.material],
      ["B", result?.B || ""],
      ["n", result?.n || ""],
      ["t calculado (cm)", result?.t || ""],
      ["t propuesto (cm)", result?.t_rounded || ""],
    ];
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "versa_hd_15mv_calculo.csv";
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="h-6 w-6 text-amber-500" />
            Elekta Versa HD 15 MV - Bunker Acelerador Lineal
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Memoria analitica de blindajes para megavoltaje segun NCRP 151 / IAEA SRS 47
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="specs">
              <BookOpen className="h-4 w-4 mr-1" /> Especificaciones
            </TabsTrigger>
            <TabsTrigger value="shielding">
              <Shield className="h-4 w-4 mr-1" /> Blindaje
            </TabsTrigger>
            <TabsTrigger value="examples">
              <Ruler className="h-4 w-4 mr-1" /> Ejemplos
            </TabsTrigger>
            <TabsTrigger value="calculator">
              <Calculator className="h-4 w-4 mr-1" /> Calculadora
            </TabsTrigger>
            <TabsTrigger value="references">
              <Info className="h-4 w-4 mr-1" /> Referencias
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4 pr-2">
            {/* SPECS TAB */}
            <TabsContent value="specs" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" /> Datos del Equipo
                  </h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {techSpecs.map((s, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-1.5 pr-4 text-muted-foreground">{s.param}</td>
                          <td className="py-1.5 font-medium">{s.value}</td>
                          <td className="py-1.5 pl-2 text-xs text-muted-foreground">{s.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 bg-amber-50">
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" /> Consideraciones de Blindaje
                    </h3>
                    <ul className="text-sm space-y-1.5 list-disc pl-4">
                      <li>TVL concreto 15 MV = <strong>44 cm</strong> (NCRP 151 Tabla B.2)</li>
                      <li>TVL plomo 15 MV = <strong>5.7 cm</strong> (haz saturado)</li>
                      <li>TVL acero 15 MV = <strong>11 cm</strong></li>
                      <li>HVL concreto 15 MV = <strong>13.2 cm</strong></li>
                      <li>Fraccion dispersion 90° (alpha) = <strong>9.0E-04</strong></li>
                      <li>Factor fuga cabezal max = <strong>0.001</strong> (0.1%)</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold text-sm mb-2">Tecnicas y Carga de Trabajo</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>3D-CRT convencional:</span>
                        <Badge variant="outline">~1x dosis prescrita</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>IMRT estatico:</span>
                        <Badge variant="outline">~3.5x dosis prescrita</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>VMAT / RapidArc:</span>
                        <Badge variant="outline">~2.8x dosis prescrita</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>SRS / SBRT (hipofracc.):</span>
                        <Badge variant="outline">~4x dosis prescrita</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>FFF (VMAT/SRS):</span>
                        <Badge variant="outline">~2.5x dosis prescrita</Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Factor IMRT tipico (ponderado):</span>
                        <Badge>2.5 - 5.0</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* SHIELDING TAB */}
            <TabsContent value="shielding" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-sm mb-3">Valores HVL / TVL (15 MV)</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1">Material</th>
                        <th className="text-right py-1">HVL (cm)</th>
                        <th className="text-right py-1">TVL (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b"><td className="py-1">Concreto</td><td className="text-right">13.2</td><td className="text-right font-semibold">44</td></tr>
                      <tr className="border-b"><td className="py-1">Acero</td><td className="text-right">3.3</td><td className="text-right font-semibold">11</td></tr>
                      <tr className="border-b"><td className="py-1">Plomo</td><td className="text-right">1.7</td><td className="text-right font-semibold">5.7</td></tr>
                      <tr><td className="py-1">Concreto (disp.)</td><td className="text-right">-</td><td className="text-right font-semibold">35</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-sm mb-3">Factores de Ocupacion (T)</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1">Area</th>
                        <th className="text-right py-1">T</th>
                        <th className="text-left py-1 pl-2">Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shieldingData.occupancyFactors.map((o, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-1">{o.area}</td>
                          <td className="text-right font-mono">{o.t}</td>
                          <td className="pl-2">
                            <Badge variant={o.type === "Controlada" ? "secondary" : "outline"} className="text-xs">
                              {o.type}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold text-sm mb-3">Factores de Uso (U)</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1">Direccion</th>
                        <th className="text-right py-1">U</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shieldingData.useFactors.map((u, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-1">{u.direction}</td>
                          <td className="text-right font-mono">{u.u}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="rounded-lg border p-4 bg-blue-50">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" /> Metodo de Calculo - NCRP 151
                </h3>
                <div className="text-sm space-y-2">
                  <p><strong>Barrera primaria:</strong> B = P / (W * U * T) ; t = TVL * log10(1/B)</p>
                  <p><strong>Barrera secundaria (dispersion):</strong> B_disp = (P / alpha * W * T) * (d_sca / d_sec)^2 * (d_sca / 1m)^2</p>
                  <p><strong>Barrera secundaria (fuga):</strong> B_fuga = (P / 0.001 * W * T) * (d_pri / d_sec)^2</p>
                  <p className="text-muted-foreground">Para energias &gt; 10 MV considerar neutrones y gamma de captura en la puerta del laberinto.</p>
                </div>
              </div>
            </TabsContent>

            {/* EXAMPLES TAB */}
            <TabsContent value="examples" className="space-y-4">
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left p-3">Proyecto</th>
                      <th className="text-right p-3">Primaria (cm)</th>
                      <th className="text-right p-3">Secundaria (cm)</th>
                      <th className="text-right p-3">Techo (cm)</th>
                      <th className="text-left p-3">Puerta</th>
                      <th className="text-left p-3">Carga</th>
                      <th className="text-left p-3">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exampleProjects.map((ex, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-3 font-medium">{ex.name}</td>
                        <td className="p-3 text-right font-mono">{ex.primary}</td>
                        <td className="p-3 text-right font-mono">{ex.secondary}</td>
                        <td className="p-3 text-right font-mono">{ex.ceiling}</td>
                        <td className="p-3">{ex.door}</td>
                        <td className="p-3"><Badge variant="outline">{ex.workload}</Badge></td>
                        <td className="p-3 text-muted-foreground">{ex.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-sm mb-2">Rangos tipicos NCRP 151 para 15 MV</h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="font-semibold">Primaria</div>
                    <div className="text-2xl font-bold text-primary">180-250</div>
                    <div className="text-muted-foreground">cm concreto</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="font-semibold">Secundaria</div>
                    <div className="text-2xl font-bold text-primary">120-160</div>
                    <div className="text-muted-foreground">cm concreto</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="font-semibold">Techo</div>
                    <div className="text-2xl font-bold text-primary">140-190</div>
                    <div className="text-muted-foreground">cm concreto</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="font-semibold">Puerta laberinto</div>
                    <div className="text-2xl font-bold text-primary">5-15</div>
                    <div className="text-muted-foreground">mm Pb + BPE</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* CALCULATOR TAB */}
            <TabsContent value="calculator" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Parametros de entrada</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="w">W (Gy/sem)</Label>
                      <Input id="w" value={calcData.w} onChange={(e) => setCalcData({ ...calcData, w: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="p">P (mSv/sem)</Label>
                      <Input id="p" value={calcData.p} onChange={(e) => setCalcData({ ...calcData, p: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="d">d (m)</Label>
                      <Input id="d" value={calcData.d} onChange={(e) => setCalcData({ ...calcData, d: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="u">U</Label>
                      <Input id="u" value={calcData.u} onChange={(e) => setCalcData({ ...calcData, u: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="t">T</Label>
                      <Input id="t" value={calcData.t_occ} onChange={(e) => setCalcData({ ...calcData, t_occ: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="vhd-material">Material (NCRP 151 Tabla B.2)</Label>
                      <select id="vhd-material" className="h-9 w-full rounded-md border border-input px-2 text-sm" value={calcData.material} onChange={(e) => setCalcData({ ...calcData, material: e.target.value })}>
                        {MATERIALES_MV.map((m) => <option key={m} value={m}>{NOMBRE_MATERIAL[m]}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={runCalculation} className="flex-1">
                      <Calculator className="h-4 w-4 mr-2" /> Calcular
                    </Button>
                    <Button variant="outline" onClick={exportCSV}>
                      <FileDown className="h-4 w-4 mr-2" /> CSV
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Resultados</h3>
                  {result ? (
                    result.error ? (
                      <div className="rounded-lg border p-4 bg-red-50 text-red-700 text-sm">
                        {result.error}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-lg border p-4 bg-green-50">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-green-800">Barrera Primaria (modo convencional)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>B = <span className="font-mono font-semibold">{result.B}</span></div>
                            <div>n = <span className="font-mono font-semibold">{result.n}</span></div>
                            <div>t calc. = <span className="font-mono font-semibold">{result.t} cm</span></div>
                            <div>t prop. = <span className="font-mono font-semibold text-lg" data-testid="vhd-primaria">{result.t_rounded} cm</span></div>
                            <div className="col-span-2 text-xs">{result.cumple ? "Cumple: T·K ≤ P con el espesor propuesto" : "No cumple"}</div>
                          </div>
                        </div>
                        <div className="rounded-lg border p-4 bg-amber-50">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            <span className="font-semibold text-amber-800">Barrera secundaria con IMRT (C_I = 2.8 en la fuga, Ec. 3.6)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="col-span-2 text-xs">{result.sec_comp}</div>
                            <div>t calc. = <span className="font-mono">{result.sec_t} cm</span></div>
                            <div>t prop. = <span className="font-mono font-semibold text-lg">{result.sec_t_rounded} cm</span></div>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="rounded-lg border p-8 text-center text-muted-foreground text-sm">
                      Ingrese los parametros y presione Calcular
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* REFERENCES TAB */}
            <TabsContent value="references" className="space-y-3">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-sm mb-3">Referencias bibliograficas obligatorias</h3>
                <ol className="text-sm space-y-2 list-decimal pl-4">
                  <li>NCRP (2005). <em>Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy Facilities</em>. NCRP Report No. 151.</li>
                  <li>IAEA (2006). <em>Radiation Protection in the Design of Radiotherapy Facilities</em>. Safety Reports Series No. 47.</li>
                  <li>CNSNS (2023). <em>Guia para la elaboracion de la Memoria Analitica de Blindajes</em>. G-001-01-2023.</li>
                  <li>Secretaria de Energia (2020). <em>Reglamento General de Seguridad Radiologica</em>. DOF 23/12/2020.</li>
                </ol>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold text-sm mb-3">Referencias del equipo y normas tecnicas</h3>
                <ol className="text-sm space-y-2 list-decimal pl-4" start={5}>
                  <li>Elekta (2023). <em>Versa HD Technical Specifications</em>. Ref. 1003463 Rev. 4.</li>
                  <li>Elekta (2024). <em>Versa HD User Guide: Radiation Safety and Shielding</em>. Ref. 1005122 Rev. 1.</li>
                  <li>IEC 60601-2-1 (2020). <em>Medical electrical equipment - Part 2-1: Electron accelerators 1-50 MeV</em>.</li>
                  <li>McGinley, P.H. (2002). <em>Shielding Techniques for Radiation Oncology Facilities</em>. 2nd ed. Medical Physics Publishing.</li>
                  <li>NOM-008-NUCL-2024. <em>Límites de contaminación radiactiva y criterios para su control</em>. DOF 24-05-2024.</li>
                  <li>NOM-030-NUCL-2011. <em>Requisitos de seguridad para unidades de teleterapia con AL</em>.</li>
                </ol>
              </div>
              <div className="rounded-lg border p-4 bg-blue-50">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Las referencias [1] y [2] son obligatorias para presentacion ante la CNSNS. 
                  La referencia [3] es especifica de la CNSNS-Mexico. Las referencias [5] y [6] son documentacion 
                  del fabricante Elekta especifica para el modelo Versa HD.
                </p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="px-6 pb-4 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            RadShield-MX v12.9 | NCRP 151 / IAEA SRS 47 / CNSNS
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
