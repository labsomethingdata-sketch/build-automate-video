import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getActiveWorkspace,
  getProjects,
  getWorkspaceCostUsd,
} from "@/lib/data";
import { stateBadgeClass, stateLabel } from "@/lib/pipeline";

export default async function DashboardPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/onboarding");

  const [projects, cost] = await Promise.all([
    getProjects(workspace.id),
    getWorkspaceCostUsd(workspace.id),
  ]);

  const inReview = projects.filter((p) => p.job.state === "review_pending").length;
  const done = projects.filter((p) => p.job.state === "plan_ready").length;
  const stats = [
    { label: "Proyectos", value: projects.length },
    { label: "En revisión", value: inReview },
    { label: "Completados", value: done },
    { label: "Costo total", value: `$${cost.toFixed(2)}` },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tus proyectos de edición en curso.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          <span className="text-base leading-none">+</span> Nuevo proyecto
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Proyectos recientes
        </h2>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aún no tienes proyectos.{" "}
                <Link href="/projects/new" className="text-primary hover:underline">
                  Crea el primero
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardContent className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-medium">{p.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {p.clientName ?? "Sin cliente"} · {p.createdAt}
                        </p>
                      </div>
                      <Badge className={stateBadgeClass[p.job.state]}>
                        {stateLabel(p.job.state)}
                      </Badge>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={
                          p.job.state === "failed"
                            ? "h-full rounded-full bg-red-500"
                            : "h-full rounded-full bg-primary"
                        }
                        style={{ width: `${p.job.progress}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
