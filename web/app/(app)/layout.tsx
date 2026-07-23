import { Sidebar } from "@/components/sidebar";

// Shell del área autenticada. TODO: cuando el auth esté activo, verificar sesión
// aquí (createClient server -> getUser) y redirigir a /login si no hay usuario.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
