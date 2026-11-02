// UncertaintyQuantificationDialog.tsx — GUM JCGM 100:2008
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Calculator, BarChart3, Info } from 'lucide-react';
import { computeUncertaintyBudget, type UncertaintyBudget } from '@/lib/gumUncertainty';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export default function UncertaintyQuantificationDialog({ open, onOpenChange }: Props) {
  const [thickness] = useState('100');
  const [activity, setActivity] = useState('500');
  const [uAct, setUAct] = useState('25');
  const [distance, setDistance] = useState('4.0');
  const [uDist, setUDist] = useState('0.1');
  const [tvl, setTvl] = useState('37');
  const [uTvl, setUTvl] = useState('2');
  const [occ, setOcc] = useState('0.25');
  const [uOcc, setUOcc] = useState('0.05');
  const [useF, setUseF] = useState('1.0');
  const [uUseF, setUUseF] = useState('0');
  const [budget, setBudget] = useState<UncertaintyBudget | null>(null);

  const compute = () => {
    const b = computeUncertaintyBudget(parseFloat(thickness) || 100, {
      activity_GBq: parseFloat(activity), u_activity: parseFloat(uAct),
      distance_m: parseFloat(distance), u_distance: parseFloat(uDist),
      tvl_cm: parseFloat(tvl), u_tvl: parseFloat(uTvl),
      occupancyFactor: parseFloat(occ), u_occupancy: parseFloat(uOcc),
      useFactor: parseFloat(useF), u_useFactor: parseFloat(uUseF),
    });
    setBudget(b);
    toast.success('GUM uncertainty budget computed');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-purple-500" />
            Uncertainty Quantification — GUM (JCGM 100:2008)
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2 text-xs">
              <div><Label className="text-[10px]">Activity (GBq)</Label><Input value={activity} onChange={e=>setActivity(e.target.value)} className="h-7" /></div>
              <div><Label className="text-[10px]">u(Activity)</Label><Input value={uAct} onChange={e=>setUAct(e.target.value)} className="h-7" /></div>
              <div><Label className="text-[10px]">Distance (m)</Label><Input value={distance} onChange={e=>setDistance(e.target.value)} className="h-7" /></div>
              <div><Label className="text-[10px]">u(Dist)</Label><Input value={uDist} onChange={e=>setUDist(e.target.value)} className="h-7" /></div>
              <div><Label className="text-[10px]">TVL (cm)</Label><Input value={tvl} onChange={e=>setTvl(e.target.value)} className="h-7" /></div>
              <div><Label className="text-[10px]">u(TVL)</Label><Input value={uTvl} onChange={e=>setUTvl(e.target.value)} className="h-7" /></div>
              <div><Label className="text-[10px]">Occ. Factor</Label><Input value={occ} onChange={e=>setOcc(e.target.value)} className="h-7" /></div>
              <div><Label className="text-[10px]">u(Occ)</Label><Input value={uOcc} onChange={e=>setUOcc(e.target.value)} className="h-7" /></div>
              <div><Label className="text-[10px]">Use Factor</Label><Input value={useF} onChange={e=>setUseF(e.target.value)} className="h-7" /></div>
              <div><Label className="text-[10px]">u(Use)</Label><Input value={uUseF} onChange={e=>setUUseF(e.target.value)} className="h-7" /></div>
            </div>
            <Button onClick={compute} className="w-full"><Calculator className="h-4 w-4 mr-2" />Compute GUM Budget</Button>
            {budget && (
              <>
                <div className="grid grid-cols-4 gap-2">
                  <Card className="bg-purple-50"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Transmission B</p><p className="text-xl font-bold">{budget.result.value.toExponential(3)}</p></CardContent></Card>
                  <Card className="bg-blue-50"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Combined u</p><p className="text-xl font-bold">±{budget.result.combinedUncertainty.toExponential(3)}</p></CardContent></Card>
                  <Card className="bg-emerald-50"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Expanded U (k=2)</p><p className="text-xl font-bold">±{budget.result.expandedUncertainty.toExponential(3)}</p></CardContent></Card>
                  <Card className="bg-amber-50"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Relative u</p><p className="text-xl font-bold">{budget.result.relativeUncertainty_percent.toFixed(1)}%</p></CardContent></Card>
                </div>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />Uncertainty Budget</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                  {budget.contributions.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-24 text-right font-medium">{c.inputName}</div>
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${c.contribution_percent}%` }} /></div>
                      <div className="w-16 text-right font-mono">{c.contribution_percent.toFixed(1)}%</div>
                    </div>
                  ))}
                </CardContent></Card>
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                  <CardContent className="pt-3 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>Effective DoF: {budget.result.effectiveDoF} | Coverage factor k={budget.result.coverageFactor} for 95% confidence. Method: JCGM 100:2008 (GUM).</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
