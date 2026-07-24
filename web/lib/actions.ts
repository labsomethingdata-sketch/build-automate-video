"use server";

// Mutaciones (Server Actions). Corren como el usuario autenticado → RLS aplica.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createWorkspace(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("workspaces")
    .insert({ name, created_by: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createProject(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const clientId = String(formData.get("client_id") ?? "") || null;
  const workspaceId = String(formData.get("workspace_id") ?? "");
  if (!title || !workspaceId) return;

  const { supabase } = await requireUser();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({ workspace_id: workspaceId, client_id: clientId, title, description })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Job inicial del pipeline (estado 'uploaded').
  await supabase.from("jobs").insert({
    workspace_id: workspaceId,
    project_id: project.id,
    state: "uploaded",
    progress: 0,
  });

  revalidatePath("/dashboard");
  redirect(`/projects/${project.id}`);
}

export async function createClientRecord(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const workspaceId = String(formData.get("workspace_id") ?? "");
  if (!name || !workspaceId) return;
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("clients")
    .insert({ workspace_id: workspaceId, name });
  if (error) throw new Error(error.message);
  revalidatePath("/clients");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
