import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PipelineStatus } from "@/components/pipeline-status";
import { getMockProject, clientName } from "@/lib/mock";
import { stateBadgeClass, stateLabel } from "@/lib/pipeline";

// Cortes propuestos de ejemplo (para el estado review_pending).
const mockCuts = [
  { start: "00:00:12", end: "00:00:19", reason: "Silencio largo al inicio" },
  { start: "00:01:03", end: "00:01:07", reason: "Muletilla repetida" },
  { start: "00:02:41", end: "00:03:10", reason: "Divagación fuera del tema" },
];

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getMockProject(id);
  if (!project) notFound();

  const { state } = project.job;

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
        ← Volver al panel
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {clientName(project.clientId)} · {project.createdAt}
          </p>
        </div>
        <Badge className={stateBadgeClass[state]}>{stateLabel(state)}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contenido principal */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Descripción de lo deseado</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {project.description ?? "Sin descripción."}
              </p>
            </CardContent>
          </Card>

          {state === "review_pending" && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Revisión de cortes</h2>
                <span className="text-xs text-muted-foreground">
                  {mockCuts.length} propuestos
                </span>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockCuts.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs">
                        {c.start} → {c.end}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.reason}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-md px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                        Aprobar
                      </button>
                      <button className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-500/10 dark:text-red-400">
                        Descartar
                      </button>
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Button>Aprobar y generar video limpio</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {state === "plan_ready" && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-medium">Plan listo</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  El video limpio y las propuestas de apoyo gráfico están listos.
                </p>
                <div className="flex gap-3">
                  <Button>Descargar plan.md</Button>
                  <Button variant="outline">Descargar video limpio</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {state === "failed" && (
            <Card>
              <CardContent>
                <p className="text-sm text-red-600 dark:text-red-400">
                  El procesamiento falló. Revisa los logs del worker y reintenta.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Estado del pipeline */}
        <Card className="h-fit">
          <CardHeader>
            <h2 className="text-sm font-medium">Estado del pipeline</h2>
          </CardHeader>
          <CardContent>
            <PipelineStatus state={state} progress={project.job.progress} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
