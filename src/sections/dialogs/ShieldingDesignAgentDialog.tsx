/**
 * ═══════════════════════════════════════════════════════════
 * ShieldingDesignAgentDialog — Fase 3: Autonomous AI Agent
 * Multi-step shielding design with validation
 * ═══════════════════════════════════════════════════════════
 */

import { useState } from "react";
import { ShieldingDesignAgent } from "@/lib/agents/ShieldingDesignAgent";
import { ValidationAgent } from "@/lib/agents/ValidationAgent";
import type { ShieldingDesignInput } from "@/lib/agents/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Bot, Play, Shield, AlertTriangle, CheckCircle2, Loader2,
  FileText, Zap,
} from "lucide-react";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export default function ShieldingDesignAgentDialog({ open, onOpenChange }: Props) {
  const [energy, setEnergy] = useState("6");
  const [workload, setWorkload] = useState("500");
  const [roomW, setRoomW] = useState("6");
  const [roomL, setRoomL] = useState("8");
  const [roomH, setRoomH] = useState("3.5");
  const [distN, setDistN] = useState("5");
  const [distS, setDistS] = useState("5");
  const [distE, setDistE] = useState("4");
  const [distW, setDistW] = useState("4");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [validation, setValidation] = useState<any[]>([]);
  const [showSteps, setShowSteps] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    setValidation([]);
    try {
      const designAgent = new ShieldingDesignAgent();
      const validationAgent = new ValidationAgent();

      const input: ShieldingDesignInput = {
        modality: "LINAC",
        energy: parseFloat(energy),
        workload: parseFloat(workload),
        roomDimensions: { width: parseFloat(roomW), length: parseFloat(roomL), height: parseFloat(roomH) },
        distances: { North: parseFloat(distN), South: parseFloat(distS), East: parseFloat(distE), West: parseFloat(distW) },
        materials: ["concrete"],
        goalDoseControlled: 0.4,
        goalDoseUncontrolled: 0.02,
        occupancy: { North: 0.2, South: 1.0, East: 0.5, West: 0.125 },
        useFactor: 0.25,
        specialConsiderations: parseFloat(energy) > 10 ? ["neutrons"] : [],
      };

      const design = await designAgent.design(input);
      const issues = await validationAgent.validate({
        design, energy: parseFloat(energy), modality: "LINAC", country: "MX",
      });

      setResult(design);
      setValidation(issues);
      toast.success(`Design complete: ${design.barriers.length} barriers, ${issues.length} validation items`);
    } catch (err: any) {
      toast.error(`Agent error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const errorCount = validation.filter(i => i.severity === "error").length;
  const warningCount = validation.filter(i => i.severity === "warning").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Bot className="h-5 w-5 text-emerald-500" />
            Shielding Design Agent <Badge className="text-[9px] bg-emerald-100 text-emerald-700">Fase 3</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Inputs */}
        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-[10px]">Energy (MV)</Label>
            <Input value={energy} onChange={e => setEnergy(e.target.value)} className="h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Workload (Gy/wk)</Label>
            <Input value={workload} onChange={e => setWorkload(e.target.value)} className="h-8 text-xs" /></div>
          <div><Label className="text-[10px]">Room W x L x H (m)</Label>
            <div className="flex gap-1">
              <Input value={roomW} onChange={e => setRoomW(e.target.value)} className="h-8 text-xs" />
              <Input value={roomL} onChange={e => setRoomL(e.target.value)} className="h-8 text-xs" />
              <Input value={roomH} onChange={e => setRoomH(e.target.value)} className="h-8 text-xs" />
            </div></div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[["North", distN, setDistN], ["South", distS, setDistS], ["East", distE, setDistE], ["West", distW, setDistW]].map(([name, val, setter]: any) => (
            <div key={name}><Label className="text-[10px]">{name} dist (m)</Label>
              <Input value={val} onChange={e => setter(e.target.value)} className="h-8 text-xs" /></div>
          ))}
        </div>

        <Button onClick={handleRun} disabled={isRunning} size="sm" className="w-full">
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
          {isRunning ? "Agent running..." : "Run Shielding Design Agent"}
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-3">
            <Separator />

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-2 text-center">
                  <p className="text-[8px] text-emerald-600">Barriers</p>
                  <p className="text-lg font-bold text-emerald-800">{result.barriers.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-2 text-center">
                  <p className="text-[8px] text-blue-600">Concrete</p>
                  <p className="text-lg font-bold text-blue-800">{result.totalConcreteVolume} m³</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-2 text-center">
                  <p className="text-[8px] text-amber-600">Est. Cost</p>
                  <p className="text-lg font-bold text-amber-800">${result.estimatedCost?.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Validation */}
            {validation.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-medium">Validation Results</span>
                  {errorCount > 0 && <Badge variant="destructive" className="text-[9px]">{errorCount} errors</Badge>}
                  {warningCount > 0 && <Badge variant="secondary" className="text-[9px] bg-amber-100 text-amber-700">{warningCount} warnings</Badge>}
                </div>
                {validation.map((issue, i) => (
                  <Card key={i} className={`mb-1 ${issue.severity === "error" ? "border-red-200 bg-red-50" : issue.severity === "warning" ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50"}`}>
                    <CardContent className="p-2 flex items-start gap-2">
                      {issue.severity === "error" ? <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" /> :
                       issue.severity === "warning" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" /> :
                       <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />}
                      <div>
                        <p className="text-[10px] font-medium">{issue.rule}</p>
                        <p className="text-[9px] text-slate-600">{issue.message}</p>
                        <p className="text-[8px] text-slate-400 mt-0.5">{issue.recommendation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Barriers table */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-medium">Barrier Design</span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {result.barriers.map((b: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50 text-[10px]">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[8px] h-4 ${b.type === "primary" ? "bg-blue-50" : "bg-amber-50"}`}>{b.type}</Badge>
                      <span>{b.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{b.thicknessCm} cm</span>
                      <span className="text-slate-400">n={b.nTvls?.toFixed(2)}</span>
                      <Badge variant={b.meetsGoal ? "default" : "destructive"} className="text-[7px] h-3">{b.meetsGoal ? "OK" : "FAIL"}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Neutron */}
            {result.neutronRequirements && (
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-3">
                  <p className="text-[10px] font-medium text-purple-700 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Neutron Shielding Required
                  </p>
                  {result.neutronRequirements.map((r: string, i: number) => (
                    <p key={i} className="text-[9px] text-purple-600 ml-4">• {r}</p>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
