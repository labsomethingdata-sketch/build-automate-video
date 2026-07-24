// Mapeo puro de filas de Supabase (snake_case) → tipos de la app (camelCase).
// Sin dependencias de servidor, para poder testearlo aislado.

import type { Job, JobState, Project } from "./types";

export type JobRow = {
  id: string;
  state: JobState;
  progress: number;
  created_at: string;
};

export type ProjectRow = {
  id: string;
  workspace_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  created_at: string;
  clients: { name: string } | { name: string }[] | null;
  jobs: JobRow[] | null;
};

/** El embed de PostgREST puede venir como objeto (to-one) o array. */
export function clientNameOf(clients: ProjectRow["clients"]): string | null {
  if (!clients) return null;
  return Array.isArray(clients) ? (clients[0]?.name ?? null) : clients.name;
}

/** Elige el job más reciente de un proyecto. */
export function latestJob(jobs: JobRow[] | null): Job {
  const latest = [...(jobs ?? [])].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )[0];
  return latest
    ? { id: latest.id, state: latest.state, progress: latest.progress }
    : { id: "", state: "uploaded", progress: 0 };
}

export function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    clientId: row.client_id,
    clientName: clientNameOf(row.clients),
    title: row.title,
    description: row.description,
    createdAt: (row.created_at ?? "").slice(0, 10),
    job: latestJob(row.jobs),
  };
}
