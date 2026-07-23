# 🎬 Motor de Videos — Contexto y Visión General

> Documento maestro del proyecto. Aquí vive **la idea general**: qué construimos,
> cómo, con qué y en qué orden. Si alguien (o una IA) llega nuevo al proyecto,
> este archivo lo pone al día.

**Última actualización:** 2026-07-22

---

## 1. Qué es

Un **Motor de Videos**: una plataforma web que **automatiza la edición de contenido
para YouTube** (y su repurposing a otros formatos). Pensada para trabajar en modo
**agencia / equipo**: varios usuarios editan para varios clientes/canales.

**Filosofía de trabajo:** la IA hace el trabajo pesado y **propone**; el humano
**revisa y aprueba** en los puntos clave (human-in-the-loop).

---

## 2. Visión completa (el "todo")

Aunque solo atacamos una rebanada por sprint, este es el mapa completo:

| Plataforma (transversal) | Procesamiento              | Distribución / Repurposing |
| ------------------------ | -------------------------- | -------------------------- |
| Multi-usuario (agencia)  | Cortar (limpiar innecesario)| Shorts / TikTok            |
| Guardar **estados**      | Área visual (b-roll/gráficos)| Carruseles               |
| Contabilizar **costos**  | Limpiar audio              | Artículo (blog)            |
| Front minimalista y claro| SFX                        | Packaging (título/thumbnail/hook) |
|                          | Reencuadre                 |                            |

### ⭐ Regla de oro

**Cada sprint entrega un flujo End-to-End (E2E) funcional.** No construimos capas
horizontales a medias; construimos rebanadas verticales que funcionan de punta a punta.

---

## 3. Arquitectura

El principio que define todo: **procesar video tarda minutos, no milisegundos.**
Un request web no puede esperar tanto → separamos el mundo "web" (rápido) del mundo
"cómputo" (lento, en background).

```
┌──────────────────────────────────────────────────────────────┐
│  WEB (Next.js)  ──►  Supabase                                 │
│   - Login/roles        - Auth + usuarios/roles                │
│   - Subir video +      - Postgres: proyectos, jobs,           │
│     descripción          ESTADOS, COSTOS                      │
│   - Revisión humana    - Realtime (progreso en vivo)          │
│   - Descargar plan.md                                         │
└───────────────┬──────────────────────────────────────────────┘
                │ dispara job (Modal web endpoint)
                ▼
┌──────────────────────────────────────────────────────────────┐
│  MODAL (Python, serverless)          AWS S3 (archivos)        │
│   1. Whisper → transcript      ◄──►   - video crudo           │
│   2. LLM (OpenRouter) → plan cortes   - video limpio          │
│   3. FFmpeg → video limpio            - plan.md               │
│   4. Reencuadre → propuestas                                  │
│   5. LLM → propuestas visuales                                │
│   ↳ escribe estado + costos en Supabase en cada paso          │
└──────────────────────────────────────────────────────────────┘
```

### Stack

| Capa                     | Elección                                   | Por qué |
| ------------------------ | ------------------------------------------ | ------- |
| Frontend                 | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | Terreno conocido; UI limpia rápido |
| Auth + DB + Realtime     | Supabase (Postgres)                        | Auth + RLS (multi-tenant de agencia) + realtime; ya conectado |
| Almacenamiento de archivos | AWS S3                                    | Videos pesados fuera de la DB |
| Cómputo de video/IA      | Modal (Python serverless)                  | Es worker + cola + escalado + GPU en uno; Python nativo |
| Transcripción            | faster-whisper (en Modal)                  | Timestamps por palabra |
| Cerebro editorial (LLM)  | OpenRouter (multi-modelo)                  | Un solo API para probar varios LLMs; decide qué cortar y propone visuales |
| Video / render           | FFmpeg (en Modal)                          | Cortes, reencuadre, formato |

**Nota sobre Modal:** reemplaza lo que antes iban a ser Redis + cola (RQ/Celery) +
hosting del worker. Modal *es* la cola y el worker: defines funciones Python con un
decorador y él gestiona contenedores, escalado y ejecución async.

---

## 4. Modelo de datos (borrador)

```
workspaces        (agencia / equipo)
├─ members        (usuario ↔ workspace, con rol: owner/editor/viewer)
├─ clients        (los canales/clientes que edita la agencia)
└─ projects       (un video en proceso)
   ├─ jobs        (estado del pipeline)
   ├─ cut_plan    (segmentos propuestos + aprobado/rechazado)
   ├─ assets      (referencias a S3: crudo, limpio, plan.md)
   └─ cost_events (tipo, cantidad, costo estimado) ──► total por proyecto/cliente
```

