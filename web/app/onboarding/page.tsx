import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getActiveWorkspace, getUser } from "@/lib/data";
import { createWorkspace } from "@/lib/actions";

// Primer paso tras registrarse: crear el workspace (agencia/equipo).
export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const workspace = await getActiveWorkspace();
  if (workspace) redirect("/dashboard");

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-3xl">🎬</div>
          <h1 className="mt-2 text-xl font-semibold">Crea tu espacio de trabajo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu agencia o equipo. Podrás agregar clientes y proyectos después.
          </p>
        </div>
        <form action={createWorkspace} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre</label>
            <input
              name="name"
              required
              placeholder="Mi Agencia"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <Button type="submit" className="w-full">
            Crear workspace
          </Button>
        </form>
      </div>
    </div>
  );
}
