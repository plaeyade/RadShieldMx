/**
 * ═══════════════════════════════════════════════════════════
 * useAutoML — Hook for ML-powered shielding predictions
 * Train, predict, and collect feedback for continuous improvement
 * ═══════════════════════════════════════════════════════════
 */

import { useState, useCallback, useEffect } from "react";
import { espesorReferenciaNCRP151 } from '@/lib/ml/trainingData';
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
    // Benchmark NCRP 151 (Fase 8a: `barreraMV`; antes mezclaba mSv con Gy, ≈ 3 TVL de menos)
    const matNames = ["concrete", "barite", "steel", "lead"];
    const mat = matNames[material] || "concrete";
    const benchmarkCm = Math.round(espesorReferenciaNCRP151(energy, distance, workload, occupancy, goalDose, useFactor, mat) * 10) / 10;

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
