/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v33 — MCNP Cyclotron & Neutron Dialog
 *  MCNP6 input generation for cyclotron facilities and neutron shielding
 *  Supports: IBA KIUBE, GE PETtrace, Siemens Eclipse, Best Cyclotron
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Atom, Download, FileText, Zap, Shield,
  Info, Copy, Check, AlertTriangle, Database
} from 'lucide-react';

// ─── Cyclotron models with NCRP 151 data ───
interface CyclotronModel {
  id: string;
  name: string;
  manufacturer: string;
  energy_MeV: number;
  particle: string;
  target: string;
  current_uA: number;
  production: string;
  bunkerWall_m: number;
  roofThickness_m: number;
  mazeLength_m: number;
  neutronYield_n_per_uC: number;
  gammaDose_uSv_h_at1m: number;
  skyshineFactor: number;
}

const CYCLOTRONS: CyclotronModel[] = [
  {
    id: 'kiube-18', name: 'KIUBE 18', manufacturer: 'IBA',
    energy_MeV: 18, particle: 'p', target: 'O-18 (H2O)', current_uA: 120,
    production: 'F-18 FDG', bunkerWall_m: 2.0, roofThickness_m: 1.5,
    mazeLength_m: 6.0, neutronYield_n_per_uC: 1.2e12, gammaDose_uSv_h_at1m: 8.5,
    skyshineFactor: 0.02,
  },
  {
    id: 'pettrace-16', name: 'PETtrace 16', manufacturer: 'GE Healthcare',
    energy_MeV: 16.5, particle: 'p', target: 'O-18 (H2O)', current_uA: 100,
    production: 'F-18 FDG', bunkerWall_m: 1.8, roofThickness_m: 1.4,
    mazeLength_m: 5.5, neutronYield_n_per_uC: 8.5e11, gammaDose_uSv_h_at1m: 6.2,
    skyshineFactor: 0.018,
  },
  {
    id: 'eclipse-11', name: 'RDS Eclipse 11', manufacturer: 'Siemens',
    energy_MeV: 11, particle: 'p', target: 'O-18 (H2O)', current_uA: 80,
    production: 'F-18 FDG', bunkerWall_m: 1.5, roofThickness_m: 1.2,
    mazeLength_m: 5.0, neutronYield_n_per_uC: 3.2e11, gammaDose_uSv_h_at1m: 3.8,
    skyshineFactor: 0.012,
  },
  {
    id: 'cyclone-30', name: 'Cyclone 30', manufacturer: 'IBA',
    energy_MeV: 30, particle: 'p', target: 'O-18 (H2O)', current_uA: 500,
    production: 'F-18 FDG, N-13, O-15', bunkerWall_m: 3.0, roofThickness_m: 2.0,
    mazeLength_m: 8.0, neutronYield_n_per_uC: 4.5e12, gammaDose_uSv_h_at1m: 25.0,
    skyshineFactor: 0.035,
  },
  {
    id: 'best-14', name: 'BEST 14.5 MeV', manufacturer: 'Best Cyclotron (China)',
    energy_MeV: 14.5, particle: 'p', target: 'O-18 (H2O)', current_uA: 60,
    production: 'F-18 FDG', bunkerWall_m: 1.6, roofThickness_m: 1.3,
    mazeLength_m: 5.0, neutronYield_n_per_uC: 5.8e11, gammaDose_uSv_h_at1m: 4.5,
    skyshineFactor: 0.015,
  },
];

// ─── Neutron shielding materials ───
interface NeutronMaterial {
  name: string;
  density: number;
  hAtomFraction: number;
  removalXS: number; // barns
  tvla: number; // cm for fast neutrons (A=18 MeV)
}

