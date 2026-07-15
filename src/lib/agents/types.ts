/**
 * ═══════════════════════════════════════════════════════════
 * Agent Types — Fase 3: Autonomous Agents
 * ═══════════════════════════════════════════════════════════
 */

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  execute: (params: Record<string, any>) => Promise<any>;
}

export interface AgentStep {
  id: string;
  agent: string;
  action: string;
  params: Record<string, any>;
  result?: any;
  error?: string;
  status: "pending" | "running" | "completed" | "failed";
  startTime?: Date;
  endTime?: Date;
}

export interface AgentRunResult {
  success: boolean;
  steps: AgentStep[];
  finalAnswer: string;
  durationMs: number;
  citations: string[];
}

export interface ValidationIssue {
  severity: "error" | "warning" | "info";
  rule: string;
  message: string;
  recommendation: string;
  reference: string;
}

export interface ShieldingDesignInput {
  modality: "LINAC" | "Co-60" | "GammaKnife" | "CyberKnife" | "Tomotherapy" | "PET/CT" | "Cyclotron";
  energy: number;           // MV or MeV
  workload: number;         // Gy/week or patients/week
  roomDimensions: { width: number; length: number; height: number }; // meters
  distances: Record<string, number>; // barrier name -> distance in meters
  materials: string[];      // preferred materials
  goalDoseControlled: number;   // mSv/week
  goalDoseUncontrolled: number; // mSv/week
  occupancy: Record<string, number>; // area -> T factor
  useFactor: number;
  specialConsiderations?: string[]; // "IMRT", "neutrons", "skyshine", etc.
}

export interface ShieldingDesignOutput {
  barriers: Array<{
    name: string;
    type: "primary" | "secondary" | "maze" | "door" | "roof";
    material: string;
    thicknessCm: number;
    transmissionFactor: number;
    nTvls: number;
    meetsGoal: boolean;
    notes: string[];
  }>;
  totalConcreteVolume: number; // m3
  estimatedCost: number;       // USD
  neutronRequirements?: string[];
  validationIssues: ValidationIssue[];
  references: string[];
}
