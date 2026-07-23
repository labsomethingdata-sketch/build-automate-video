import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión de Supabase en cada request y reenvía las cookies
 * actualizadas. Se invoca desde `proxy.ts` (el "middleware" de Next.js 16).
 *
 * Si aún no hay credenciales de Supabase (dev sin configurar), hace no-op para
 * que la UI base sea navegable. IMPORTANTE: no metas lógica entre
 * `createServerClient` y `getUser()`.
 */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sin credenciales todavía: no-op (permite correr la UI en dev).
  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresca el token si expiró (lee/escribe las cookies de sesión).
  await supabase.auth.getUser();

  return supabaseResponse;
}