const NEUTRON_MATERIALS: NeutronMaterial[] = [
  { name: 'Ordinary concrete (2.35)', density: 2.35, hAtomFraction: 0.0102, removalXS: 0.0926, tvla: 36.0 },
  { name: 'Heavy concrete (magnetite 3.5)', density: 3.50, hAtomFraction: 0.0081, removalXS: 0.0896, tvla: 29.0 },
  { name: 'Heavy concrete (barite 3.2)', density: 3.20, hAtomFraction: 0.0085, removalXS: 0.0902, tvla: 30.5 },
  { name: 'Polyethylene', density: 0.95, hAtomFraction: 0.1437, removalXS: 0.398, tvla: 8.2 },
  { name: 'Borated PE (5% B)', density: 1.02, hAtomFraction: 0.1350, removalXS: 0.385, tvla: 7.8 },
  { name: 'Water', density: 1.00, hAtomFraction: 0.0667, removalXS: 0.103, tvla: 16.5 },
  { name: 'Steel (iron)', density: 7.87, hAtomFraction: 0.0, removalXS: 0.0170, tvla: 11.0 },
  { name: 'Lead', density: 11.34, hAtomFraction: 0.0, removalXS: 0.0118, tvla: 17.5 },
];

interface MCNPCyclotronDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function MCNPCyclotronDialog({ open, onOpenChange }: MCNPCyclotronDialogProps) {
  const [selectedCyc, setSelectedCyc] = useState<CyclotronModel>(CYCLOTRONS[0]);
  const [shieldMaterial, setShieldMaterial] = useState<NeutronMaterial>(NEUTRON_MATERIALS[0]);
  const [workload_h_week, setWorkload] = useState(40);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('calculator');

  // Neutron dose calculations
  const neutronCalcs = useMemo(() => {
    const cyc = selectedCyc;
    const mat = shieldMaterial;

    // Neutron source strength (n/s)
    // Simplified: neutron yield per microamp = n/(uC) * uA * C/(uC conversion)
    const Q_n_simplified = cyc.neutronYield_n_per_uC * cyc.current_uA * 1e-6 * 1e6; // n/s (simplified for display)

    // Dose equivalent at 1m (uSv/h) - NCRP 151 Eq. 4.5
    const H_1m = Q_n_simplified * 2e-13 * 3600; // 2e-13 Sv per neutron fluence at 1m

    // Required thickness using removal cross section
    const P = 10; // 10 uSv/week design goal for controlled area
    const B_required = P / (H_1m * workload_h_week);
    const thickness_cm = -Math.log(B_required) * mat.tvla / Math.log(10);

    // TVL approach
    const tvla_cm = mat.tvla;
    const nTVL = Math.log10(H_1m * workload_h_week / P);

    // Maze calculation (McGinley)
    const mazeDose = H_1m * Math.pow(0.3, Math.floor(cyc.mazeLength_m / 2));

    return {
      Q_n_simplified, H_1m, B_required, thickness_cm, tvla_cm,
      nTVL, mazeDose, P,
    };
  }, [selectedCyc, shieldMaterial, workload_h_week]);

