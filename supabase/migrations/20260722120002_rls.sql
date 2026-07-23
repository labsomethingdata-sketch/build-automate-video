-- =============================================================
-- Motor de Videos — Row Level Security (aislamiento por workspace)
-- Migración 2/2: helpers, trigger de owner, RLS y políticas.
-- Modelo: un usuario solo ve/edita datos de los workspaces donde es miembro.
--   - lectura  = cualquier miembro (owner/editor/viewer)
--   - escritura = owner o editor (viewer es solo lectura)
-- El worker (service_role) bypassa RLS y escribe libremente.
-- =============================================================

-- ---------- Helpers (SECURITY DEFINER: evitan recursión de RLS) ----------
create or replace function public.is_workspace_member(_workspace_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = _workspace_id and user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(_workspace_id uuid, _roles public.member_role[])
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = _workspace_id
      and user_id = auth.uid()
      and role = any(_roles)
  );
$$;

-- ---------- Trigger: el creador del workspace queda como owner ----------
create or replace function public.handle_new_workspace()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger trg_workspace_owner after insert on public.workspaces
  for each row execute function public.handle_new_workspace();

-- ---------- Habilitar RLS ----------
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.clients           enable row level security;
alter table public.projects          enable row level security;
alter table public.jobs              enable row level security;
alter table public.cut_plans         enable row level security;
alter table public.assets            enable row level security;
alter table public.cost_events       enable row level security;

-- ---------- Políticas: workspaces ----------
create policy "ws_select_member" on public.workspaces
  for select using (public.is_workspace_member(id));
create policy "ws_insert_self" on public.workspaces
  for insert with check (created_by = auth.uid());
create policy "ws_update_owner" on public.workspaces
  for update using (public.has_workspace_role(id, array['owner']::public.member_role[]));
create policy "ws_delete_owner" on public.workspaces
  for delete using (public.has_workspace_role(id, array['owner']::public.member_role[]));

-- ---------- Políticas: workspace_members ----------
create policy "wm_select_member" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));
create policy "wm_manage_owner" on public.workspace_members
  for all
  using (public.has_workspace_role(workspace_id, array['owner']::public.member_role[]))
  with check (public.has_workspace_role(workspace_id, array['owner']::public.member_role[]));

-- ---------- Políticas para tablas scoped a workspace ----------
-- Patrón: SELECT para cualquier miembro; escritura para owner/editor.

-- clients
create policy "clients_select" on public.clients
  for select using (public.is_workspace_member(workspace_id));
create policy "clients_write" on public.clients
  for all
  using (public.has_workspace_role(workspace_id, array['owner','editor']::public.member_role[]))
  with check (public.has_workspace_role(workspace_id, array['owner','editor']::public.member_role[]));

-- projects
create policy "projects_select" on public.projects
  for select using (public.is_workspace_member(workspace_id));
create policy "projects_write" on public.projects
  for all
  using (public.has_workspace_role(workspace_id, array['owner','editor']::public.member_role[]))
  with check (public.has_workspace_role(workspace_id, array['owner','editor']::public.member_role[]));

-- jobs
create policy "jobs_select" on public.jobs
  for select using (public.is_workspace_member(workspace_id));
create policy "jobs_write" on public.jobs
  for all
  using (public.has_workspace_role(workspace_id, array['owner','editor']::public.member_role[]))
  with check (public.has_workspace_role(workspace_id, array['owner','editor']::public.member_role[]));

-- cut_plans
create policy "cutplans_select" on public.cut_plans
  for select using (public.is_workspace_member(workspace_id));
create policy "cutplans_write" on public.cut_plans
  for all
  using (public.has_workspace_role(workspace_id, array['owner','editor']::public.member_role[]))
  with check (public.has_workspace_role(workspace_id, array['owner','editor']::public.member_role[]));

-- assets
create policy "assets_select" on public.assets
  for select using (public.is_workspace_member(workspace_id));
create policy "assets_write" on public.assets
  for all
  using (public.has_workspace_role(workspace_id, array['owner','editor']::public.member_role[]))
  with check (public.has_workspace_role(workspace_id, array['owner','editor']::public.member_role[]));

-- cost_events (normalmente las escribe el worker vía service_role)
create policy "costs_select" on public.cost_events
  for select using (public.is_workspace_member(workspace_id));
create policy "costs_write" on public.cost_events
  for all
  using (public.has_workspace_role(workspace_id, array['owner','editor']::public.member_role[]))
  with check (public.has_workspace_role(workspace_id, array['owner','editor']::public.member_role[]));
