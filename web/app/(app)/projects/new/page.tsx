"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockClients } from "@/lib/mock";

export default function NewProjectPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Demo: aquí se firmaría la subida a S3, se crearía el proyecto/job en
    // Supabase y se llamaría a start_pipeline en Modal.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <div className="text-4xl">✅</div>
        <h1 className="text-xl font-semibold">Proyecto creado (demo)</h1>
        <p className="text-sm text-muted-foreground">
          Con credenciales conectadas, aquí se subiría el video a S3 y arrancaría
          el pipeline (transcripción → cortes → revisión).
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/dashboard">
            <Button variant="outline">Volver al panel</Button>
          </Link>
          <Link href="/projects/p_1">
            <Button>Ver un proyecto de ejemplo</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo proyecto</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sube el video crudo y describe qué quieres lograr.
        </p>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium">Título</label>
              <input
                required
                placeholder="Ej. Cómo empezar a invertir en 2026"
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Cliente</label>
              <select className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary">
                <option value="">Sin cliente</option>
                {mockClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Descripción de lo deseado
              </label>
              <textarea
                rows={4}
                placeholder="Tono, qué conservar/cortar, objetivo… Ej: educativo y directo, quitar divagaciones, sugerir apoyos visuales para las cifras."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Esto guía a la IA para decidir los cortes y proponer visuales.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Video</label>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-center transition-colors hover:border-primary">
                <span className="text-2xl">📹</span>
                <span className="text-sm text-muted-foreground">
                  {fileName ?? "Arrastra o haz clic para seleccionar el video"}
                </span>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link href="/dashboard">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit">Crear y procesar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
