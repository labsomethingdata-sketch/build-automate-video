import type { Client, Project, Workspace } from "./types";

// Datos de ejemplo para navegar la UI sin backend. Se reemplazan por
// consultas a Supabase cuando conectemos credenciales.

export const mockWorkspace: Workspace = { id: "ws_1", name: "Mi Agencia" };

export const mockClients: Client[] = [
  { id: "cl_1", workspaceId: "ws_1", name: "Canal Finanzas" },
  { id: "cl_2", workspaceId: "ws_1", name: "Tech con Ana" },
  { id: "cl_3", workspaceId: "ws_1", name: "Cocina Express" },
];

export const mockProjects: Project[] = [
  {
    id: "p_1",
    workspaceId: "ws_1",
    clientId: "cl_1",
    title: "Cómo empezar a invertir en 2026",
    description: "Educativo, tono cercano. Quitar divagaciones y muletillas.",
    createdAt: "2026-07-21",
    job: { id: "j_1", state: "review_pending", progress: 40 },
  },
  {
    id: "p_2",
    workspaceId: "ws_1",
    clientId: "cl_2",
    title: "Review: el mejor laptop calidad/precio",
    description: "Dinámico, con cortes rápidos. Sugerir b-roll de producto.",
    createdAt: "2026-07-20",
    job: { id: "j_2", state: "plan_ready", progress: 100 },
  },
  {
    id: "p_3",
    workspaceId: "ws_1",
    clientId: "cl_3",
    title: "Pasta en 10 minutos",
    description: "Ágil, mantener los pasos. Música de fondo.",
    createdAt: "2026-07-22",
    job: { id: "j_3", state: "transcribing", progress: 10 },
  },
  {
    id: "p_4",
    workspaceId: "ws_1",
    clientId: "cl_1",
    title: "3 errores al ahorrar",
    description: "Directo al grano, sin intro larga.",
    createdAt: "2026-07-19",
    job: { id: "j_4", state: "failed", progress: 30 },
  },
];

export function getMockProject(id: string): Project | undefined {
  return mockProjects.find((p) => p.id === id);
}

export function clientName(id: string | null): string {
  if (!id) return "Sin cliente";
  return mockClients.find((c) => c.id === id)?.name ?? "Sin cliente";
}
