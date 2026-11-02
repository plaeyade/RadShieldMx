// =============================================================================
// BIMRADDialog.tsx — BIM-based Radiation Modeling (BIMRAD) Method
// Nuclear Engineering and Technology, 2025. DOI: 10.1016/j.net.2025.103801
// =============================================================================
import { useState, useCallback, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Box, Upload, Activity, Shield, ArrowRight, Play,
  CheckCircle, Circle, TrendingDown, Download, RotateCcw
} from 'lucide-react';
import {
  extractBIMFromIFC, inverseSourceStrength, computeBIMDoseDistribution,
  analyzeALARASequence, BIMRAD_WORKFLOW_STEPS, IFC_SHIELDING_ENTITIES,
  type BIMModel, type ALARAStep, type SourceStrengthResult,
  type DoseRateDistribution,
} from '@/lib/bimRAD';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export default function BIMRADDialog({ open, onOpenChange }: Props) {
  const [activeTab, setActiveTab] = useState('workflow');
  const [model, setModel] = useState<BIMModel | null>(null);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [inverseResult, setInverseResult] = useState<SourceStrengthResult | null>(null);
  const [alaraSteps, setAlaraSteps] = useState<ALARAStep[]>([]);
  const [doseDist, setDoseDist] = useState<DoseRateDistribution[]>([]);
  const [sourceActivity, setSourceActivity] = useState('3.7');
  const [sourcePosX, setSourcePosX] = useState('3');
  const [sourcePosY, setSourcePosY] = useState('1.5');
  const [sourcePosZ, setSourcePosZ] = useState('2.5');
  const [gammaConst, setGammaConst] = useState('0.143');

  const handleIFCUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        const parsed = extractBIMFromIFC(content);
        setModel(parsed);
        setWorkflowProgress(30);
        toast.success(`IFC parsed: ${parsed.spaces.length} spaces, ${parsed.elements.length} elements`);
      } catch {
        toast.error('Failed to parse IFC');
      }
    };
    reader.readAsText(file);
  }, []);

  const runForwardCalculation = useCallback(() => {
    if (!model) { toast.error('Import IFC first'); return; }
    setIsProcessing(true);
    setWorkflowProgress(60);
    setTimeout(() => {
      const dist = computeBIMDoseDistribution(
        model,
        [parseFloat(sourcePosX), parseFloat(sourcePosY), parseFloat(sourcePosZ)],
        parseFloat(sourceActivity),
        parseFloat(gammaConst),
        0.5,
      );
      setDoseDist(dist);
      setWorkflowProgress(75);
      setIsProcessing(false);
      toast.success(`Dose distribution: ${dist.length} points computed`);
    }, 500);
  }, [model, sourcePosX, sourcePosY, sourcePosZ, sourceActivity, gammaConst]);

  const runInverseCalculation = useCallback(() => {
    if (!model) { toast.error('Import IFC first'); return; }
    setIsProcessing(true);
    const measurements = doseDist.length > 0
      ? doseDist.filter((_, i) => i % 5 === 0).map(d => ({ position: d.position, doseRate_uSv_h: d.doseRate_uSv_h }))
      : [{ position: [4.0, 1.5, 3.0] as [number, number, number], doseRate_uSv_h: 15.2 }];
    setTimeout(() => {
      const result = inverseSourceStrength(
        measurements,
        [parseFloat(sourcePosX), parseFloat(sourcePosY), parseFloat(sourcePosZ)],
        parseFloat(gammaConst),
      );
      setInverseResult(result);
      setWorkflowProgress(85);
      setIsProcessing(false);
      toast.success(`Inverse source: ${result.estimatedActivity_GBq.toFixed(2)} GBq ± ${result.uncertainty_percent.toFixed(1)}%`);
    }, 500);
  }, [model, doseDist, sourcePosX, sourcePosY, sourcePosZ, gammaConst]);

  const runALARA = useCallback(() => {
    if (!model) { toast.error('Import IFC first'); return; }
    setIsProcessing(true);
    setTimeout(() => {
      const steps = analyzeALARASequence(model, {
        initialSourceActivity_GBq: parseFloat(sourceActivity),
        steps: [
          { description: 'Remove primary source (LINAC head)', removeSources: ['LINAC_HEAD'], duration_hours: 4 },
          { description: 'Dismantle primary barrier (concrete)', modifyShielding: ['PRIMARY_WALL'], duration_hours: 8 },
          { description: 'Remove secondary scattering source', removeSources: ['SCATTER_1'], duration_hours: 2 },
          { description: 'Partial maze wall removal', modifyShielding: ['MAZE_WALL'], duration_hours: 6 },
          { description: 'Final cleanup and survey', duration_hours: 4 },
        ],
      });
      setAlaraSteps(steps);
      setWorkflowProgress(100);
      setIsProcessing(false);
      toast.success(`ALARA: ${steps.length} steps analyzed`);
    }, 500);
  }, [model, sourceActivity]);

  const resetWorkflow = useCallback(() => {
    setModel(null);
    setFileName('');
    setWorkflowProgress(0);
    setInverseResult(null);
    setAlaraSteps([]);
    setDoseDist([]);
  }, []);

  const zoneDist = useMemo(() => {
    const dist: Record<string, number> = {};
    for (const d of doseDist) { dist[d.zone] = (dist[d.zone] || 0) + 1; }
    return dist;
  }, [doseDist]);

  const getStatusIcon = (idx: number) => {
    const pct = workflowProgress;
    if (pct >= (idx + 1) * 11) return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    if (pct >= idx * 11) return <Play className="h-4 w-4 text-blue-500" />;
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Box className="h-5 w-5 text-blue-500" />
            BIMRAD — BIM-based Radiation Modeling
            <Badge variant="outline" className="text-[10px]">BIMRAD / NET 2025</Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Methodology: BIMRAD (BIM-based Radiation Modeling) — Inverse source strength, dose distribution, ALARA analysis
          </p>
        </DialogHeader>

        {/* Progress */}
        <div className="px-6">
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="text-muted-foreground">Workflow Progress</span>
            <span className="font-mono">{workflowProgress}%</span>
          </div>
          <Progress value={workflowProgress} className="h-2" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="workflow"><ArrowRight className="h-3.5 w-3.5 mr-1" />Workflow</TabsTrigger>
            <TabsTrigger value="ifc"><Upload className="h-3.5 w-3.5 mr-1" />IFC Import</TabsTrigger>
            <TabsTrigger value="forward"><Activity className="h-3.5 w-3.5 mr-1" />Forward</TabsTrigger>
            <TabsTrigger value="inverse"><TrendingDown className="h-3.5 w-3.5 mr-1" />BIMRAD Inv.</TabsTrigger>
            <TabsTrigger value="alara"><Shield className="h-3.5 w-3.5 mr-1" />ALARA</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-2 mt-2" style={{ maxHeight: 'calc(92vh - 250px)' }}>
            <div className="space-y-3 pb-4">
              {/* TAB: Workflow */}
              <TabsContent value="workflow" className="space-y-2">
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                  <CardContent className="pt-4 text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium">BIMRAD Methodology (Ro et al., 2025)</p>
                    <p>BIM-based radiation modeling that integrates geometric and material information from BIM models for shielding calculations, dose rate distribution, and ALARA decommissioning analysis.</p>
                  </CardContent>
                </Card>
                <div className="space-y-1">
                  {BIMRAD_WORKFLOW_STEPS.map((step, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                      {getStatusIcon(i)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{step.phase}</p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                      <div className="flex gap-1">
                        {step.inputs.map((inp, j) => <Badge key={j} variant="outline" className="text-[9px]">{inp}</Badge>)}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* TAB: IFC Import */}
              <TabsContent value="ifc" className="space-y-3">
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Upload IFC file from Revit/ArchiCAD</p>
                  <Input type="file" accept=".ifc" onChange={handleIFCUpload} className="mt-2" />
                </div>
                {fileName && (
                  <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                    <Box className="h-4 w-4" />
                    <span className="font-medium">{fileName}</span>
                    <Badge variant="secondary" className="ml-auto">Parsed</Badge>
                  </div>
                )}
                {model && (
                  <div className="grid grid-cols-3 gap-2">
                    <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Spaces</p><p className="text-2xl font-bold">{model.spaces.length}</p></CardContent></Card>
                    <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Elements</p><p className="text-2xl font-bold">{model.elements.length}</p></CardContent></Card>
                    <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Levels</p><p className="text-2xl font-bold">{model.levels.length}</p></CardContent></Card>
                  </div>
                )}
                {/* IFC Entity Types */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">IFC Shielding-Relevant Entities</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {IFC_SHIELDING_ENTITIES.map(e => (
                        <div key={e.type} className="flex justify-between text-xs py-0.5">
                          <span className="font-mono">{e.type}</span>
                          <span className="text-muted-foreground">{e.relevance}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB: Forward Calculation */}
              <TabsContent value="forward" className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  <div><Label className="text-xs">Activity (GBq)</Label><Input type="number" value={sourceActivity} onChange={e => setSourceActivity(e.target.value)} /></div>
                  <div><Label className="text-xs">Source X (m)</Label><Input type="number" value={sourcePosX} onChange={e => setSourcePosX(e.target.value)} /></div>
                  <div><Label className="text-xs">Source Y (m)</Label><Input type="number" value={sourcePosY} onChange={e => setSourcePosY(e.target.value)} /></div>
                  <div><Label className="text-xs">Source Z (m)</Label><Input type="number" value={sourcePosZ} onChange={e => setSourcePosZ(e.target.value)} /></div>
                </div>
                <div>
                  <Label className="text-xs">Gamma Constant (mSv.m2/GBq.h)</Label>
                  <Select value={gammaConst} onValueChange={setGammaConst}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.143">F-18: 0.143</SelectItem>
                      <SelectItem value="0.134">Ga-68: 0.134</SelectItem>
                      <SelectItem value="0.030">Tc-99m: 0.030</SelectItem>
                      <SelectItem value="0.059">I-131: 0.059</SelectItem>
                      <SelectItem value="0.005">Lu-177: 0.005</SelectItem>
                      <SelectItem value="0.308">Co-60: 0.308</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={runForwardCalculation} disabled={isProcessing || !model} className="w-full">
                  <Play className="h-4 w-4 mr-2" />Run Forward Calculation
                </Button>
                {doseDist.length > 0 && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <Card className="bg-amber-50"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Points</p><p className="text-xl font-bold text-amber-600">{doseDist.length}</p></CardContent></Card>
                      <Card className="bg-red-50"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Max Dose</p><p className="text-xl font-bold text-red-600">{(Math.max(...doseDist.map(d => d.doseRate_uSv_h)) || 0).toFixed(1)} uSv/h</p></CardContent></Card>
                      <Card className="bg-blue-50"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Avg Dose</p><p className="text-xl font-bold text-blue-600">{(doseDist.reduce((s, d) => s + d.doseRate_uSv_h, 0) / doseDist.length).toFixed(1)} uSv/h</p></CardContent></Card>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(zoneDist).map(([zone, count]) => {
                        const colors: Record<string, string> = { excluded: 'bg-red-800', controlled: 'bg-red-500', supervised: 'bg-orange-500', free: 'bg-green-500' };
                        return <Badge key={zone} className={`${colors[zone] || 'bg-gray-500'} text-white`}>{zone}: {count}</Badge>;
                      })}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* TAB: Inverse Calculation */}
              <TabsContent value="inverse" className="space-y-3">
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                  <CardContent className="pt-4 text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium">Inverse Source Strength (BIMRAD)</p>
                    <p>Estimate source activity from measured dose rates using iterative least-squares with point kernel.</p>
                  </CardContent>
                </Card>
                <Button onClick={runInverseCalculation} disabled={isProcessing || !model} className="w-full">
                  <TrendingDown className="h-4 w-4 mr-2" />Run Inverse Calculation
                </Button>
                {inverseResult && (
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-emerald-50 dark:bg-emerald-950"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Est. Activity</p><p className="text-2xl font-bold text-emerald-600">{inverseResult.estimatedActivity_GBq.toFixed(3)} GBq</p></CardContent></Card>
                    <Card className="bg-amber-50 dark:bg-amber-950"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Uncertainty</p><p className="text-2xl font-bold text-amber-600">±{inverseResult.uncertainty_percent.toFixed(1)}%</p></CardContent></Card>
                    <Card className="bg-blue-50"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Discrepancy</p><p className="text-2xl font-bold text-blue-600">{inverseResult.discrepancy_percent.toFixed(1)}%</p></CardContent></Card>
                    <Card className="bg-purple-50"><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Iterations</p><p className="text-2xl font-bold text-purple-600">{inverseResult.convergenceIterations}</p></CardContent></Card>
                  </div>
                )}
              </TabsContent>

              {/* TAB: ALARA */}
              <TabsContent value="alara" className="space-y-3">
                <Card className="bg-green-50 dark:bg-green-950/30 border-green-200">
                  <CardContent className="pt-4 text-sm text-green-700 dark:text-green-300">
                    <p className="font-medium">ALARA Decommissioning Analysis</p>
                    <p>Evaluate dose at each dismantling stage. Track cumulative exposure and optimize sequence.</p>
                  </CardContent>
                </Card>
                <Button onClick={runALARA} disabled={isProcessing || !model} className="w-full">
                  <Shield className="h-4 w-4 mr-2" />Run ALARA Analysis
                </Button>
                {alaraSteps.length > 0 && (
                  <div className="space-y-2">
                    {alaraSteps.map((step) => (
                      <Card key={step.stepNumber} className={step.estimatedDoseRate_uSv_h > 50 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500'}>
                        <CardContent className="pt-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Step {step.stepNumber}: {step.description}</p>
                              <p className="text-xs text-muted-foreground">Duration: {step.timeRequired_hours}h</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-mono">{step.estimatedDoseRate_uSv_h.toFixed(1)} uSv/h</p>
                              <p className="text-xs text-muted-foreground">Cumul: {step.cumulativeDose_uSv.toFixed(0)} uSv</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* Footer Actions */}
        <div className="px-6 pb-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={resetWorkflow}><RotateCcw className="h-3.5 w-3.5 mr-1" />Reset</Button>
          <Button variant="outline" size="sm" onClick={() => toast.info('Export BIMRAD report coming soon')}><Download className="h-3.5 w-3.5 mr-1" />Export Report</Button>
          <div className="flex-1" />
          {isProcessing && <Badge variant="secondary"><RotateCcw className="h-3 w-3 animate-spin mr-1" />Processing...</Badge>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
