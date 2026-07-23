import type { JobState } from "./types";

/** Las 8 etapas del pipeline, en orden (el estado `failed` se maneja aparte). */
export const PIPELINE_STATES: {
  key: JobState;
  label: string;
  description: string;
}[] = [
  { key: "uploaded", label: "Subido", description: "Video y descripción recibidos" },
  { key: "transcribing", label: "Transcribiendo", description: "Transcript con timestamps" },
  { key: "planning_cuts", label: "Planeando cortes", description: "Decidiendo qué cortar" },
  { key: "review_pending", label: "Revisión", description: "Esperando tu aprobación" },
  { key: "rendering", label: "Renderizando", description: "Creando el video limpio" },
  { key: "reframing", label: "Reencuadre", description: "Proponiendo encuadres" },
  { key: "proposing_visuals", label: "Visuales", description: "Proponiendo apoyo gráfico" },
  { key: "plan_ready", label: "Plan listo", description: "plan.md generado" },
];

export function stateIndex(state: JobState): number {
  return PIPELINE_STATES.findIndex((s) => s.key === state);
}

export function stateLabel(state: JobState): string {
  if (state === "failed") return "Error";
  return PIPELINE_STATES.find((s) => s.key === state)?.label ?? state;
}

/** Clases Tailwind para el badge de cada estado. */
export const stateBadgeClass: Record<JobState, string> = {
  uploaded: "bg-muted text-muted-foreground",
  transcribing: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  planning_cuts: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  review_pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  rendering: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  reframing: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  proposing_visuals: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  plan_ready: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  failed: "bg-red-500/15 text-red-600 dark:text-red-400",
};
