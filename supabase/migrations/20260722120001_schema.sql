-- =============================================================
-- Motor de Videos — Esquema inicial (multi-tenant / agencia)
-- Migración 1/2: tipos, tablas, índices y triggers de updated_at.
-- Las políticas RLS van en la migración 2 (…_rls.sql).
-- =============================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ---------- Enums ----------
create type public.member_role as enum ('owner', 'editor', 'viewer');

create type public.job_state as enum (
  'uploaded',
  'transcribing',
  'planning_cuts',
  'review_pending',
  'rendering',
  'reframing',
  'proposing_visuals',
  'plan_ready',
  'failed'
);

create type public.asset_kind as enum (
  'raw_video',
  'clean_video',
  'transcript',
  'cut_plan',
  'reframe_proposal',
  'plan_md'
);

create type public.cost_category as enum (
  'transcription',
  'llm',
  'compute',
  'storage'
);

-- ---------- Tablas ----------

-- Workspace = cuenta de agencia/equipo (el "tenant")
create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid not null references auth.users(id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Miembros del workspace con su rol
create table public.workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          public.member_role not null default 'editor',
  created_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- Clientes / canales que edita la agencia
create table public.clients (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  name          text not null,
  notes         text,
  created_at    timestamptz not null default now()
);

-- Un video en proceso
create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  client_id     uuid references public.clients(id) on delete set null,
  title         text not null,
  description   text,                     -- "lo deseado": guía los cortes y propuestas
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Una corrida del pipeline sobre un proyecto
create table public.jobs (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,  -- denormalizado para RLS
  project_id    uuid not null references public.projects(id) on delete cascade,
  state         public.job_state not null default 'uploaded',
  progress      int not null default 0,   -- 0..100
  error         text,
  modal_call_id text,                     -- id de la ejecución en Modal
  started_at    timestamptz,
  finished_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Plan de cortes propuesto (revisado por humano)
create table public.cut_plans (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  project_id    uuid not null references public.projects(id) on delete cascade,
  job_id        uuid references public.jobs(id) on delete set null,
  -- segmentos: [{ start, end, type, reason, action: 'keep'|'cut', approved: bool }]
  segments      jsonb not null default '[]'::jsonb,
  status        text not null default 'proposed',  -- proposed | reviewed | applied
  reviewed_by   uuid references auth.users(id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- Referencias a objetos en S3 (los archivos pesados NO viven en la DB)
create table public.assets (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  project_id    uuid not null references public.projects(id) on delete cascade,
  kind          public.asset_kind not null,
  s3_key        text not null,
  mime_type     text,
  size_bytes    bigint,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- Eventos de costo (contabilizar por proyecto / cliente / workspace)
create table public.cost_events (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete set null,
  job_id        uuid references public.jobs(id) on delete set null,
  category      public.cost_category not null,
  provider      text,                     -- whisper | openrouter | modal | s3
  quantity      numeric not null default 0,
  unit          text,                     -- minutes | tokens | seconds | gb
  unit_cost_usd numeric,
  cost_usd      numeric not null default 0,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- ---------- Índices ----------
create index idx_members_user       on public.workspace_members (user_id);
create index idx_members_workspace  on public.workspace_members (workspace_id);
create index idx_clients_workspace  on public.clients (workspace_id);
create index idx_projects_workspace on public.projects (workspace_id);
create index idx_projects_client    on public.projects (client_id);
create index idx_jobs_project       on public.jobs (project_id);
create index idx_jobs_workspace     on public.jobs (workspace_id);
create index idx_jobs_state         on public.jobs (state);
create index idx_cutplans_project   on public.cut_plans (project_id);
create index idx_assets_project     on public.assets (project_id);
create index idx_costs_workspace    on public.cost_events (workspace_id);
create index idx_costs_project      on public.cost_events (project_id);

-- ---------- updated_at automático ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_workspaces_touch before update on public.workspaces
  for each row execute function public.touch_updated_at();
create trigger trg_projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();
create trigger trg_jobs_touch before update on public.jobs
  for each row execute function public.touch_updated_at();

-- ---------- Grants (RLS hace el gating real; service_role lo bypassa) ----------
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