---

## 5. Estructura del repo (monorepo)

```
motor-de-videos/
├─ web/          # Next.js (UI + API routes que hablan con Supabase/Modal)
├─ worker/       # Modal app en Python (whisper, cortes, ffmpeg, reencuadre)
├─ supabase/     # migraciones SQL (schema + RLS)
└─ docs/         # este documento, bitácora y decisiones
```

---

## 6. Roadmap por fases

- **Fase 0 — Cimientos:** repo, Supabase (schema + RLS), auth, cuentas Modal/AWS.
- **Fase 1 — Sprint actual (ver §7):** El Cortador + Reencuadre + Plan.md.
- **Fase 2 — Editor visual:** aplicar reencuadres, b-roll, SFX, música, packaging.
- **Fase 3 — Repurposing:** Shorts/TikTok, carruseles, artículo.
- **Fase 4 — Agencia madura:** roles finos, aprobación de clientes, analíticas, (opcional) publicación a YouTube.

---

## 7. Sprint actual — *"El Cortador + Reencuadre + Plan.md"*

**Objetivo E2E:** una plataforma montada que recibe un video + una descripción de lo
deseado, y produce un **Plan**: un video limpio + propuestas de apoyo gráfico + material
necesario, todo resumido en un `plan.md`.

**En esta fase la IA PROPONE los visuales, todavía NO los crea.**

### Entrada → Salida
- **Entrada:** video crudo + descripción de lo deseado (tono, qué conservar/cortar, objetivo).
- **Salida:** Plan = video limpio (en S3) + propuestas de apoyo gráfico + material necesario (`plan.md`).

### Pipeline (mapea 1:1 con los estados persistidos → resuelve "guardar estados")

| # | Estado             | Qué hace                                                              | Herramienta            |
| - | ------------------ | -------------------------------------------------------------------- | ---------------------- |
| 1 | `uploaded`         | Recibe video + descripción, sube a S3                                | Next.js → S3           |
| 2 | `transcribing`     | Genera transcript con timestamps por palabra                         | Modal + Whisper        |
| 3 | `planning_cuts`    | Decide qué espacios cortar y cómo (silencios, muletillas, divagaciones) según la descripción | LLM (OpenRouter) |
| 4 | `review_pending` ⏸️ | Muestra la revisión — el humano aprueba/rechaza cortes               | Front (human-in-the-loop) |
| 5 | `rendering`        | Crea la versión limpia con los cortes aprobados                      | Modal + FFmpeg         |
| 6 | `reframing`        | Genera encuadres ajustados como propuesta manual (no auto-aplica)    | Modal                  |
| 7 | `proposing_visuals`| Propone visuales y el material necesario (no los crea aún)           | LLM (OpenRouter)       |
| 8 | `plan_ready` ✅    | Ensambla el `plan.md` con todo                                       | Modal → S3             |

**Transversal:** en cada paso registramos **costo** (minutos de Whisper, tokens de
Claude, segundos de cómputo Modal, GB en S3) en `cost_events`.

---

## 8. Decisiones tomadas

| # | Decisión | Resultado | Estado |
| - | -------- | --------- | ------ |
| 1 | DB/Auth | **Supabase** (más fácil; auth + RLS + realtime) | ✅ Decidido |
| 2 | LLM del cerebro editorial | **OpenRouter** (multi-modelo, para probar varias opciones) | ✅ Decidido |
| 3 | Cuentas Modal + credenciales AWS | Las configura Johannes siguiendo [`SETUP.md`](./SETUP.md) | 🔧 En proceso |

---

## 9. Glosario

- **Packaging:** el "envoltorio" que vende el video → título + thumbnail + hook.
- **Reencuadre (reframing):** ajustar el encuadre/crop del video (centrar sujeto, cambiar aspect ratio).
- **B-roll:** material visual de apoyo que se superpone mientras habla el presentador.
- **Human-in-the-loop:** puntos del pipeline donde el sistema se detiene a esperar aprobación humana.
- **E2E (End-to-End):** un flujo completo que funciona de la entrada a la salida.
- **RLS (Row Level Security):** reglas en Postgres que aíslan datos por workspace/usuario.