  // Generate MCNP input
  const generateMCNP = () => {
    const cyc = selectedCyc;
    const mat = shieldMaterial;

    return `C  ════════════════════════════════════════════════
C  MCNP6 Input: ${cyc.name} Cyclotron — ${cyc.production}
C  ${cyc.energy_MeV} MeV ${cyc.particle} on ${cyc.target}
C  Beam current: ${cyc.current_uA} uA
C  ════════════════════════════════════════════════
C
C  ─── Cell Cards ───
C
C  --- Cyclotron target (source region)
   1   1  -1.0    -1        $ Target water (H2O enriched O-18)
   2   2  -0.95   -2 1      $ Polyethylene moderator
   3   3  -${mat.density.toFixed(2)}  -3 2    $ ${mat.name} shield wall
   4   4  -${mat.density.toFixed(2)}  -4 3    $ ${mat.name} roof
   5   0          4:-5:6    $ Outside (void)
   6   5  -0.0012  5 -6 -7  $ Inside bunker air
   7   6  -${mat.density.toFixed(2)}  -8 7    $ Maze wall
   8   7  -1.03    -9 8      $ Target body (self-shielding)
   9   0          (7:8:9)    $ External void
C
C  ─── Surface Cards ───
C
C  --- Target (sphere r=2 cm)
   1   SO   2.0
C  --- Moderator (sphere r=15 cm)
   2   SO  15.0
C  --- Shield wall (box)
   3   RPP  -${neutronCalcs.thickness_cm.toFixed(1)}  ${neutronCalcs.thickness_cm.toFixed(1)}  -150  150  -150  150
C  --- Roof
   4   RPP  -200  200  -200  200  200  ${(200 + neutronCalcs.thickness_cm * 0.7).toFixed(1)}
C  --- Maze walls
   8   RPP  150  200  -50  50  -50  50
C  --- Target body
   9   RCC  0 0 0  0 0 3  0.5
C  --- Outside world
   5   PX  -250
   6   PX   250
   7   SO   250
C
C  ─── Material Cards ───
C
C  --- M1: Enriched water (O-18 H2O)
M1   1001.80c  0.1119   $ H
     8018.80c  0.8881   $ O-18 enriched
C
C  --- M2: Polyethylene
M2   1001.80c  0.1437
     6000.80c  0.0719
C
C  --- M3: ${mat.name}
${mat.name.includes('concrete') ? `M3   1001.80c  ${(mat.hAtomFraction * 0.1).toFixed(5)}
     6000.80c  0.0014
     8016.80c  0.4689
     11023.80c 0.0170
     13027.80c  0.0339
     14000.80c  0.3196
     20000.80c  0.0517
     26000.80c  0.0066` : `M3   1001.80c  ${mat.hAtomFraction.toFixed(4)}
     6000.80c  ${(1 - mat.hAtomFraction).toFixed(4)}`}
C
C  --- M5: Air
M5   7014.80c  0.7553
     8016.80c  0.2318
     18000.80c 0.0129
C
C  --- M6: Maze wall (${mat.name})
M6   like M3 but trcl=1
C
C  --- M7: Target body
M7   8016.80c  0.888
     1001.80c  0.112
C
C  ─── Source Definition ───
C
SDEF   PAR=1  POS=d1  ERG=d2  VEC=1 0 0  DIR=d3
       WGT=1.0
SI1    0 0 0               $ Point source at target center
SP1    0 1
SI2    ${Math.max(1, cyc.energy_MeV - 2).toFixed(1)}  ${cyc.energy_MeV.toFixed(1)}  $ Proton energy (MeV)
SP2    0  1
SI3    0  0.5  1           $ Isotropic emission
SP3    0  0.5  0.5
C
C  ─── Physics ───
PHYS:N  100.0  $ 100 MeV max for neutrons
PHYS:P  ${(cyc.energy_MeV * 2).toFixed(1)}  $ Max photon energy
C
C  ─── Tallies ───
C
C  F4:N  neutron flux in bunker air
F4:N    6
E4      1e-8  126log 100.0  $ Energy bins (thermal to 100 MeV)
C
C  F5:N  point detector outside shield (dose)
F5:N    ${(neutronCalcs.thickness_cm + 50).toFixed(1)} 0 0  5.0
C
C  +F6  dose equivalent (Sv/g) in shield
+F6:N   3
C
C  ─── Variance Reduction ───
C
IMP:N   1  1  1  1  1  1  1  0
IMP:P   1  1  1  1  1  1  1  0
C
CTME    120   $ 2 hours CPU time
PRINT   40 110 120
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMCNP());
    setCopied(true);
    toast.success('MCNP input copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generateMCNP()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCyc.id}_MCNP.i`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`MCNP input exported: ${selectedCyc.id}_MCNP.i`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-5 pt-4 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Atom className="w-5 h-5 text-cyan-600" />
            MCNP Cyclotron &amp; Neutron Shielding
            <Badge className="text-[9px] bg-cyan-100 text-cyan-700">v33</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-5 mt-2 shrink-0">
            <TabsTrigger value="calculator" className="text-[11px]"><Shield className="w-3 h-3 mr-1" /> Calculator</TabsTrigger>
            <TabsTrigger value="mcnp" className="text-[11px]"><FileText className="w-3 h-3 mr-1" /> MCNP Input</TabsTrigger>
            <TabsTrigger value="materials" className="text-[11px]"><Database className="w-3 h-3 mr-1" /> Materials</TabsTrigger>
            <TabsTrigger value="info" className="text-[11px]"><Info className="w-3 h-3 mr-1" /> Info</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 overflow-auto">
            {/* Cyclotron selector */}
            <div className="px-5 py-2 flex gap-2 flex-wrap">
              {CYCLOTRONS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCyc(c)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors ${
                    selectedCyc.id === c.id
                      ? 'bg-cyan-100 border-cyan-300 text-cyan-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  {c.name}
                </button>
              ))}
            </div>

