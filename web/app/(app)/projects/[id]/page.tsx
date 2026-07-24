import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PipelineStatus } from "@/components/pipeline-status";
import { getProject } from "@/lib/data";
import { stateBadgeClass, stateLabel } from "@/lib/pipeline";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const { state } = project.job;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver al panel
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.clientName ?? "Sin cliente"} · {project.createdAt}
          </p>
        </div>
        <Badge className={stateBadgeClass[state]}>{stateLabel(state)}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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

          {state === "uploaded" && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-medium">Procesamiento</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  El proyecto está creado. La subida del video y el pipeline
                  (transcripción → cortes → plan) se conectan en el siguiente paso.
                </p>
                <Button disabled>Iniciar procesamiento (próximamente)</Button>
              </CardContent>
            </Card>
          )}

          {state === "plan_ready" && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-medium">Plan listo</h2>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button>Descargar plan.md</Button>
                <Button variant="outline">Descargar video limpio</Button>
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
