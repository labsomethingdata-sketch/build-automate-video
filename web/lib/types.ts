// Tipos de dominio del front. Reflejan el esquema de Supabase
// (ver supabase/migrations). Se usan con datos mock por ahora.

export type MemberRole = "owner" | "editor" | "viewer";

export type JobState =
  | "uploaded"
  | "transcribing"
  | "planning_cuts"
  | "review_pending"
  | "rendering"
  | "reframing"
  | "proposing_visuals"
  | "plan_ready"
  | "failed";

export interface Workspace {
  id: string;
  name: string;
}

export interface Client {
  id: string;
  workspaceId: string;
  name: string;
}

export interface Job {
  id: string;
  state: JobState;
  progress: number; // 0..100
}

export interface Project {
  id: string;
  workspaceId: string;
  clientId: string | null;
  title: string;
  description: string | null;
  createdAt: string; // ISO date
  job: Job;
}
