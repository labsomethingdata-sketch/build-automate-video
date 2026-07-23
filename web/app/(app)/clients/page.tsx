import { Card, CardContent } from "@/components/ui/card";
import { mockClients, mockProjects } from "@/lib/mock";

export default function ClientsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Los canales que edita tu agencia.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockClients.map((c) => {
          const count = mockProjects.filter((p) => p.clientId === c.id).length;
          return (
            <Card key={c.id}>
              <CardContent className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  {c.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {count} {count === 1 ? "proyecto" : "proyectos"}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
