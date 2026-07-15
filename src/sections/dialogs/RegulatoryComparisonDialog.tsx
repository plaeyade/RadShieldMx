import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { GitCompareArrows, Globe, Shield, BarChart3, ArrowRight, AlertTriangle } from 'lucide-react';
import { REGULATIONS, compareDoseLimits, type Regulation } from '@/lib/internationalRegulations';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export default function RegulatoryComparisonDialog({ open, onOpenChange }: Props) {
  const [regA, setRegA] = useState('icrp-103');
  const [regB, setRegB] = useState('nrc-10cfr20');

  const regulationA = useMemo(() => REGULATIONS.find(r => r.id === regA), [regA]);
  const regulationB = useMemo(() => REGULATIONS.find(r => r.id === regB), [regB]);

  const doseComparison = useMemo(() => {
    if (!regulationA?.doseLimits_mSv_yr || !regulationB?.doseLimits_mSv_yr) return [];
    const keys = Object.keys(regulationA.doseLimits_mSv_yr) as (keyof typeof regulationA.doseLimits_mSv_yr)[];
    return keys.map(key => ({
      category: key.replace(/_/g, ' '),
      limitA: regulationA.doseLimits_mSv_yr![key],
      limitB: regulationB.doseLimits_mSv_yr![key],
      diff: regulationA.doseLimits_mSv_yr![key] - (regulationB.doseLimits_mSv_yr![key] || 0),
      stricter: (regulationA.doseLimits_mSv_yr![key] || 0) < (regulationB.doseLimits_mSv_yr![key] || 0) ? 'A' as const :
        (regulationB.doseLimits_mSv_yr![key] || 0) < (regulationA.doseLimits_mSv_yr![key] || 0) ? 'B' as const : 'equal' as const,
    }));
  }, [regulationA, regulationB]);

  const scopeComparison = useMemo(() => {
    if (!regulationA || !regulationB) return [];
    const allScopes = new Set([...regulationA.scope, ...regulationB.scope]);
    return Array.from(allScopes).map(scope => ({
      scope,
      inA: regulationA.scope.includes(scope),
      inB: regulationB.scope.includes(scope),
    }));
  }, [regulationA, regulationB]);

  const report = useMemo(() => {
    if (!regulationA || !regulationB) return null;
    return {
      commonScope: regulationA.scope.filter(s => regulationB.scope.includes(s)),
      uniqueA: regulationA.scope.filter(s => !regulationB.scope.includes(s)),
      uniqueB: regulationB.scope.filter(s => !regulationA.scope.includes(s)),
      stricterOverall: doseComparison.filter(d => d.stricter === 'A').length > doseComparison.filter(d => d.stricter === 'B').length ? regulationA.code :
        doseComparison.filter(d => d.stricter === 'B').length > doseComparison.filter(d => d.stricter === 'A').length ? regulationB.code : 'Tied',
      maxDiff: doseComparison.length > 0 ? doseComparison.reduce((max, d) => Math.abs(d.diff) > Math.abs(max.diff) ? d : max, doseComparison[0]) : null,
    };
  }, [regulationA, regulationB, doseComparison]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1000px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <GitCompareArrows className="w-5 h-5 text-emerald-500" />
            Regulatory Comparison Tool
            <Badge variant="outline" className="text-[10px]">Eje 3.2</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 shrink-0 mb-3">
          <div className="flex-1"><label className="text-[10px] font-semibold">Regulation A</label>
            <Select value={regA} onValueChange={setRegA}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{REGULATIONS.map(r => <SelectItem key={r.id} value={r.id} className="text-xs">{r.code} - {r.title.slice(0, 40)}...</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0 mt-4" />
          <div className="flex-1"><label className="text-[10px] font-semibold">Regulation B</label>
            <Select value={regB} onValueChange={setRegB}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{REGULATIONS.map(r => <SelectItem key={r.id} value={r.id} className="text-xs">{r.code} - {r.title.slice(0, 40)}...</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-3 pr-2">
            {/* Summary Card */}
            {report && (
              <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex-1"><p className="font-semibold">{regulationA?.code}</p><p className="text-[10px] text-muted-foreground">{regulationA?.country}</p></div>
                    <GitCompareArrows className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1 text-right"><p className="font-semibold">{regulationB?.code}</p><p className="text-[10px] text-muted-foreground">{regulationB?.country}</p></div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[10px]">
                    <Badge variant="outline">Stricter overall: <strong>{report.stricterOverall}</strong></Badge>
                    <Badge variant="outline">Common scope: {report.commonScope.length}</Badge>
                    <Badge variant="outline">Scope A: {report.uniqueA.length} unique</Badge>
                    <Badge variant="outline">Scope B: {report.uniqueB.length} unique</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dose Limit Comparison */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" />Dose Limits Comparison (mSv/y)</CardTitle></CardHeader>
              <CardContent>
                {doseComparison.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Both regulations must have defined dose limits</p>
                ) : (
                  <div className="space-y-2">
                    {doseComparison.map(d => (
                      <div key={d.category} className="grid grid-cols-7 gap-2 items-center text-xs">
                        <span className="col-span-2 text-[10px] font-medium capitalize">{d.category}</span>
                        <div className="text-right font-mono font-bold text-blue-600">{d.limitA}</div>
                        <div className="flex items-center justify-center">
                          {d.stricter === 'A' ? <Badge className="text-[8px] bg-emerald-500">A stricter</Badge> :
                           d.stricter === 'B' ? <Badge className="text-[8px] bg-amber-500">B stricter</Badge> :
                           <Badge variant="outline" className="text-[8px]">Equal</Badge>}
                        </div>
                        <div className="text-right font-mono font-bold text-emerald-600">{d.limitB}</div>
                        <div className={`text-right font-mono text-[10px] ${d.diff > 0 ? 'text-red-500' : d.diff < 0 ? 'text-emerald-500' : ''}`}>
                          {d.diff > 0 ? '+' : ''}{d.diff}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{d.diff !== 0 ? `${Math.abs(d.diff / (d.limitB || 1) * 100).toFixed(0)}%` : '-'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scope Comparison */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4" />Scope Coverage Comparison</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  <div className="font-semibold text-center text-blue-600">{regulationA?.code}</div>
                  <div className="font-semibold text-center">Scope Area</div>
                  <div className="font-semibold text-center text-emerald-600">{regulationB?.code}</div>
                  {scopeComparison.map(s => (
                    <div key={s.scope} className="contents">
                      <div className="text-center">{s.inA ? <Check className="w-3 h-3 text-emerald-500 mx-auto" /> : <X className="w-3 h-3 text-red-400 mx-auto" />}</div>
                      <div className="text-center capitalize bg-muted/30 rounded px-1">{s.scope.replace(/_/g, ' ')}</div>
                      <div className="text-center">{s.inB ? <Check className="w-3 h-3 text-emerald-500 mx-auto" /> : <X className="w-3 h-3 text-red-400 mx-auto" />}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Requirements comparison */}
            {report && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Analysis Summary</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex gap-4">
                    <div className="flex-1 p-2 bg-blue-50 rounded"><p className="font-semibold text-[10px] text-blue-700">Common Coverage</p><p className="text-[10px]">{report.commonScope.map(s => s.replace(/_/g, ' ')).join(', ')}</p></div>
                    {report.uniqueA.length > 0 && <div className="flex-1 p-2 bg-amber-50 rounded"><p className="font-semibold text-[10px] text-amber-700">Only in {regulationA?.code}</p><p className="text-[10px]">{report.uniqueA.map(s => s.replace(/_/g, ' ')).join(', ')}</p></div>}
                    {report.uniqueB.length > 0 && <div className="flex-1 p-2 bg-violet-50 rounded"><p className="font-semibold text-[10px] text-violet-700">Only in {regulationB?.code}</p><p className="text-[10px]">{report.uniqueB.map(s => s.replace(/_/g, ' ')).join(', ')}</p></div>}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Check({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>;
}
function X({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
