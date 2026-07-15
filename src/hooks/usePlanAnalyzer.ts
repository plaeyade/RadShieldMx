/**
 * ═══════════════════════════════════════════════════════════
 * usePlanAnalyzer — Hook for Computer Vision floor plan analysis
 * ═══════════════════════════════════════════════════════════
 */

import { useState, useCallback } from "react";
import { analyzeFloorPlan, drawAnalysisOverlay, type PlanAnalysis, type DetectedBarrier } from "@/lib/cv/planAnalyzer";
import { toast } from "sonner";

export interface UsePlanAnalyzerReturn {
  analyzing: boolean;
  progress: number;
  analysis: PlanAnalysis | null;
  barriers: DetectedBarrier[];
  analyze: (file: File) => Promise<void>;
  drawOverlay: (canvas: HTMLCanvasElement) => void;
  clear: () => void;
}

export function usePlanAnalyzer(): UsePlanAnalyzerReturn {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<PlanAnalysis | null>(null);

  const analyze = useCallback(async (file: File) => {
    setAnalyzing(true);
    setProgress(0);
    setAnalysis(null);

    try {
      // Load image
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
      });

      setProgress(20);

      // Run analysis
      const result = await analyzeFloorPlan(img);
      setProgress(100);
      setAnalysis(result);

      URL.revokeObjectURL(url);

      toast.success(`Analysis complete: ${result.barriers.length} walls, ${result.rooms.length} rooms detected`);
    } catch (err: any) {
      toast.error(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const drawOverlay = useCallback((canvas: HTMLCanvasElement) => {
    if (!analysis) return;
    drawAnalysisOverlay(canvas, analysis);
  }, [analysis]);

  const clear = useCallback(() => {
    setAnalysis(null);
    setProgress(0);
  }, []);

  return {
    analyzing,
    progress,
    analysis,
    barriers: analysis?.barriers || [],
    analyze,
    drawOverlay,
    clear,
  };
}
