import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getActiveWorkspace, getUser } from "@/lib/data";

// Shell del área autenticada: exige sesión y carga workspace + usuario.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const workspace = await getActiveWorkspace();

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar
        workspaceName={workspace?.name ?? "Sin workspace"}
        userLabel={user.email ?? "Usuario"}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