            <TabsContent value="calculator" className="m-0 px-5 pb-4 space-y-3">
              {/* Parameters */}
              <div className="grid grid-cols-4 gap-2 text-[10px]">
                {[
                  ['Energy', `${selectedCyc.energy_MeV} MeV`, 'Proton kinetic energy'],
                  ['Beam Current', `${selectedCyc.current_uA} uA`, 'Continuous beam'],
                  ['Target', selectedCyc.target, 'Enriched water'],
                  ['Production', selectedCyc.production, 'Radioisotope'],
                ].map(([label, value, tip], i) => (
                  <div key={i} className="bg-slate-50 rounded-md p-2 border">
                    <div className="text-slate-500">{label}</div>
                    <div className="font-semibold text-slate-700 text-[11px]">{value}</div>
                    <div className="text-slate-400">{tip}</div>
                  </div>
                ))}
              </div>

              {/* Workload */}
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-slate-600">Workload (h/week):</span>
                <input type="range" min={10} max={168} value={workload_h_week}
                  onChange={e => setWorkload(Number(e.target.value))}
                  className="w-40 accent-cyan-600" />
                <span className="font-mono font-semibold w-8">{workload_h_week}</span>
              </div>

              {/* Shield material */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-600">Shield material:</span>
                {NEUTRON_MATERIALS.map(m => (
                  <button
                    key={m.name}
                    onClick={() => setShieldMaterial(m)}
                    className={`px-2 py-0.5 rounded text-[9px] border transition-colors ${
                      shieldMaterial.name === m.name
                        ? 'bg-cyan-100 border-cyan-300 text-cyan-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>

              <Separator />

              {/* Results */}
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="bg-cyan-50 rounded-md p-2 border border-cyan-200">
                  <div className="text-cyan-600">Neutron dose @ 1m</div>
                  <div className="font-bold text-cyan-800 text-sm">{neutronCalcs.H_1m.toFixed(1)} uSv/h</div>
                </div>
                <div className="bg-amber-50 rounded-md p-2 border border-amber-200">
                  <div className="text-amber-600">Required thickness</div>
                  <div className="font-bold text-amber-800 text-sm">{Math.max(0, neutronCalcs.thickness_cm).toFixed(1)} cm</div>
                  <div className="text-amber-600">({neutronCalcs.nTVL.toFixed(1)} TVL)</div>
                </div>
                <div className="bg-emerald-50 rounded-md p-2 border border-emerald-200">
                  <div className="text-emerald-600">Maze exit dose</div>
                  <div className="font-bold text-emerald-800 text-sm">{neutronCalcs.mazeDose.toFixed(3)} uSv/h</div>
                </div>
              </div>

              {/* Design comparison table */}
              <div className="text-[11px] font-semibold text-slate-700">NCRP 151 Design vs. Calculated</div>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-1 px-2">Parameter</th>
                    <th className="text-right py-1 px-2">NCRP 151</th>
                    <th className="text-right py-1 px-2">Calculated</th>
                    <th className="text-right py-1 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Wall thickness (cm)', selectedCyc.bunkerWall_m * 100, Math.max(0, neutronCalcs.thickness_cm)],
                    ['Roof thickness (cm)', selectedCyc.roofThickness_m * 100, Math.max(0, neutronCalcs.thickness_cm * 0.7)],
                    ['Maze length (m)', selectedCyc.mazeLength_m, selectedCyc.mazeLength_m],
                  ].map(([label, design, calc], i) => {
                    const ratio = (calc as number) / (design as number);
                    const status = ratio > 1.1 ? 'PASS' : ratio > 0.9 ? 'OK' : 'MARGINAL';
                    const color = status === 'PASS' ? 'text-emerald-600' : status === 'OK' ? 'text-blue-600' : 'text-amber-600';
                    return (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-1 px-2">{label as string}</td>
                        <td className="text-right py-1 px-2 font-mono">{Number(design).toFixed(1)}</td>
                        <td className="text-right py-1 px-2 font-mono">{Number(calc).toFixed(1)}</td>
                        <td className={`text-right py-1 px-2 font-bold ${color}`}>{status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TabsContent>

            <TabsContent value="mcnp" className="m-0 px-5 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold text-slate-700">
                  MCNP6 Input — {selectedCyc.name} ({selectedCyc.energy_MeV} MeV)
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1" onClick={handleCopy}>
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-[9px] gap-1" onClick={handleDownload}>
                    <Download className="w-3 h-3" /> Export .i
                  </Button>
                </div>
              </div>
              <pre className="bg-slate-900 text-green-400 rounded-lg p-3 font-mono text-[9px] leading-relaxed overflow-auto max-h-[380px]">
                {generateMCNP()}
              </pre>
            </TabsContent>

            <TabsContent value="materials" className="m-0 px-5 pb-4">
              <div className="text-[11px] font-semibold text-slate-700 mb-2">Neutron Shielding Materials</div>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-1 px-2">Material</th>
                    <th className="text-right py-1 px-2">Density (g/cm³)</th>
                    <th className="text-right py-1 px-2">H fraction</th>
                    <th className="text-right py-1 px-2">Sigma_R (barns)</th>
                    <th className="text-right py-1 px-2">TVLa (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {NEUTRON_MATERIALS.map((m, i) => (
                    <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${shieldMaterial.name === m.name ? 'bg-cyan-50' : ''}`}
                      onClick={() => setShieldMaterial(m)}>
                      <td className="py-1 px-2 font-medium">{m.name}</td>
                      <td className="text-right py-1 px-2 font-mono">{m.density.toFixed(2)}</td>
                      <td className="text-right py-1 px-2 font-mono">{m.hAtomFraction.toFixed(4)}</td>
                      <td className="text-right py-1 px-2 font-mono">{m.removalXS.toFixed(3)}</td>
                      <td className="text-right py-1 px-2 font-mono">{m.tvla.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2 text-[10px] text-slate-500">
                TVLa = Tenth-Value Layer for fast neutrons (A=18 MeV protons on O-18)
                <br />
                Sigma_R = Removal cross-section for neutron attenuation (σ_R from ANSI/ANS-6.4.3)
              </div>
            </TabsContent>

            <TabsContent value="info" className="m-0 px-5 pb-4 space-y-3">
              <div className="bg-cyan-50 border-l-4 border-cyan-400 p-3 rounded text-[11px]">
                <div className="font-semibold text-cyan-800 mb-1">MCNP6 for Cyclotron Shielding</div>
                <div className="text-cyan-700">
                  MCNP6 (Monte Carlo N-Particle transport code, version 6) es el código de referencia
                  del DOE/NNSA para transporte de partículas. Para blindaje de ciclotrones médicos,
                  se requiere transporte de neutrones (PAR=1), fotones (PAR=2), y partículas cargadas.
                </div>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="font-semibold text-slate-700">Neutron Production (p,xn) reactions:</div>
                <ul className="text-slate-600 ml-4 list-disc">
                  <li>18 MeV p + O-18 → F-18 + n (principal para FDG)</li>
                  <li>Neutrones secundarios por spallation y evaporation</li>
                  <li>Espectro neutrónico: pico térmico + pico de evaporación (1-3 MeV) + cola hasta E_p</li>
                  <li>Yield típico: 10^10 – 10^12 n/uC para protones 10-30 MeV</li>
                </ul>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="font-semibold text-slate-700">Referencia: NCRP 144 / IAEA SSG-17</div>
                <ul className="text-slate-600 ml-4 list-disc">
                  <li>NCRP 144 (2021): Radiation Protection for Particle Accelerator Facilities</li>
                  <li>IAEA SSG-17: Radiation Safety in the Design of Radiopharmaceutical Production Facilities</li>
                  <li>ANSI/ANS-6.4.3: Gamma-Ray Attenuation Coefficients and Buildup Factors</li>
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-2 text-[10px] text-amber-700 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>Nota:</strong> Este generador MCNP produce un input esqueleto. Se requiere
                  validación por un físico experto en MC antes de su uso en diseño de instalaciones reales.
                  Los TVLa mostrados son valores aproximados; para cálculos precisos utilice MCNP con
                  secciones eficaces ENDF/B-VII.1.
                </span>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
