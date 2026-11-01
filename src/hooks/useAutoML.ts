/**
 * ═══════════════════════════════════════════════════════════
 * useAutoML — Hook for ML-powered shielding predictions
 * Train, predict, and collect feedback for continuous improvement
 * ═══════════════════════════════════════════════════════════
 */

import { useState, useCallback, useEffect } from "react";
import {
  trainModel,
  predictThickness,
  loadModel
} from "@/lib/ml/models/shieldingThicknessModel";
import { detectAnomaly } from "@/lib/ml/models/anomalyDetector";
import { trpc } from "@/providers/trpc";

export interface MLPrediction {
  predictedCm: number;
  confidence: "high" | "medium" | "low";
  benchmarkCm: number;    // NCRP 151 formula result
  anomaly: {
    isAnomaly: boolean;
    score: number;
    severity: "none" | "warning" | "critical";
    reasons: string[];
  } | null;
  modelReady: boolean;
}

export function useAutoML() {
  const [modelReady, setModelReady] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingLoss, setTrainingLoss] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<MLPrediction | null>(null);
  const recordCalc = trpc.ml.recordCalculation.useMutation();

  // Check if model exists on mount
  useEffect(() => {
    loadModel().then(loaded => setModelReady(loaded));
  }, []);

  const train = useCallback(async () => {
    setIsTraining(true);
    setTrainingProgress(0);
    try {
      const result = await trainModel(150, (epoch, loss) => {
        setTrainingProgress(Math.round((epoch / 150) * 100));
        setTrainingLoss(loss);
      });
      setModelReady(true);
      return result;
    } finally {
      setIsTraining(false);
    }
  }, []);

  const predict = useCallback(async (
    energy: number,
    distance: number,
    workload: number,
    occupancy: number,
    goalDose: number,
    useFactor: number,
    material: number,
    materialName: string
  ): Promise<MLPrediction> => {
    // Calculate NCRP 151 benchmark
    const tvlTable: Record<string, Record<number, number>> = {
      concrete: { 4: 29, 6: 37, 10: 37, 15: 44, 18: 45, 20: 46, 24: 48 },
      barite: { 4: 18, 6: 21, 10: 24, 15: 28, 18: 30, 20: 32, 24: 35 },
      steel: { 4: 7, 6: 10, 10: 11, 15: 11, 18: 11, 20: 11, 24: 11 },
      lead: { 4: 4, 6: 5.7, 10: 5.7, 15: 5.7, 18: 5.7, 20: 5.7, 24: 5.7 },
    };

    const matNames = ["concrete", "barite", "steel", "lead"];
    const mat = matNames[material] || "concrete";
    const tvl = tvlTable[mat]?.[Math.round(energy)] || 37;
    const B = Math.max(1e-10, (goalDose * distance * distance) / (workload * useFactor * occupancy));
    const n = Math.max(0, -Math.log10(B));
    const benchmarkCm = Math.round(n * tvl * 10) / 10;

    let mlResult: Pick<MLPrediction, "predictedCm" | "confidence"> = {
      predictedCm: benchmarkCm,
      confidence: "low",
    };

    // Try ML prediction if model is ready
    const loaded = await loadModel();
    if (loaded) {
      try {
        mlResult = await predictThickness(energy, distance, workload, occupancy, goalDose, useFactor, material, 0);
      } catch {
        // Fallback to NCRP
        mlResult = { predictedCm: benchmarkCm, confidence: "low" };
      }
    }

    // Anomaly detection
    const anomaly = detectAnomaly(energy, distance, workload, occupancy, goalDose, useFactor, material, mlResult.predictedCm);

    const result: MLPrediction = {
      predictedCm: mlResult.predictedCm,
      confidence: mlResult.confidence,
      benchmarkCm,
      anomaly: anomaly.isAnomaly ? anomaly : null,
      modelReady: loaded,
    };

    setPrediction(result);

    // Record to backend for future training
    try {
      await recordCalc.mutateAsync({
        energy, distance, workload, occupancy, goalDose,
        useFactor, material, materialName,
        thickness: mlResult.predictedCm,
        method: loaded ? "ml" : "ncrp151",
      });
    } catch { /* silent */ }

    return result;
  }, [recordCalc]);

  const feedback = useCallback(async (
    energy: number,
    distance: number,
    workload: number,
    occupancy: number,
    goalDose: number,
    useFactor: number,
    material: number,
    materialName: string,
    actualThickness: number,
    wasAccurate: boolean
  ) => {
    // Record user's actual measurement for future training
    try {
      await recordCalc.mutateAsync({
        energy, distance, workload, occupancy, goalDose,
        useFactor, material, materialName,
        thickness: actualThickness,
        method: "user",
      });
    } catch { /* silent */ }

    return wasAccurate;
  }, [recordCalc]);

  return {
    modelReady,
    isTraining,
    trainingProgress,
    trainingLoss,
    prediction,
    train,
    predict,
    feedback,
  };
}
