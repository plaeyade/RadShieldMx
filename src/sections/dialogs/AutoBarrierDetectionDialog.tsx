/**
 * ═══════════════════════════════════════════════════════════
 * AutoBarrierDetectionDialog v3 — Real Computer Vision
 * Canny edge + Hough transform detects walls, doors, rooms
 * ═══════════════════════════════════════════════════════════
 */

import { useState, useRef, useCallback } from "react";
import { usePlanAnalyzer } from "@/hooks/usePlanAnalyzer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ScanLine, Upload, Loader2, Trash2, Eye, EyeOff, Shield, Square, Ruler, FileImage, Layers, CheckCircle2,
} from "lucide-react";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export default function AutoBarrierDetectionDialog({ open, onOpenChange }: Props) {
  const { analyzing, progress, analysis, barriers, analyze, drawOverlay, clear } = usePlanAnalyzer();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG)");
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    await analyze(file);
  }, [analyze]);

  const handleClear = () => {
    clear();
    setPreviewUrl(null);
  };

  const renderPreview = useCallback(() => {
    if (!previewUrl || !canvasRef.current || !analysis) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      if (showOverlay) {
        drawOverlay(canvas);
      }
    };
    img.src = previewUrl;
  }, [previewUrl, analysis, showOverlay, drawOverlay]);

  // Re-render when overlay toggle changes
  useState(() => renderPreview());

  const roomCount = analysis?.rooms.length || 0;
  const wallCount = barriers.filter(b => b.type === "wall").length;
  const avgConfidence = barriers.length > 0
    ? Math.round(barriers.reduce((s, b) => s + b.confidence, 0) / barriers.length * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-5 w-5 text-indigo-500" />
            Auto-Barrier Detection <Badge className="text-[9px] bg-indigo-100 text-indigo-700">CV v3</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Upload area */}
        {!previewUrl && (
          <label className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all">
            <FileImage className="h-10 w-10 text-slate-400 mb-3" />
            <p className="text-sm font-medium text-slate-700">Upload floor plan image</p>
            <p className="text-[11px] text-slate-500 mt-1">PNG, JPG, JPEG — max 10MB</p>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        )}

        {/* Preview canvas */}
        {previewUrl && (
          <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button size="sm" variant={showOverlay ? "default" : "outline"} onClick={() => setShowOverlay(!showOverlay)}>
                  {showOverlay ? <Eye className="h-3.5 w-3.5 mr-1" /> : <EyeOff className="h-3.5 w-3.5 mr-1" />}
                  {showOverlay ? "Overlay ON" : "Overlay OFF"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleClear}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
              </div>
              <label className="cursor-pointer">
                <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-slate-100">
                  <Upload className="h-3 w-3 mr-1" /> Change image
                </Badge>
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
            </div>

            {/* Canvas */}
            <div className="border rounded-lg overflow-hidden bg-slate-50">
              <canvas
                ref={canvasRef}
                style={{ maxWidth: "100%", height: "auto", display: "block" }}
              />
              {!analysis && analyzing && (
                <div className="p-4">
                  <Progress value={progress} className="h-2" />
                  <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {progress < 20 ? "Loading image..." : progress < 50 ? "Canny edge detection..." : progress < 80 ? "Hough line transform..." : "Extracting barriers..."}
                  </p>
                </div>
              )}
            </div>

            {/* Results */}
            {analysis && (
              <div className="space-y-3">
                <Separator />

                {/* Stats cards */}
                <div className="grid grid-cols-4 gap-2">
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="p-2 text-center">
                      <Shield className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-emerald-800">{wallCount}</p>
                      <p className="text-[8px] text-emerald-600">Walls detected</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-2 text-center">
                      <Square className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-blue-800">{roomCount}</p>
                      <p className="text-[8px] text-blue-600">Rooms found</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-violet-50 border-violet-200">
                    <CardContent className="p-2 text-center">
                      <CheckCircle2 className="h-4 w-4 text-violet-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-violet-800">{avgConfidence}%</p>
                      <p className="text-[8px] text-violet-600">Avg confidence</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-2 text-center">
                      <Ruler className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-amber-800">{analysis.scaleEstimate.toFixed(1)}</p>
                      <p className="text-[8px] text-amber-600">px/m estimated</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Barrier list */}
                {barriers.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium flex items-center gap-1 mb-2">
                      <Layers className="h-3.5 w-3.5" /> Detected Barriers
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {barriers.slice(0, 30).map((b, i) => (
                        <div key={b.id} className="flex items-center justify-between p-1.5 rounded bg-slate-50 text-[10px]">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[7px] h-3 px-1 ${b.isHorizontal ? "bg-emerald-50" : "bg-blue-50"}`}>
                              {b.isHorizontal ? "H" : "V"}
                            </Badge>
                            <span className="font-medium">{b.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">{Math.round(b.lengthPx)}px</span>
                            <span className="text-slate-400">t={b.thickness}px</span>
                            <Badge variant={b.confidence > 0.7 ? "default" : b.confidence > 0.4 ? "secondary" : "outline"} className="text-[7px] h-3">
                              {Math.round(b.confidence * 100)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {barriers.length > 30 && (
                        <p className="text-[9px] text-slate-400 text-center">+{barriers.length - 30} more barriers</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Processing info */}
                <p className="text-[9px] text-slate-400 text-center">
                  Computer Vision: Canny edge → Hough transform → Wall extraction | {analysis.processingTimeMs}ms
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
