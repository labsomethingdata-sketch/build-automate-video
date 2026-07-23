# 🎬 Motor de Videos

Plataforma web para **automatizar la edición de contenido de YouTube** en modo
agencia/equipo: varios usuarios editan para varios clientes/canales.

## 📚 Documentación

- [docs/CONTEXTO.md](docs/CONTEXTO.md) — visión, arquitectura y sprint actual (empieza aquí).
- [docs/SETUP.md](docs/SETUP.md) — setup de cuentas y credenciales (Fase 0).
- [docs/BITACORA.md](docs/BITACORA.md) — log de decisiones y avances.

## 🗂️ Estructura

```
web/         Frontend Next.js (App Router, TypeScript, Tailwind)
worker/      Pipeline de video en Modal (Python + FFmpeg + Whisper)
supabase/    Migraciones SQL (schema + RLS)
docs/        Documentación del proyecto
```

## 🧱 Stack

Next.js · Supabase (Postgres + Auth + RLS) · AWS S3 · Modal · OpenRouter · FFmpeg · faster-whisper

## 🚦 Estado

**Fase 0 — Cimientos.** Ver la [bitácora](docs/BITACORA.md) para el avance actual.
