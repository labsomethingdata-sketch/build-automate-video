import { describe, expect, it } from "vitest";
import {
  PIPELINE_STATES,
  stateBadgeClass,
  stateIndex,
  stateLabel,
} from "@/lib/pipeline";
import type { JobState } from "@/lib/types";

const ALL_STATES: JobState[] = [
  "uploaded",
  "transcribing",
  "planning_cuts",
  "review_pending",
  "rendering",
  "reframing",
  "proposing_visuals",
  "plan_ready",
  "failed",
];

describe("pipeline", () => {
  it("tiene las 8 etapas en orden", () => {
    expect(PIPELINE_STATES).toHaveLength(8);
    expect(PIPELINE_STATES[0].key).toBe("uploaded");
    expect(PIPELINE_STATES[7].key).toBe("plan_ready");
  });

  it("stateIndex ubica la etapa; failed no está en la secuencia", () => {
    expect(stateIndex("review_pending")).toBe(3);
    expect(stateIndex("plan_ready")).toBe(7);
    expect(stateIndex("failed")).toBe(-1);
  });

  it("stateLabel traduce y mapea failed → Error", () => {
    expect(stateLabel("plan_ready")).toBe("Plan listo");
    expect(stateLabel("failed")).toBe("Error");
  });

  it("hay una clase de badge para cada estado posible", () => {
    for (const s of ALL_STATES) {
      expect(stateBadgeClass[s]).toBeTruthy();
    }
  });
});
