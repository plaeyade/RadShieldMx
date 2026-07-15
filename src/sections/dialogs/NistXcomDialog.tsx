/**
 * v100: NIST XCOM — X-Ray Attenuation Coefficients Database
 * Interactive attenuation table for shielding materials
 * Source: https://physics.nist.gov/cgi-bin/Xcom/xcom3_1
 */
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SHIELDING_MATERIALS, findMaterial, calculateRequiredThickness, calculateTransmission, interpolateAttenuation, getMaterialOptions } from '@/lib/xcomAttenuation';
import { useAppStore } from '@/stores/appStore';
import { Atom, Calculator, ArrowRight, Database, BookOpen } from 'lucide-react';

export default function NistXcomDialog() {
  const open = useAppStore(s => s.dialogs.nistXcom?.open ?? false);
  const close = () => useAppStore.getState().close('nistXcom');

  const [selectedMaterial, setSelectedMaterial] = useState('PB');
  const [energyInput, setEnergyInput] = useState('0.1');
  const [thicknessInput, setThicknessInput] = useState('2');
  const [targetB, setTargetB] = useState('0.001');

  const mat = findMaterial(selectedMaterial);
  const energy_MeV = parseFloat(energyInput) || 0;

  const interp = useMemo(() => {
    if (!mat || energy_MeV <= 0) return null;
    return interpolateAttenuation(selectedMaterial, energy_MeV);
  }, [selectedMaterial, energy_MeV]);

  const transForThickness = useMemo(() => {
    if (!mat || energy_MeV <= 0) return null;
    return calculateTransmission(selectedMaterial, energy_MeV, parseFloat(thicknessInput) || 0);
  }, [selectedMaterial, energy_MeV, thicknessInput]);

  const thicknessForB = useMemo(() => {
    if (!mat || energy_MeV <= 0) return null;
    return calculateRequiredThickness(selectedMaterial, energy_MeV, parseFloat(targetB) || 0.001);
  }, [selectedMaterial, energy_MeV, targetB]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && close()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Database className="w-4 h-4 text-emerald-500" />
            NIST XCOM — Coeficientes de Atenuacion (v100)
            <Badge variant="outline" className="text-[9px]">NIST Standard Reference Database 8</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-3 mb-2">
          <div>
            <label className="text-[10px] text-slate-500 font-medium mb-1 block">Material</label>
            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger className="text-[11px] h-7"><SelectValue /></SelectTrigger>
              <SelectContent>
                {getMaterialOptions().map(o => (
                  <SelectItem key={o.code} value={o.code} className="text-[11px]">{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-medium mb-1 block">Energia (MeV)</label>
            <Input type="number" step="0.01" value={energyInput} onChange={e => setEnergyInput(e.target.value)} className="text-[11px] h-7" />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-medium mb-1 block">Espesor (mm)</label>
            <Input type="number" step="0.1" value={thicknessInput} onChange={e => setThicknessInput(e.target.value)} className="text-[11px] h-7" />
          </div>
        </div>

        {mat && (
          <div className="bg-slate-50 rounded-md p-2 text-[10px] text-slate-600 mb-2">
            <strong>{mat.nameEs}</strong> | ρ = {mat.density_g_per_cm3} g/cm³ | Z_eff = {mat.effectiveZ} | {mat.ncrpRef}
          </div>
        )}

        {/* Interpolation Results */}
        {interp && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-emerald-50 rounded-md p-2 text-center">
              <div className="text-[9px] text-slate-500">μ (cm²/g)</div>
              <div className="text-sm font-bold text-emerald-700">{interp.mu_cm2_per_g.toFixed(3)}</div>
            </div>
            <div className="bg-blue-50 rounded-md p-2 text-center">
              <div className="text-[9px] text-slate-500">μ (1/cm)</div>
              <div className="text-sm font-bold text-blue-700">{interp.mu_1_per_cm.toFixed(3)}</div>
            </div>
            <div className="bg-amber-50 rounded-md p-2 text-center">
              <div className="text-[9px] text-slate-500">HVL (mm)</div>
              <div className="text-sm font-bold text-amber-700">{interp.halfValueLayer_mm.toFixed(2)}</div>
            </div>
            <div className="bg-red-50 rounded-md p-2 text-center">
              <div className="text-[9px] text-slate-500">TVL (mm)</div>
              <div className="text-sm font-bold text-red-700">{interp.tenthValueLayer_mm.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Calculators */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="border rounded-md p-3">
            <h4 className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-2">
              <Calculator className="w-3 h-3" /> Transmision para espesor dado
            </h4>
            <div className="flex items-center gap-2 text-[11px]">
              <span>B = exp(-μt) =</span>
              {transForThickness !== null && (
                <Badge className="text-[10px]">{transForThickness.toExponential(3)}</Badge>
              )}
            </div>
            <p className="text-[9px] text-slate-400 mt-1">Para {thicknessInput} mm de {mat?.nameEs} a {energyInput} MeV</p>
          </div>
          <div className="border rounded-md p-3">
            <h4 className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 mb-2">
              <Atom className="w-3 h-3" /> Espesor para transmision B
            </h4>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px]">B =</span>
              <Input type="number" step="0.0001" value={targetB} onChange={e => setTargetB(e.target.value)} className="text-[11px] h-6 w-24" />
            </div>
            {thicknessForB !== null && (
              <div className="flex items-center gap-1 text-[11px]">
                <ArrowRight className="w-3 h-3 text-orange-500" />
                <span className="font-bold">{thicknessForB.toFixed(2)} mm</span>
              </div>
            )}
          </div>
        </div>

        {/* Full Table */}
        <h4 className="text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
          <BookOpen className="w-3 h-3" /> Tabla completa — {mat?.nameEs}
        </h4>
        <Table>
          <TableHeader>
            <TableRow className="text-[9px]">
              <TableHead className="py-1">E (MeV)</TableHead>
              <TableHead className="py-1">μ (cm²/g)</TableHead>
              <TableHead className="py-1">μ_en (cm²/g)</TableHead>
              <TableHead className="py-1">μ (1/cm)</TableHead>
              <TableHead className="py-1">HVL (mm)</TableHead>
              <TableHead className="py-1">TVL (mm)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mat?.data.map((row, i) => (
              <TableRow key={i} className="text-[10px] hover:bg-slate-50">
                <TableCell className="py-1 font-mono">{row.energy_MeV.toFixed(2)}</TableCell>
                <TableCell className="py-1 font-mono">{row.mu_cm2_per_g.toFixed(3)}</TableCell>
                <TableCell className="py-1 font-mono">{row.mu_en_cm2_per_g.toFixed(3)}</TableCell>
                <TableCell className="py-1 font-mono">{row.mu_1_per_cm.toFixed(3)}</TableCell>
                <TableCell className="py-1 font-mono">{row.halfValueLayer_mm.toFixed(2)}</TableCell>
                <TableCell className="py-1 font-mono">{row.tenthValueLayer_mm.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="text-[8px] text-slate-400 mt-2">
          Fuente: NIST Standard Reference Database 8 (XCOM) | Berger et al. (2010) | NCRP 147 Table A.2, NCRP 151 Table B.1
        </p>
      </DialogContent>
    </Dialog>
  );
}
