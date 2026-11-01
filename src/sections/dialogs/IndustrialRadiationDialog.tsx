// =============================================================================
// IndustrialRadiationDialog.tsx — Industrial Radiation Protection Module
// NCRP 144, IAEA RS-G-1.3, ISO 3999
// Radiography, gauging, well-logging, NDT, sterilization
// =============================================================================
import { useState, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import '@/components/ui/select';
import 'sonner';
import {
  Factory, Shield, Radio, AlertTriangle,
  FlaskConical
} from 'lucide-react';
import {
  INDUSTRIAL_SOURCES, INDUSTRIAL_CONTROL_ZONES, NDT_TECHNIQUES,
  calculateControlDistance, calculateSafeOperatingTime
} from '@/lib/industrialRadiation';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export default function IndustrialRadiationDialog({ open, onOpenChange }: Props) {
  const [selectedSource, setSelectedSource] = useState('Ir-192');
  const [activity_GBq, setActivity_GBq] = useState('4');
  const [annualUsed_uSv, setAnnualUsed_uSv] = useState('2000');
  const [ndtTechnique, setNdtTechnique] = useState('ir192_radio');
  const [objectThickness_mm, setObjectThickness_mm] = useState('40');

  const source = useMemo(() => INDUSTRIAL_SOURCES.find(s => s.nuclide === selectedSource), [selectedSource]);

  const controlDistances = useMemo(() => {
    if (!source) return [];
    const A_GBq = parseFloat(activity_GBq) || source.activity_TBq * 1000;
    return INDUSTRIAL_CONTROL_ZONES.map(z => ({
      zone: z,
      distance_m: calculateControlDistance(A_GBq, source.gammaConstant_mSv_m2_GBq_h * 1000, z.doseRateLimit_uSv_h),
    }));
  }, [source, activity_GBq]);

  const ndtTech = NDT_TECHNIQUES.find(t => t.id === ndtTechnique);
  const isThicknessOk = ndtTech ? parseFloat(objectThickness_mm) <= ndtTech.maxSteel_mm : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Factory className="h-5 w-5 text-slate-600" />
            Industrial Radiation Protection
            <Badge variant="outline" className="text-[10px]">NCRP 144 / IAEA RS-G-1.3</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="sources" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4 shrink-0">
            <TabsTrigger value="sources"><Radio className="h-3.5 w-3.5 mr-1" />Sources</TabsTrigger>
            <TabsTrigger value="zones"><Shield className="h-3.5 w-3.5 mr-1" />Control Zones</TabsTrigger>
            <TabsTrigger value="ndt"><FlaskConical className="h-3.5 w-3.5 mr-1" />NDT</TabsTrigger>
            <TabsTrigger value="safety"><AlertTriangle className="h-3.5 w-3.5 mr-1" />Safety</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-3 pb-2">
              {/* SOURCES */}
              <TabsContent value="sources" className="space-y-3 mt-2">
                <div className="grid grid-cols-4 gap-2">
                  {INDUSTRIAL_SOURCES.map(s => (
                    <Card key={s.nuclide} className={`cursor-pointer transition-all ${selectedSource === s.nuclide ? 'ring-2 ring-primary' : ''}`} onClick={() => { setSelectedSource(s.nuclide); setActivity_GBq(String(s.activity_TBq * 1000)); }}>
                      <CardContent className="pt-3 text-center">
                        <p className="text-sm font-bold">{s.nuclide}</p>
                        <p className="text-[10px] text-muted-foreground">{s.name}</p>
                        <Badge variant="outline" className="text-[8px] mt-1">{s.category}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {source && (
                  <Card className="border-primary">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">{source.name} — Properties</CardTitle></CardHeader>
                    <CardContent className="text-sm">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-muted p-2 rounded text-center"><p className="text-xs text-muted-foreground">Half-life</p><p className="font-semibold">{source.halfLife_years} y</p></div>
                        <div className="bg-muted p-2 rounded text-center"><p className="text-xs text-muted-foreground">Energy</p><p className="font-semibold">{source.gammaEnergy_keV} keV</p></div>
                        <div className="bg-muted p-2 rounded text-center"><p className="text-xs text-muted-foreground">HVL (steel)</p><p className="font-semibold">{source.HVL_steel_mm} mm</p></div>
                        <div className="bg-muted p-2 rounded text-center"><p className="text-xs text-muted-foreground">HVL (concrete)</p><p className="font-semibold">{source.HVL_concrete_mm} mm</p></div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {source.applications.map(a => <Badge key={a} variant="secondary" className="text-[9px]">{a}</Badge>)}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* CONTROL ZONES */}
              <TabsContent value="zones" className="space-y-3 mt-2">
                <div className="flex gap-2 items-end">
                  <div><Label className="text-xs">Activity (GBq)</Label><Input type="number" value={activity_GBq} onChange={e => setActivity_GBq(e.target.value)} /></div>
                  <div><Label className="text-xs">Annual Used (uSv)</Label><Input type="number" value={annualUsed_uSv} onChange={e => setAnnualUsed_uSv(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {controlDistances.map(({ zone, distance_m }) => (
                    <Card key={zone.name} style={{ borderLeftColor: zone.boundaryColor, borderLeftWidth: 4 }}>
                      <CardContent className="pt-3">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.boundaryColor }} />
                          <p className="text-sm font-medium">{zone.nameEs}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{zone.accessRequirement}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-[9px]">d = {distance_m.toFixed(1)} m</Badge>
                          <Badge variant="outline" className="text-[9px]">&lt; {zone.doseRateLimit_uSv_h} uSv/h</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {source && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Safe Operating Time</CardTitle></CardHeader>
                    <CardContent>
                      {INDUSTRIAL_CONTROL_ZONES.slice(0, 3).map(z => {
                        const d = controlDistances.find(cd => cd.zone.name === z.name)?.distance_m || 0;
                        const doseAtD = d > 0 ? (parseFloat(activity_GBq) * source.gammaConstant_mSv_m2_GBq_h * 1000) / (d * d) : 0;
                        const safeHours = calculateSafeOperatingTime(doseAtD, 20000, parseFloat(annualUsed_uSv));
                        return (
                          <div key={z.name} className="flex justify-between text-xs py-0.5">
                            <span>{z.nameEs}</span>
                            <span className="font-mono">{safeHours === Infinity ? 'Unlimited' : safeHours.toFixed(1) + ' h/year'}</span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* NDT */}
              <TabsContent value="ndt" className="space-y-3 mt-2">
                <div className="grid grid-cols-3 gap-2">
                  {NDT_TECHNIQUES.map(t => (
                    <Card key={t.id} className={`cursor-pointer ${ndtTechnique === t.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setNdtTechnique(t.id)}>
                      <CardContent className="pt-3">
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">Max steel: {t.maxSteel_mm} mm</p>
                        <p className="text-xs text-muted-foreground">Optimal: {t.optimal_mm} mm</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex gap-2 items-end">
                  <div><Label className="text-xs">Object Thickness (mm steel)</Label><Input type="number" value={objectThickness_mm} onChange={e => setObjectThickness_mm(e.target.value)} /></div>
                  <Badge className={isThicknessOk ? 'bg-emerald-500' : 'bg-red-500'}>
                    {isThicknessOk ? 'WITHIN RANGE' : 'EXCEEDS MAX'}
                  </Badge>
                </div>
                {ndtTech && (
                  <Card className={isThicknessOk ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}>
                    <CardContent className="pt-3 text-sm">
                      <p className="font-medium">{ndtTech.name} Assessment</p>
                      <p className="text-xs text-muted-foreground">Thickness {objectThickness_mm} mm steel {isThicknessOk ? 'is suitable' : 'exceeds'} for {ndtTech.name} (max: {ndtTech.maxSteel_mm} mm).</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* SAFETY */}
              <TabsContent value="safety" className="space-y-3 mt-2">
                <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
                  <CardContent className="pt-4 text-sm text-amber-700 dark:text-amber-300">
                    <p className="font-medium">Industrial Radiation Safety Requirements</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>Radiation Safety Officer (RSO) certified and present</li>
                      <li>Survey meters calibrated annually (±20% accuracy)</li>
                      <li>Personnel dosimetry (TLD or OSL) worn at chest level</li>
                      <li>Barrier/interlock systems tested quarterly</li>
                      <li>Emergency procedures posted at each radiography site</li>
                      <li>Source accountability: log in/log out for all sources</li>
                      <li>Transport containers meet Type A or Type B specifications</li>
                    </ul>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Card><CardContent className="pt-3"><p className="font-medium">Annual Dose Limit (Worker)</p><p className="text-2xl font-bold">20 mSv</p><p className="text-muted-foreground">NCRP 116 / ICRP 103</p></CardContent></Card>
                  <Card><CardContent className="pt-3"><p className="font-medium">Annual Dose Limit (Public)</p><p className="text-2xl font-bold">1 mSv</p><p className="text-muted-foreground">NCRP 116 / ICRP 103</p></CardContent></Card>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
