import { useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Activity, Play, Download } from 'lucide-react';
import { solveBateman, generateTimePoints, searchNuclides, NUCLIDE_LIBRARY } from '@/lib/batemanSolver';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export default function BatemanDecayDialog({ open, onOpenChange }: Props) {
  const [selectedNuclide, setSelectedNuclide] = useState('F-18');
  const [initialActivity, setInitialActivity] = useState(370);
  const [activityUnit, setActivityUnit] = useState<'MBq' | 'GBq' | 'TBq'>('MBq');
  const [numHalfLives, setNumHalfLives] = useState(10);
  const [results, setResults] = useState<ReturnType<typeof solveBateman>>([]);
  const [searchedNuclides, setSearchedNuclides] = useState(Object.values(NUCLIDE_LIBRARY));
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const nuclide = NUCLIDE_LIBRARY[selectedNuclide];

  const unitMultiplier = activityUnit === 'MBq' ? 1e6 : activityUnit === 'GBq' ? 1e9 : 1e12;

  const runCalculation = useCallback(() => {
    const times = generateTimePoints(nuclide.halfLife_s, numHalfLives);
    const res = solveBateman(selectedNuclide, initialActivity * unitMultiplier / 1e6, times, 5);
    setResults(res);
    toast.success(`Decay chain solved: ${Object.keys(res[0]?.activities || {}).length} nuclides`);
  }, [selectedNuclide, initialActivity, unitMultiplier, nuclide, numHalfLives]);

  const filteredNuclides = useMemo(() => {
    return searchNuclides(searchQuery, categoryFilter || undefined);
  }, [searchQuery, categoryFilter]);

  const exportCSV = useCallback(() => {
    if (!results.length) return;
    const headers = ['time_h', 'time_halfLives', ...Object.keys(results[0].activities), 'total_Bq'];
    const rows = results.map(r => [
      (r.time_s / 3600).toFixed(2),
      (r.time_s / nuclide.halfLife_s).toFixed(2),
      ...Object.values(r.activities).map(v => v.toExponential(4)),
      r.totalActivity_Bq.toExponential(4),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `decay_${selectedNuclide}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  }, [results, selectedNuclide, nuclide]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1000px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Activity className="w-5 h-5 text-violet-500" />
            Bateman Decay Solver
            <Badge variant="outline" className="text-[10px]">v26</Badge>
            <Badge variant="secondary" className="text-[10px]">ICRP 107</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          {/* Left panel: Controls */}
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Search Nuclides</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-8 px-2 border rounded text-xs" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="text-xs">All</SelectItem>
                    <SelectItem value="PET" className="text-xs">PET</SelectItem>
                    <SelectItem value="SPECT" className="text-xs">SPECT</SelectItem>
                    <SelectItem value="Therapy" className="text-xs">Therapy</SelectItem>
                    <SelectItem value="Industrial" className="text-xs">Industrial</SelectItem>
                    <SelectItem value="Generator" className="text-xs">Generator</SelectItem>
                  </SelectContent>
                </Select>
                <ScrollArea className="h-48 border rounded">
                  <div className="space-y-0.5 p-1">
                    {filteredNuclides.map(n => (
                      <div key={n.symbol} className={`text-xs p-1.5 rounded cursor-pointer ${selectedNuclide === n.symbol ? 'bg-primary/10 font-medium' : 'hover:bg-muted'}`}
                        onClick={() => setSelectedNuclide(n.symbol)}>
                        {n.symbol} — {n.name}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div><Label className="text-[10px]">Selected: <strong>{nuclide?.symbol}</strong> (T½ = {(nuclide?.halfLife_s || 0) / 3600} h)</Label></div>
                <div className="flex gap-2">
                  <input type="number" value={initialActivity} onChange={e => setInitialActivity(Number(e.target.value))}
                    className="w-20 h-8 px-2 border rounded text-xs" />
                  <Select value={activityUnit} onValueChange={(v) => setActivityUnit(v as any)}>
                    <SelectTrigger className="h-8 text-xs w-20"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="MBq" className="text-xs">MBq</SelectItem><SelectItem value="GBq" className="text-xs">GBq</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-[10px]">Half-lives: {numHalfLives}</Label>
                  <input type="range" min={1} max={20} value={numHalfLives} onChange={e => setNumHalfLives(Number(e.target.value))} className="w-full" /></div>
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs gap-1" onClick={runCalculation}><Play className="w-3 h-3" />Solve</Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={exportCSV} disabled={!results.length}><Download className="w-3 h-3" />CSV</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Results */}
          <div className="col-span-2">
            {results.length > 0 ? (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(results[0].activities).map(([sym, act], i) => (
                      <Card key={sym} className={i === 0 ? 'bg-violet-50' : 'bg-muted/30'}>
                        <CardContent className="p-2 text-center">
                          <p className="text-xs font-bold">{sym}</p>
                          <p className="text-[10px] font-mono">{act.toExponential(1)} Bq</p>
                          <p className="text-[9px] text-muted-foreground">t=0</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <table className="w-full text-xs border-collapse">
                    <thead><tr className="bg-muted"><th className="p-1 text-left">Time (h)</th><th className="p-1 text-left">T½</th>{Object.keys(results[0].activities).map(s => <th key={s} className="p-1 text-right">{s} (Bq)</th>)}<th className="p-1 text-right">Total (Bq)</th></tr></thead>
                    <tbody>
                      {results.filter((_, i) => i % 2 === 0).map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-muted/20'}>
                          <td className="p-1 font-mono">{(r.time_s / 3600).toFixed(1)}</td>
                          <td className="p-1 font-mono">{(r.time_s / nuclide.halfLife_s).toFixed(1)}</td>
                          {Object.values(r.activities).map((v, j) => <td key={j} className="p-1 text-right font-mono">{v.toExponential(1)}</td>)}
                          <td className="p-1 text-right font-bold">{r.totalActivity_Bq.toExponential(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Select a nuclide and click Solve to see the decay chain
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <label className={`text-xs text-muted-foreground ${className}`}>{children}</label>;
}
