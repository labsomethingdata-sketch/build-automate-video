import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getActiveWorkspace, getClients } from "@/lib/data";
import { createClientRecord } from "@/lib/actions";

export default async function ClientsPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/onboarding");
  const clients = await getClients(workspace.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Los canales que edita tu agencia.
        </p>
      </div>

      <Card>
        <CardContent>
          <form action={createClientRecord} className="flex gap-3">
            <input type="hidden" name="workspace_id" value={workspace.id} />
            <input
              name="name"
              required
              placeholder="Nombre del cliente / canal"
              className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            />
            <Button type="submit">Agregar</Button>
          </form>
        </CardContent>
      </Card>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no tienes clientes. Agrega el primero arriba.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  {c.name.slice(0, 2).toUpperCase()}
                </span>
                <p className="font-medium">{c.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
