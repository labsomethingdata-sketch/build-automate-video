// Consultas de lectura a Supabase (Server Components). Corren como el usuario
// autenticado, así que RLS filtra automáticamente por workspace.

import { createClient } from "@/lib/supabase/server";
import { mapProject, type ProjectRow } from "./mappers";
import type { Client, Project, Workspace } from "./types";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getActiveWorkspace(): Promise<Workspace | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspaces")
    .select("id, name")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data ? { id: data.id, name: data.name } : null;
}

const PROJECT_SELECT =
  "id, workspace_id, client_id, title, description, created_at, clients(name), jobs(id, state, progress, created_at)";

export async function getProjects(workspaceId: string): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  return ((data as ProjectRow[] | null) ?? []).map(mapProject);
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("id", id)
    .maybeSingle();
  return data ? mapProject(data as ProjectRow) : null;
}

export async function getClients(workspaceId: string): Promise<Client[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, workspace_id, name")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });
  return ((data as { id: string; workspace_id: string; name: string }[] | null) ?? []).map(
    (c) => ({ id: c.id, workspaceId: c.workspace_id, name: c.name }),
  );
}

export async function getWorkspaceCostUsd(workspaceId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cost_events")
    .select("cost_usd")
    .eq("workspace_id", workspaceId);
  return ((data as { cost_usd: number }[] | null) ?? []).reduce(
    (sum, r) => sum + Number(r.cost_usd ?? 0),
    0,
  );
}
