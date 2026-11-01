/**
 * ═══════════════════════════════════════════════════════════
 * AgentRuntime — Multi-step reasoning engine
 * Executes agent plans with tools, tracks state, handles errors
 * ═══════════════════════════════════════════════════════════
 */

import type { AgentStep, AgentRunResult } from "./types";
import { getTool } from "./tools";

export class AgentRuntime {
  private steps: AgentStep[] = [];
  private stepCounter = 0;

  async executePlan(
    plan: Array<{ agent: string; action: string; params: Record<string, any> }>,
    options?: { maxSteps?: number; timeoutMs?: number }
  ): Promise<AgentRunResult> {
    const maxSteps = options?.maxSteps || 20;
    const timeoutMs = options?.timeoutMs || 60000;
    const startTime = Date.now();
    this.steps = [];
    this.stepCounter = 0;

    for (const task of plan.slice(0, maxSteps)) {
      if (Date.now() - startTime > timeoutMs) {
        this.addStep(task.agent, task.action, task.params, null, "Timeout exceeded", "failed");
        break;
      }

      const step = this.addStep(task.agent, task.action, task.params, undefined, undefined, "running");
      try {
        const tool = getTool(task.action);
        if (!tool) {
          step.error = `Tool '${task.action}' not found`;
          step.status = "failed";
          continue;
        }
        step.result = await tool.execute(task.params);
        step.status = "completed";
      } catch (e: any) {
        step.error = e.message;
        step.status = "failed";
      }
      step.endTime = new Date();
    }

    const success = this.steps.every(s => s.status === "completed");
    const citations = [...new Set(this.steps.filter(s => s.result?.reference).map(s => s.result.reference))];

    return {
      success,
      steps: this.steps,
      finalAnswer: this.generateSummary(),
      durationMs: Date.now() - startTime,
      citations,
    };
  }

  private addStep(
    agent: string, action: string, params: Record<string, any>,
    result?: any, error?: string, status: AgentStep["status"] = "pending"
  ): AgentStep {
    const step: AgentStep = {
      id: `step-${++this.stepCounter}`,
      agent, action, params, result, error, status,
      startTime: new Date(),
    };
    this.steps.push(step);
    return step;
  }

  private generateSummary(): string {
    const completed = this.steps.filter(s => s.status === "completed").length;
    const failed = this.steps.filter(s => s.status === "failed").length;
    const parts: string[] = [];

    for (const step of this.steps) {
      if (step.status === "completed" && step.result) {
        parts.push(`${step.action}: ${JSON.stringify(step.result).substring(0, 200)}`);
      } else if (step.status === "failed") {
        parts.push(`${step.action}: FAILED (${step.error})`);
      }
    }

    return `Agent execution: ${completed}/${this.steps.length} steps completed, ${failed} failed.\n\n${parts.join("\n")}`;
  }

  getSteps(): AgentStep[] {
    return this.steps;
  }
}
