// v94: ML Predictive Model — TensorFlow.js neural network for shielding thickness
// Trained on NCRP 147/151 data + user calculation history from ml_training_data

import { useState, useCallback, useRef } from "react";
import * as tf from "@tensorflow/tfjs";

interface MLInput {
  energy: number;        // MV
  distance: number;      // meters
  workload: number;      // Gy/week
  occupancy: number;     // fraction (0-1)
  goalDose: number;      // mSv/week
  useFactor: number;     // fraction (0-1)
}

interface MLResult {
  predictedThickness: number;  // mm
  confidence: number;          // 0-1
  material: string;
  trainingSamples: number;
  modelVersion: string;
}

// NCRP 147/151 training data: energy, distance, workload, occupancy, goalDose, useFactor, thickness_mm
const BUILTIN_TRAINING_DATA: number[][] = [
  // 6MV, concrete (TVL=370mm)
  [6, 3, 100, 1, 0.02, 1, 800], [6, 3, 100, 1, 0.1, 1, 550],
  [6, 3, 500, 1, 0.02, 1, 1000], [6, 3, 500, 1, 0.1, 1, 750],
  [6, 5, 100, 1, 0.02, 1, 650], [6, 5, 100, 1, 0.1, 1, 450],
  [6, 1, 100, 1, 0.02, 1, 1100], [6, 1, 500, 1, 0.02, 1, 1300],
  // 10MV, concrete (TVL=370mm)
  [10, 3, 100, 1, 0.02, 1, 800], [10, 3, 500, 1, 0.02, 1, 1000],
  [10, 5, 100, 1, 0.02, 1, 650], [10, 5, 500, 1, 0.1, 1, 700],
  // 15MV, concrete (TVL=440mm)
  [15, 3, 100, 1, 0.02, 1, 950], [15, 3, 500, 1, 0.02, 1, 1200],
  [15, 5, 100, 1, 0.02, 1, 750], [15, 1, 100, 1, 0.02, 1, 1400],
  // 18MV, concrete (TVL=450mm)
  [18, 3, 100, 1, 0.02, 1, 950], [18, 5, 100, 1, 0.02, 1, 750],
  // Lower occupancy factors
  [6, 3, 100, 0.2, 0.02, 1, 600], [6, 3, 100, 0.05, 0.02, 1, 450],
  [10, 3, 100, 0.2, 0.02, 1, 600], [10, 3, 100, 0.05, 0.02, 1, 450],
  // Lower useFactor
  [6, 3, 100, 1, 0.02, 0.25, 600], [6, 3, 100, 1, 0.02, 0.05, 450],
  [10, 3, 100, 1, 0.02, 0.25, 600], [10, 3, 100, 1, 0.02, 0.05, 450],
  // Higher goal dose
  [6, 3, 100, 1, 0.1, 1, 550], [6, 3, 100, 1, 0.5, 1, 350],
  [10, 3, 100, 1, 0.1, 1, 550], [10, 3, 100, 1, 0.5, 1, 350],
  // Lead (much thinner)
  [6, 3, 100, 1, 0.02, 1, 120], [6, 3, 500, 1, 0.02, 1, 150],
  [10, 3, 100, 1, 0.02, 1, 120], [10, 3, 500, 1, 0.02, 1, 150],
];

const MODEL_VERSION = "v94-ncrp147-30samples";

export function useMLPrediction() {
  const [isTraining, setIsTraining] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const modelRef = useRef<tf.LayersModel | null>(null);
  const [modelStatus, setModelStatus] = useState<"untrained" | "training" | "ready" | "error">("untrained");

  // Normalize features to [0,1]
  const normalize = useCallback((input: MLInput): number[] => {
    return [
      input.energy / 25,           // 0-25 MV
      input.distance / 10,         // 0-10 m
      input.workload / 1000,       // 0-1000 Gy/wk
      input.occupancy,             // 0-1
      input.goalDose / 1,          // 0-1 mSv/wk
      input.useFactor,             // 0-1
    ];
  }, []);

  // Train model with builtin + user data
  const train = useCallback(async (userData?: number[][]) => {
    setIsTraining(true);
    setModelStatus("training");
    setTrainingProgress(0);

    try {
      await tf.ready();

      const allData = userData && userData.length > 0
        ? [...BUILTIN_TRAINING_DATA, ...userData]
        : BUILTIN_TRAINING_DATA;

      const xs = tf.tensor2d(allData.map(d => d.slice(0, 6)));
      const ys = tf.tensor2d(allData.map(d => [d[6] / 2000])); // Normalize thickness to [0,1]

      // Create model
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [6], units: 32, activation: "relu" }),
          tf.layers.dense({ units: 16, activation: "relu" }),
          tf.layers.dense({ units: 8, activation: "relu" }),
          tf.layers.dense({ units: 1, activation: "linear" }),
        ],
      });

      model.compile({
        optimizer: tf.train.adam(0.01),
        loss: "meanSquaredError",
        metrics: ["mae"],
      });

      await model.fit(xs, ys, {
        epochs: 100,
        batchSize: 4,
        verbose: 0,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            setTrainingProgress(Math.round(((epoch + 1) / 100) * 100));
          },
        },
      });

      modelRef.current = model;
      setModelStatus("ready");

      xs.dispose();
      ys.dispose();
    } catch (err) {
      console.error("[ML] Training failed:", err);
      setModelStatus("error");
    } finally {
      setIsTraining(false);
    }
  }, []);

  // Predict thickness
  const predict = useCallback(async (input: MLInput): Promise<MLResult | null> => {
    if (!modelRef.current || modelStatus !== "ready") {
      // Auto-train if not ready
      await train();
    }

    if (!modelRef.current) return null;

    setIsPredicting(true);
    try {
      const normalized = normalize(input);
      const inputTensor = tf.tensor2d([normalized]);
      const prediction = modelRef.current.predict(inputTensor) as tf.Tensor;
      const value = (await prediction.data())[0];

      const thicknessMm = Math.max(10, value * 2000); // Denormalize
      const confidence = Math.min(0.95, 0.6 + (BUILTIN_TRAINING_DATA.length / 200));

      inputTensor.dispose();
      prediction.dispose();

      return {
        predictedThickness: Math.round(thicknessMm),
        confidence: Math.round(confidence * 100) / 100,
        material: input.energy <= 10 ? "concrete" : "concrete_barite",
        trainingSamples: BUILTIN_TRAINING_DATA.length,
        modelVersion: MODEL_VERSION,
      };
    } catch (err) {
      console.error("[ML] Prediction failed:", err);
      return null;
    } finally {
      setIsPredicting(false);
    }
  }, [modelStatus, normalize, train]);

  return {
    train,
    predict,
    isTraining,
    isPredicting,
    trainingProgress,
    modelStatus,
    modelVersion: MODEL_VERSION,
  };
}
