/**
 * ═══════════════════════════════════════════════════════════
 * MLPredictionDialog v2 — Real ML with TensorFlow.js
 * Neural network regression trained on NCRP 151 data
 * ═══════════════════════════════════════════════════════════
 */

import { useState } from "react";
import { useAutoML } from "@/hooks/useAutoML";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Brain, ThumbsUp, ThumbsDown, AlertTriangle, Loader2, TrendingUp, Zap, ChevronDown, ChevronUp,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const MATERIALS = [
  { id: 0, name: "Concrete", density: "2.35 g/cm3", desc: "Standard shielding concrete" },
  { id: 1, name: "Barite Concrete", density: "3.2-3.5 g/cm3", desc: "High-density concrete" },
  { id: 2, name: "Steel", density: "7.8 g/cm3", desc: "Steel plates or composite" },
  { id: 3, name: "Lead", density: "11.3 g/cm3", desc: "Lead sheets or laminates" },
];

export default function MLPredictionDialog({ open, onOpenChange }: Props) {
  const {
    modelReady, isTraining, trainingProgress, trainingLoss,
    prediction, train, predict,
  } = useAutoML();

  const [energy, setEnergy] = useState("6");
  const [distance, setDistance] = useState("4.0");
  const [workload, setWorkload] = useState("500");
  const [occupancy, setOccupancy] = useState("1.0");
  const [goalDose, setGoalDose] = useState("0.02");
  const [useFactor, setUseFactor] = useState("1.0");
  const [material, setMaterial] = useState(0);
  const [isPredicting, setIsPredicting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handlePredict = async () => {
    setIsPredicting(true);
    try {
      await predict(
        parseFloat(energy),
        parseFloat(distance),
        parseFloat(workload),
        parseFloat(occupancy),
        parseFloat(goalDose),
        parseFloat(useFactor),
        material,
        MATERIALS[material].name
      );
    } catch (err: any) {
      toast.error(`Prediction error: ${err.message}`);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleTrain = async () => {
    try {
      const result = await train();
      toast.success(`Model trained! Loss: ${result.loss.toFixed(4)}, MAE: ${result.mae.toFixed(2)} cm`);
    } catch (err: any) {
      toast.error(`Training error: ${err.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-violet-500" />
            ML Shielding Predictor
            <Badge variant={modelReady ? "default" : "outline"} className="text-[9px]">
              {modelReady ? "Model Ready" : "Train Required"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Model status */}
        {!modelReady && !isTraining && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-3 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-800">ML Model not trained yet</p>
                <p className="text-[10px] text-amber-600">Train the neural network to enable ML predictions. Fallback: NCRP 151 formula.</p>
              </div>
              <Button size="sm" onClick={handleTrain} className="shrink-0 ml-auto">
                <Zap className="h-3.5 w-3.5 mr-1" />
                Train
              </Button>
            </CardContent>
          </Card>
        )}

        {isTraining && (
          <Card className="border-violet-200">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-violet-500 animate-spin" />
                <span className="text-xs font-medium">Training neural network... {trainingProgress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${trainingProgress}%` }} />
              </div>
              {trainingLoss && (
                <p className="text-[10px] text-slate-500">Loss: {trainingLoss.toFixed(6)}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Input parameters */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px]">Energy (MV)</Label>
            <Input type="number" value={energy} onChange={e => setEnergy(e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Distance (m)</Label>
            <Input type="number" value={distance} onChange={e => setDistance(e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Workload (Gy/wk)</Label>
            <Input type="number" value={workload} onChange={e => setWorkload(e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Occupancy (T)</Label>
            <Input type="number" value={occupancy} onChange={e => setOccupancy(e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Design Goal (mSv/wk)</Label>
            <select value={goalDose} onChange={e => setGoalDose(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input px-2">
              <option value="0.02">0.02 — Uncontrolled (public)</option>
              <option value="0.4">0.4 — Controlled (staff)</option>
            </select>
          </div>
          <div>
            <Label className="text-[10px]">Use Factor (U)</Label>
            <select value={useFactor} onChange={e => setUseFactor(e.target.value)} className="h-8 text-xs w-full rounded-md border border-input px-2">
              <option value="1.0">1.0 — Floor (primary always)</option>
              <option value="0.25">0.25 — Wall (rotating gantry)</option>
            </select>
          </div>
        </div>

        {/* Material selection */}
        <div>
          <Label className="text-[10px]">Material</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {MATERIALS.map(m => (
              <button
                key={m.id}
                onClick={() => setMaterial(m.id)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  material === m.id
                    ? "border-violet-400 bg-violet-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="text-[11px] font-medium">{m.name}</div>
                <div className="text-[9px] text-slate-500">{m.density}</div>
                <div className="text-[8px] text-slate-400">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Predict button */}
        <Button
          onClick={handlePredict}
          disabled={isPredicting || isTraining}
          className="w-full"
          size="sm"
        >
          {isPredicting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <TrendingUp className="h-4 w-4 mr-1.5" />
          )}
          {modelReady ? "Predict with ML + NCRP 151" : "Calculate with NCRP 151"}
        </Button>

        {/* Results */}
        {prediction && (
          <div className="space-y-3">
            <Separator />

            {/* Main prediction */}
            <Card className="bg-violet-50 border-violet-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-violet-600 uppercase tracking-wide">Predicted Thickness</p>
                    <p className="text-3xl font-bold text-violet-800">{prediction.predictedCm} cm</p>
                    <p className="text-[10px] text-violet-600">{MATERIALS[material].name}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={prediction.confidence === "high" ? "default" : prediction.confidence === "medium" ? "secondary" : "outline"} className="text-[9px]">
                      {prediction.confidence} confidence
                    </Badge>
                    <p className="text-[9px] text-violet-500 mt-1">
                      NCRP 151: {prediction.benchmarkCm} cm
                    </p>
                    {modelReady && (
                      <p className="text-[9px] text-violet-500">
                        ML {prediction.predictedCm < prediction.benchmarkCm * 0.8 ? "(conservative)" : prediction.predictedCm > prediction.benchmarkCm * 1.2 ? "(generous)" : "(aligned)"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Anomaly warnings */}
            {prediction.anomaly && (
              <Card className={prediction.anomaly.severity === "critical" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${prediction.anomaly.severity === "critical" ? "text-red-500" : "text-amber-500"}`} />
                    <span className={`text-xs font-medium ${prediction.anomaly.severity === "critical" ? "text-red-700" : "text-amber-700"}`}>
                      Anomaly Detected (score: {Math.round(prediction.anomaly.score * 100)}/100)
                    </span>
                  </div>
                  <ul className="mt-1.5 space-y-0.5">
                    {prediction.anomaly.reasons.map((r, i) => (
                      <li key={i} className="text-[10px] text-red-600 flex gap-1.5">
                        <span>•</span>{r}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Comparison table */}
            <button onClick={() => setShowDetails(!showDetails)} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-violet-600">
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showDetails ? "Hide details" : "Show comparison details"}
            </button>

            {showDetails && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <Card>
                  <CardContent className="p-2">
                    <p className="text-[8px] text-slate-500">ML Prediction</p>
                    <p className="text-sm font-bold text-violet-600">{prediction.predictedCm} cm</p>
                    <Badge variant="outline" className="text-[7px] mt-1">{prediction.confidence}</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-2">
                    <p className="text-[8px] text-slate-500">NCRP 151</p>
                    <p className="text-sm font-bold text-blue-600">{prediction.benchmarkCm} cm</p>
                    <Badge variant="outline" className="text-[7px] mt-1">formula</Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-2">
                    <p className="text-[8px] text-slate-500">Difference</p>
                    <p className="text-sm font-bold text-slate-600">
                      {Math.abs(prediction.predictedCm - prediction.benchmarkCm).toFixed(1)} cm
                    </p>
                    <p className="text-[7px] text-slate-400">
                      {prediction.benchmarkCm > 0 ? Math.round((prediction.predictedCm / prediction.benchmarkCm - 1) * 100) : 0}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-[10px]" onClick={() => toast.success("Prediction accepted")}>
                <ThumbsUp className="h-3 w-3 mr-1" />
                Accept
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-[10px]" onClick={() => toast.info("Please adjust parameters")}>
                <ThumbsDown className="h-3 w-3 mr-1" />
                Reject
              </Button>
              {!modelReady && (
                <Button size="sm" className="flex-1 text-[10px]" onClick={handleTrain}>
                  <Zap className="h-3 w-3 mr-1" />
                  Train ML
                </Button>
              )}
            </div>
          </div>
        )}

        <p className="text-[9px] text-slate-400 text-center">
          ML model trained on 3,000+ NCRP 151 calculations. Verify all predictions independently.
        </p>
      </DialogContent>
    </Dialog>
  );
}
