import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Proxy de Next.js 16 (antes `middleware.ts`).
 * Mantiene viva la sesión de Supabase en cada navegación.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Corre en todo excepto assets estáticos e imágenes:
     * - _next/static, _next/image
     * - favicon.ico
     * - archivos de imagen comunes
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
