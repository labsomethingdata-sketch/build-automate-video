import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getActiveWorkspace, getClients } from "@/lib/data";
import { createProject } from "@/lib/actions";

export default async function NewProjectPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/onboarding");
  const clients = await getClients(workspace.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo proyecto</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe qué quieres lograr. (La subida del video y el procesamiento
          llegan en el siguiente paso.)
        </p>
      </div>

      <Card>
        <CardContent>
          <form action={createProject} className="space-y-5">
            <input type="hidden" name="workspace_id" value={workspace.id} />

            <div>
              <label className="mb-1 block text-sm font-medium">Título</label>
              <input
                name="title"
                required
                placeholder="Ej. Cómo empezar a invertir en 2026"
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Cliente</label>
              <select
                name="client_id"
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                <option value="">Sin cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {clients.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Aún no tienes clientes.{" "}
                  <Link href="/clients" className="text-primary hover:underline">
                    Agrega uno
                  </Link>
                  .
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Descripción de lo deseado
              </label>
              <textarea
                name="description"
                rows={4}
                placeholder="Tono, qué conservar/cortar, objetivo… Ej: educativo y directo, quitar divagaciones, sugerir apoyos visuales para las cifras."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Esto guía a la IA para decidir los cortes y proponer visuales.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link href="/dashboard">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit">Crear proyecto</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
