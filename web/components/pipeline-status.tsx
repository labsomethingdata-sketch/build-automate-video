import { PIPELINE_STATES, stateIndex } from "@/lib/pipeline";
import type { JobState } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Stepper vertical con las 8 etapas del pipeline. */
export function PipelineStatus({
  state,
  progress,
}: {
  state: JobState;
  progress: number;
}) {
  const failed = state === "failed";
  const current = failed ? -1 : stateIndex(state);

  return (
    <div>
      {failed && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          El procesamiento falló ({progress}%). Revisa los logs del worker.
        </p>
      )}
      <ol className="relative space-y-4 pl-2">
        {PIPELINE_STATES.map((s, i) => {
          const done = !failed && i < current;
          const active = !failed && i === current;
          return (
            <li key={s.key} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  done && "border-emerald-500 bg-emerald-500",
                  active && "border-primary bg-primary",
                  !done && !active && "border-border bg-transparent",
                )}
              >
                {done && (
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-white">
                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" fill="none" />
                  </svg>
                )}
                {active && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm",
                    active ? "font-semibold text-foreground" : "text-foreground",
                    !done && !active && "text-muted-foreground",
                  )}
                >
                  {s.label}
                  {active && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      · {progress}%
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
