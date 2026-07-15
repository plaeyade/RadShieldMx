// v95: 5 Floor Plan Features for Canvas
// 1. AI Timeline Generator, 2. Easy Floor Planning, 3. Electrical Plans
// 4. Plumbing Drawings, 5. Advanced Diagramming

import { useState, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// 1. AI TIMELINE GENERATOR — Auto-generate construction timelines from floor plan
// ═══════════════════════════════════════════════════════════════════════════════

export interface TimelinePhase {
  id: string;
  name: string;
  duration: number; // days
  startDay: number;
  dependencies: string[];
  color: string;
  category: "demolition" | "concrete" | "shielding" | "electrical" | "plumbing" | "finishing" | "inspection";
}

export function useAITimeline() {
  const [timeline, setTimeline] = useState<TimelinePhase[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTimeline = useCallback((barrierCount: number, sourceCount: number, hasMaze: boolean) => {
    setIsGenerating(true);
    const phases: TimelinePhase[] = [
      { id: "demo", name: "Demolicion / Preparacion", duration: 5, startDay: 0, dependencies: [], color: "#ef4444", category: "demolition" },
      { id: "foundation", name: "Cimentacion", duration: 7, startDay: 5, dependencies: ["demo"], color: "#f97316", category: "concrete" },
      { id: "walls", name: `Muros de blindaje (${barrierCount} barreras)`, duration: Math.max(7, barrierCount * 3), startDay: 12, dependencies: ["foundation"], color: "#eab308", category: "shielding" },
      { id: "maze", name: "Construccion de laberinto", duration: hasMaze ? 10 : 0, startDay: 12 + Math.max(7, barrierCount * 3), dependencies: ["walls"], color: "#8b5cf6", category: "shielding" },
      { id: "electrical", name: "Instalacion electrica", duration: 5, startDay: 12 + Math.max(7, barrierCount * 3) + (hasMaze ? 10 : 0), dependencies: ["walls", "maze"], color: "#06b6d4", category: "electrical" },
      { id: "plumbing", name: "Instalacion hidraulica", duration: 4, startDay: 12 + Math.max(7, barrierCount * 3) + (hasMaze ? 10 : 0), dependencies: ["walls", "maze"], color: "#3b82f6", category: "plumbing" },
      { id: "doors", name: "Blindaje de puertas", duration: 3, startDay: 12 + Math.max(7, barrierCount * 3) + (hasMaze ? 10 : 0) + 3, dependencies: ["electrical"], color: "#a855f7", category: "shielding" },
      { id: "equipment", name: `Instalacion de equipos (${sourceCount} fuentes)`, duration: Math.max(3, sourceCount * 2), startDay: 12 + Math.max(7, barrierCount * 3) + (hasMaze ? 10 : 0) + 6, dependencies: ["doors", "plumbing"], color: "#10b981", category: "finishing" },
      { id: "commissioning", name: "Pruebas de blindaje (CNSNS)", duration: 7, startDay: 12 + Math.max(7, barrierCount * 3) + (hasMaze ? 10 : 0) + 6 + Math.max(3, sourceCount * 2), dependencies: ["equipment"], color: "#f43f5e", category: "inspection" },
      { id: "final", name: "Entrega final", duration: 2, startDay: 12 + Math.max(7, barrierCount * 3) + (hasMaze ? 10 : 0) + 6 + Math.max(3, sourceCount * 2) + 7, dependencies: ["commissioning"], color: "#22c55e", category: "finishing" },
    ].filter((p): p is TimelinePhase => p.duration > 0);

    setTimeline(phases);
    setIsGenerating(false);
    return phases;
  }, []);

  return { timeline, isGenerating, generateTimeline };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. EASY FLOOR PLANNING — Smart snap-to-grid + room templates
// ═══════════════════════════════════════════════════════════════════════════════

export interface RoomTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  type: string;
  color: string;
}

const DEFAULT_TEMPLATES: RoomTemplate[] = [
  { id: "linac", name: "Sala LINAC", width: 800, height: 700, type: "therapy", color: "#dbeafe" },
  { id: "bunker", name: "Bunker principal", width: 600, height: 600, type: "therapy", color: "#fef3c7" },
  { id: "control", name: "Sala de control", width: 300, height: 250, type: "control", color: "#d1fae5" },
  { id: "ct", name: "Sala CT", width: 500, height: 450, type: "diagnostic", color: "#fce7f3" },
  { id: "petct", name: "Sala PET/CT", width: 600, height: 500, type: "diagnostic", color: "#f3e8ff" },
  { id: "rf", name: "Sala R&F", width: 550, height: 450, type: "diagnostic", color: "#ffedd5" },
  { id: "mri", name: "Sala MRI", width: 500, height: 500, type: "diagnostic", color: "#ccfbf1" },
  { id: "mammo", name: "Sala Mamografia", width: 350, height: 300, type: "diagnostic", color: "#fecdd3" },
  { id: "dexa", name: "Sala DEXA", width: 300, height: 250, type: "diagnostic", color: "#e0e7ff" },
  { id: "waiting", name: "Sala de espera", width: 400, height: 300, type: "support", color: "#f1f5f9" },
  { id: "dressing", name: "Vestidor", width: 200, height: 150, type: "support", color: "#f8fafc" },
  { id: "brachy", name: "Sala Braquiterapia", width: 450, height: 400, type: "therapy", color: "#fef9c3" },
];

export function useEasyFloorPlanning() {
  const [templates] = useState<RoomTemplate[]>(DEFAULT_TEMPLATES);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(25); // cm

  const snap = useCallback((value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  return { templates, snapToGrid, setSnapToGrid, gridSize, setGridSize, snap };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ELECTRICAL PLANS — Symbols and drawing for electrical layouts
// ═══════════════════════════════════════════════════════════════════════════════

export interface ElectricalSymbol {
  id: string;
  name: string;
  type: "outlet" | "switch" | "light" | "panel" | "ground" | "emergency" | "ups";
  x: number;
  y: number;
}

export function useElectricalPlans() {
  const [symbols, setSymbols] = useState<ElectricalSymbol[]>([]);

  const addSymbol = useCallback((symbol: Omit<ElectricalSymbol, "id">) => {
    setSymbols(prev => [...prev, { ...symbol, id: `elec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }]);
  }, []);

  const removeSymbol = useCallback((id: string) => {
    setSymbols(prev => prev.filter(s => s.id !== id));
  }, []);

  const clearSymbols = useCallback(() => setSymbols([]), []);

  // Pre-defined symbol positions for common rooms
  const generateForRoom = useCallback((roomX: number, roomY: number, roomW: number, roomH: number, roomType: string) => {
    const newSymbols: ElectricalSymbol[] = [];
    const centerX = roomX + roomW / 2;
    const centerY = roomY + roomH / 2;

    // Every room gets lights
    newSymbols.push(
      { id: `elec_light_${Date.now()}_1`, name: "Luz central", type: "light", x: centerX, y: centerY },
      { id: `elec_outlet_${Date.now()}_1`, name: "Toma corriente", type: "outlet", x: roomX + 30, y: roomY + 30 },
      { id: `elec_ground_${Date.now()}_1`, name: "Tierra fisica", type: "ground", x: roomX + roomW - 30, y: roomY + 30 },
    );

    if (roomType === "therapy" || roomType === "diagnostic") {
      newSymbols.push(
        { id: `elec_panel_${Date.now()}_1`, name: "Panel electrico", type: "panel", x: roomX + 50, y: roomY + roomH - 50 },
        { id: `elec_emer_${Date.now()}_1`, name: "Luz emergencia", type: "emergency", x: roomX + roomW - 50, y: roomY + 50 },
      );
    }

    if (roomType === "therapy") {
      newSymbols.push(
        { id: `elec_ups_${Date.now()}_1`, name: "UPS LINAC", type: "ups", x: roomX + 80, y: roomY + roomH - 80 },
      );
    }

    setSymbols(prev => [...prev, ...newSymbols]);
    return newSymbols;
  }, []);

  return { symbols, addSymbol, removeSymbol, clearSymbols, generateForRoom };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PLUMBING DRAWINGS — Hydraulic symbols and drainage
// ═══════════════════════════════════════════════════════════════════════════════

export interface PlumbingSymbol {
  id: string;
  name: string;
  type: "sink" | "drain" | "pipe" | "valve" | "water_heater" | "sewer" | "hose_bib";
  x: number;
  y: number;
}

export function usePlumbingDrawings() {
  const [symbols, setSymbols] = useState<PlumbingSymbol[]>([]);

  const addSymbol = useCallback((symbol: Omit<PlumbingSymbol, "id">) => {
    setSymbols(prev => [...prev, { ...symbol, id: `plumb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }]);
  }, []);

  const removeSymbol = useCallback((id: string) => {
    setSymbols(prev => prev.filter(s => s.id !== id));
  }, []);

  const clearSymbols = useCallback(() => setSymbols([]), []);

  return { symbols, addSymbol, removeSymbol, clearSymbols };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ADVANCED DIAGRAMMING — Flowcharts, annotations, measurements
// ═══════════════════════════════════════════════════════════════════════════════

export interface DiagramElement {
  id: string;
  type: "arrow" | "text" | "dimension" | "callout" | "cloud" | "highlight";
  x: number;
  y: number;
  content: string;
  color?: string;
  angle?: number;
}

export function useAdvancedDiagramming() {
  const [elements, setElements] = useState<DiagramElement[]>([]);
  const [activeTool, setActiveTool] = useState<DiagramElement["type"]>("arrow");

  const addElement = useCallback((el: Omit<DiagramElement, "id">) => {
    setElements(prev => [...prev, { ...el, id: `diag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }]);
  }, []);

  const removeElement = useCallback((id: string) => {
    setElements(prev => prev.filter(e => e.id !== id));
  }, []);

  const clearElements = useCallback(() => setElements([]), []);

  // Generate automatic callouts for a floor plan
  const autoAnnotate = useCallback((barriers: Array<{ name?: string; barrierType?: string; materialCode?: string; requiredThickness_mm?: number }>, sources: Array<{ name?: string; modality?: { name?: string } | null }>) => {
    const annotations: DiagramElement[] = [];
    barriers.forEach((b, i) => {
      annotations.push({
        id: `diag_auto_${Date.now()}_b${i}`,
        type: "callout",
        x: 100 + i * 150, y: 50,
        content: `${b.name || "Barrera"}: ${b.materialCode || "?"} ${Math.round((b.requiredThickness_mm || 0) * 10) / 10}mm`,
        color: "#f59e0b",
      });
    });
    sources.forEach((s, i) => {
      annotations.push({
        id: `diag_auto_${Date.now()}_s${i}`,
        type: "cloud",
        x: 100 + i * 150, y: 500,
        content: `${s.name || "Fuente"}: ${s.modality?.name || "?"}`,
        color: "#3b82f6",
      });
    });
    setElements(prev => [...prev, ...annotations]);
    return annotations;
  }, []);

  return { elements, activeTool, setActiveTool, addElement, removeElement, clearElements, autoAnnotate };
}
