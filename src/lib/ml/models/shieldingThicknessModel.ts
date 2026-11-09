/**
 * ═══════════════════════════════════════════════════════════
 * Shielding Thickness Predictor — TensorFlow.js
 * Regression model trained on NCRP 151 calculations
 * ═══════════════════════════════════════════════════════════
 */

import * as tf from "@tensorflow/tfjs";
import { generateTrainingDataset, normalizeFeatures, type FeatureNorms } from "../trainingData";

// Singleton model instance
let model: tf.LayersModel | null = null;
let norms: FeatureNorms | null = null;
let isTraining = false;

// Fase 8a: nueva clave para descartar modelos entrenados con los datos erróneos anteriores.
const MODEL_KEY = "radshield-thickness-model-v2";
const NORMS_KEY = "radshield-thickness-norms-v2";

// ─── Build neural network ───
function buildModel(): tf.LayersModel {
  const m = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [8], units: 64, activation: "relu" }),
      tf.layers.dropout({ rate: 0.1 }),
      tf.layers.dense({ units: 32, activation: "relu" }),
      tf.layers.dense({ units: 16, activation: "relu" }),
      tf.layers.dense({ units: 1, activation: "linear" }),
    ],
  });

  m.compile({
    optimizer: tf.train.adam(0.001),
    loss: "meanSquaredError",
    metrics: ["mse", "mae"],
  });

  return m;
}

// ─── Train model ───
export async function trainModel(
  epochs: number = 150,
  onEpoch?: (epoch: number, loss: number) => void
): Promise<{ loss: number; mae: number }> {
  if (isTraining) throw new Error("Training already in progress");
  isTraining = true;

  try {
    // Generate and normalize data
    const rawData = generateTrainingDataset(3000);
    const { xs, ys, norms: n } = normalizeFeatures(rawData);
    norms = n;

    // Create tensors
    const xTensor = tf.tensor2d(xs);
    const yTensor = tf.tensor2d(ys, [ys.length, 1]);

    // Build or reset model
    model = buildModel();

    // Train
    const history = await model.fit(xTensor, yTensor, {
      epochs,
      batchSize: 32,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (onEpoch && logs) {
            onEpoch(epoch + 1, logs.loss as number);
          }
        },
      },
    });

    const finalLoss = history.history.loss[history.history.loss.length - 1] as number;
    const finalMAE = history.history.mae?.[history.history.mae.length - 1] as number || 0;

    // Save to localStorage
    await saveModel();

    // Cleanup tensors
    xTensor.dispose();
    yTensor.dispose();

    return { loss: finalLoss, mae: finalMAE };
  } finally {
    isTraining = false;
  }
}

// ─── Predict thickness ───
export async function predictThickness(
  energy: number,
  distance: number,
  workload: number,
  occupancy: number,
  goalDose: number,
  useFactor: number,
  material: number,
  modality: number = 0
): Promise<{ predictedCm: number; confidence: "high" | "medium" | "low" }> {
  await loadModel();

  if (!model || !norms) {
    throw new Error("Model not loaded. Train first with trainModel().");
  }

  const { min, max, yMin = 0, yMax = 200 } = norms;

  // Normalize input
  const raw = [energy, distance, workload, occupancy, goalDose, useFactor, material, modality];
  const normalized = raw.map((v, i) => (v - min[i]) / (max[i] - min[i] + 1e-10));

  const input = tf.tensor2d([normalized]);
  const prediction = model.predict(input) as tf.Tensor;
  const normalizedValue = (await prediction.data())[0];

  // Denormalize
  const predictedCm = normalizedValue * (yMax - yMin) + yMin;

  input.dispose();
  prediction.dispose();

  // Confidence based on how close input is to training distribution
  const energyDist = Math.abs(energy - 14) / 20; // center ~14 MV
  const distDist = distance < 1.5 || distance > 8 ? 0.3 : 1.0;
  const confScore = Math.max(0, 1 - energyDist) * distDist;

  let confidence: "high" | "medium" | "low" = "medium";
  if (confScore > 0.7) confidence = "high";
  else if (confScore < 0.3) confidence = "low";

  return { predictedCm: Math.max(0, Math.round(predictedCm * 10) / 10), confidence };
}

// ─── Batch predict ───
export async function predictBatch(
  inputs: Array<{
    energy: number; distance: number; workload: number;
    occupancy: number; goalDose: number; useFactor: number;
    material: number; modality?: number;
  }>
): Promise<Array<{ predictedCm: number; confidence: "high" | "medium" | "low" }>> {
  const results: Array<{ predictedCm: number; confidence: "high" | "medium" | "low" }> = [];
  for (const input of inputs) {
    results.push(await predictThickness(
      input.energy, input.distance, input.workload,
      input.occupancy, input.goalDose, input.useFactor,
      input.material, input.modality ?? 0
    ));
  }
  return results;
}

// ─── Save/Load ───
async function saveModel(): Promise<void> {
  if (!model || !norms) return;
  try {
    await model.save(`localstorage://${MODEL_KEY}`);
    localStorage.setItem(NORMS_KEY, JSON.stringify(norms));
  } catch (e) {
    console.warn("Failed to save model:", e);
  }
}

export async function loadModel(): Promise<boolean> {
  if (model) return true;
  try {
    model = await tf.loadLayersModel(`localstorage://${MODEL_KEY}`);
    const normsStr = localStorage.getItem(NORMS_KEY);
    if (normsStr) norms = JSON.parse(normsStr);
    return true;
  } catch {
    return false;
  }
}

export function isModelLoaded(): boolean {
  return model !== null;
}

export function getTrainingStatus(): { isTraining: boolean; hasModel: boolean } {
  return { isTraining, hasModel: model !== null };
}
