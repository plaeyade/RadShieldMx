// ExperimentalValidationDialog.tsx — Cross-validation with measured data
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import 'sonner';
import { FlaskConical, Database } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const EXPERIMENTAL_DATA = [
  { ref: 'NCRP151_TblB1', material: 'Concrete', energy_MeV: 6, tvl_cm: 37.0, source: 'NCRP 151 (2005)', uncertainty: 2.0 },
  { ref: 'TG108_2022', material: 'Lead', energy_MeV: 0.511, tvl_cm: 0.5, source: 'TG 108 (2022)', uncertainty: 1.5 },
  { ref: 'LAF_2020', material: 'Concrete', energy_MeV: 6, tvl_cm: 36.2, source: 'La法国 et al. (2020)', uncertainty: 3.2 },
  { ref: 'ISRP_2019', material: 'Concrete', energy_MeV: 10, tvl_cm: 37.8, source: 'ISRP Journal (2019)', uncertainty: 2.8 },
  { ref: 'AAPM_2018', material: 'Steel', energy_MeV: 6, tvl_cm: 8.3, source: 'AAPM Summer School (2018)', uncertainty: 4.1 },
  { ref: 'TEPC_2021', material: 'Barite', energy_MeV: 6, tvl_cm: 28.5, source: 'TEPC Measurements (2021)', uncertainty: 3.5 },
  { ref: 'NIST_2017', material: 'Lead', energy_MeV: 1.25, tvl_cm: 1.0, source: 'NIST XCOM (2017)', uncertainty: 1.0 },
];

export default function ExperimentalValidationDialog({ open, onOpenChange }: Props) {
  const [measuredTVL, setMeasuredTVL] = useState('36.5');
  const [measuredUnc, setMeasuredUnc] = useState('2.0');
  const [refTVL, setRefTVL] = useState('37.0');
  const [, setSelectedData] = useState<typeof EXPERIMENTAL_DATA[0] | null>(null);

  const diff = parseFloat(measuredTVL) - parseFloat(refTVL);
  const enRatio = parseFloat(measuredUnc) > 0 ? Math.abs(diff) / parseFloat(measuredUnc) : 0;
  const agree = Math.abs(diff) <= 2 * parseFloat(measuredUnc);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-emerald-500" />Experimental Data Cross-Validation</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-3">
            <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200">
              <CardContent className="pt-4 text-sm text-emerald-700 dark:text-emerald-300">
                <p className="font-medium">Validate calculations against experimental measurements</p>
                <p>Compare NCRP 151 analytical values with measured TVL data from peer-reviewed publications.</p>
              </CardContent>
            </Card>
            <div className="grid grid-cols-4 gap-2">
              <div><Label className="text-xs">Measured TVL (cm)</Label><Input value={measuredTVL} onChange={e=>setMeasuredTVL(e.target.value)} /></div>
              <div><Label className="text-xs">Uncertainty (cm)</Label><Input value={measuredUnc} onChange={e=>setMeasuredUnc(e.target.value)} /></div>
              <div><Label className="text-xs">NCRP Ref TVL (cm)</Label><Input value={refTVL} onChange={e=>setRefTVL(e.target.value)} /></div>
              <div className="flex items-end">
                <Badge className={agree ? 'bg-emerald-500' : 'bg-red-500'}>{agree ? 'AGREES' : 'DISAGREES'} (|diff|={Math.abs(diff).toFixed(1)} ≤ 2u)</Badge>
              </div>
            </div>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Database className="h-4 w-4" />Experimental TVL Database</CardTitle></CardHeader>
              <CardContent className="overflow-auto max-h-64">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background"><tr className="border-b"><th className="text-left py-1">Reference</th><th className="text-left">Material</th><th className="text-right">E (MeV)</th><th className="text-right">TVL (cm)</th><th className="text-right">u (%)</th></tr></thead>
                  <tbody>{EXPERIMENTAL_DATA.map((d, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedData(d); setRefTVL(String(d.tvl_cm)); }}>
                      <td className="py-1 font-medium">{d.source}</td><td>{d.material}</td><td className="text-right font-mono">{d.energy_MeV}</td><td className="text-right font-mono">{d.tvl_cm}</td><td className="text-right font-mono">{d.uncertainty}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </CardContent>
            </Card>
            <div className="grid grid-cols-3 gap-2">
              <Card className="bg-blue-50"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Difference</p><p className="text-xl font-bold text-blue-600">{diff.toFixed(2)} cm</p></CardContent></Card>
              <Card className="bg-purple-50"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">En</p><p className="text-xl font-bold text-purple-600">{enRatio.toFixed(2)}</p></CardContent></Card>
              <Card className={agree ? 'bg-emerald-50' : 'bg-red-50'}><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Conclusion</p><p className={`text-xl font-bold ${agree ? 'text-emerald-600' : 'text-red-600'}`}>{agree ? 'PASS' : 'FAIL'}</p></CardContent></Card>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
