import { redirect } from "next/navigation";

// La raíz redirige al panel. (Cuando el auth esté activo, redirigirá a /login
// si no hay sesión.)
export default function Home() {
  redirect("/dashboard");
}
