# 📓 Bitácora — Motor de Videos

> Log cronológico de decisiones, avances y aprendizajes del proyecto.
> **Las entradas más recientes van arriba.** La idea general y la arquitectura
> viven en [`CONTEXTO.md`](./CONTEXTO.md); aquí queda el *rastro* de cómo llegamos ahí.

### Cómo escribir una entrada

```
## AAAA-MM-DD — Título corto

**Decisiones:** qué se decidió y por qué.
**Avances:** qué se construyó/cambió.
**Pendientes / próximos pasos:** qué sigue.
**Aprendizajes:** (opcional) qué descubrimos.
```

---

## 2026-07-23 — Setup casi listo: AWS ✅, Supabase key ✅, migraciones pendientes

**Contexto:** El desarrollo va en **WSL (Ubuntu 24.04)**, que evita la interferencia de Norton (curl/terraform/red funcionan ahí sin problema).

**Avances:**
- **AWS ya desplegado** con Terraform desde WSL: existe `infra/terraform.tfstate`; outputs → bucket `motor-de-videos-media-jt2026`, región `us-east-1`, creds del worker. (De ahí salieron las creds AWS del `.env.local`.)
- **Supabase**: URL + publishable key **validadas** (auth-settings → 200 desde WSL). Llaves del modelo nuevo (`sb_publishable_` / `sb_secret_`) en `web/.env.local` (gitignored), usando los nombres de variable existentes.
- Corregido: la OpenRouter key estaba mal puesta en `MODAL_START_PIPELINE_URL`; se sacó (va a Modal Secrets, la usa el worker).
- **Migraciones aún NO aplicadas** (404 `PGRST205`). Añadido `supabase/apply_migrations.py` (runner con psycopg2, sin sudo) y `psycopg2-binary` instalado en WSL.

**Pendiente inmediato:**
1. Correr `supabase/apply_migrations.py` con `DATABASE_URL` desde WSL → crea tablas + RLS.
2. Rotar los secretos que pasaron por el chat (Supabase secret, OpenRouter, AWS secret).

---

## 2026-07-23 — Terraform instalado + gotcha con Norton (loopback del plugin)

**Avances:**
- Terraform **v1.15.8** instalado (winget: `Hashicorp.Terraform`). `terraform init` OK y lock file generado.
- Proveedor AWS subido a `~> 6.0` (quedó **6.56.0**); lock file commiteado.

**Gotcha importante (entorno de Johannes):**
- `terraform validate/plan/apply` falla con *"Plugin did not respond / GetProviderSchema"*: el plugin del proveedor AWS muere (exit 1) al comunicarse por **loopback + mTLS** con Terraform (log muestra *"stdio service not available"*).
- Descartado: memoria (6.5 GB libres), versión del proveedor (falla en v5 y v6), shell (falla en Git Bash y PowerShell). El binario del proveedor arranca solo sin problema (exit 0) → el proveedor está sano.
- **Causa: Norton Security Ultra** (AV activo; Defender está apagado) inspecciona/bloquea la conexión loopback del plugin.
- **Fix (a elección de Johannes):** pausar Norton Auto-Protect al correr `terraform apply`; o añadir exclusiones para `terraform.exe` + la carpeta del proveedor; o correr Terraform desde **WSL2 / CI**.

---

## 2026-07-22 — UI base del front (navegable con mocks)

**Avances:**
- UI base minimalista y navegable **sin credenciales** (datos mock):
  - **Login/registro** cableado a Supabase Auth (con guard si aún no hay credenciales).
  - **Shell** con sidebar (workspace, panel, clientes, "nuevo proyecto").
  - **Panel** con stats + grid de proyectos.
  - **Clientes** (lista).
  - **Nuevo proyecto** (form: título, cliente, descripción, video).
  - **Detalle de proyecto** con stepper de los 8 estados del pipeline + acciones según estado (revisión de cortes / plan listo / error).
- Capa compartida: `lib/types.ts` (dominio, refleja el schema), `lib/pipeline.ts` (estados+labels), `lib/mock.ts`, componentes `ui/{button,card,badge}`, `pipeline-status`, `sidebar`.
- Diseño con tokens Tailwind v4 (light/dark automático); `proxy.ts` hace no-op sin credenciales para poder correr `npm run dev`.
- **`next build` en verde**: 7 rutas compilan, TypeScript OK.

**Cómo verlo:** `cd web && npm run dev` → <http://localhost:3000> (redirige a `/dashboard`).

**Pendientes / próximos pasos:**
1. Fase 1: conectar credenciales, reemplazar mocks por consultas a Supabase (RLS) y firmar subidas a S3.
2. Rellenar el cuerpo de las etapas del worker (Whisper, cortes, FFmpeg).

---

## 2026-07-22 — IaC de AWS con Terraform

**Decisiones:**
- Herramienta de infra como código: **Terraform** (footprint pequeño S3 + IAM; sin `bootstrap` ni backend complejo).

**Avances:**
- `infra/` scaffoldeado: bucket S3 (privado + CORS), usuario IAM de mínimos privilegios, `variables.tf`, `outputs.tf` (secretos marcados `sensitive`), `.gitignore` de Terraform y `README` con el flujo `init/apply` y cómo leer los outputs.
- `SETUP.md` §3/§5/§6 actualizado: AWS ya no es manual — se despliega con `terraform apply` en `infra/`.
- `CONTEXTO.md`: estructura del repo y stack ahora incluyen `infra/` + Terraform.

**Pendientes / próximos pasos:**
1. Johannes: instalar Terraform + tener credenciales AWS (deployer) → `terraform apply`.
2. Rellenar el cuerpo de las etapas del worker (Fase 1).
3. UI base del front (login, dashboard, "nuevo proyecto").

---

## 2026-07-22 — Worker con estructura real + contrato del plan.md

**Avances:**
- `worker/main.py` reescrito con estructura real: helpers de infra (Supabase, S3, OpenRouter), orquestación de estados y encadenamiento de las 8 etapas vía `.spawn`, y dos endpoints HTTP (`start_pipeline` y `resume_pipeline` para reanudar tras la revisión humana).
- `build_plan_md()` define el **contrato de salida**; [`docs/plan-ejemplo.md`](./plan-ejemplo.md) muestra el entregable final ya "renderizado".
- Aplicado el idiom de Modal: imports pesados (boto3, supabase, httpx, whisper) DENTRO de cada función; el nivel superior solo importa `modal` + stdlib.

**Decisiones:**
- **Infra como código (IaC)** confirmado. La huella en AWS es mínima (solo **S3 + IAM**), porque el cómputo es Modal y la DB es Supabase → el IaC será pequeño.

**Pendientes / próximos pasos:**
1. Elegir herramienta de IaC (Terraform vs Pulumi-Python vs CDK-Python) y scaffoldear `infra/`.
2. Rellenar el cuerpo de cada etapa en Fase 1 (Whisper, prompts de cortes, FFmpeg).
3. UI base del front (login, dashboard, "nuevo proyecto").

---

## 2026-07-22 — Fase 0: cimientos scaffoldeados

**Avances:**
- Monorepo creado: `web/` (Next.js **16.2.11** + React **19.2.4** + TS + Tailwind), `worker/` (Modal), `supabase/migrations/`, `docs/`.
- Migraciones SQL escritas: schema (8 tablas + enums + índices + triggers) y RLS (aislamiento por workspace, trigger de owner).
- Integración Supabase en el front: `lib/supabase/client.ts` (browser), `server.ts` (server) y `proxy.ts` + `web/proxy.ts` (refresco de sesión).
- `web/.env.example` y `worker/.env.example` documentados; `.gitignore` raíz.
- **Typecheck del front en verde** (`tsc --noEmit` exit 0).

**Aprendizajes (Next.js 16 trae breaking changes):**
- `cookies()` es **async** → `await cookies()`.
- `middleware.ts` se renombró a **`proxy.ts`** (función exportada `proxy`, runtime Node.js por defecto). Adaptamos el patrón de sesión de Supabase.
- Leer siempre `web/node_modules/next/dist/docs/` antes de escribir código de Next en este proyecto.

**Decisiones menores:**
- `create-next-app` creó un `.git` dentro de `web/`; lo eliminé para mantener un solo repo (monorepo).
- Git inicializado en la raíz (rama `main`), commit inicial `9fba755` (34 archivos, sin `node_modules`/`.env`), y **push** a `origin`: <https://github.com/labsomethingdata-sketch/build-automate-video.git>.

**Pendientes / próximos pasos:**
1. Johannes: crear cuentas y credenciales siguiendo [`SETUP.md`](./SETUP.md).
2. Aplicar las migraciones al proyecto Supabase (vía CLI o MCP) y crear los Modal Secrets.
3. Conectar `.env` y arrancar **Fase 1**: subir video → `transcribe` (primer eslabón real del pipeline).

---

## 2026-07-22 — Decisiones confirmadas + guía de setup

**Decisiones:**
- DB/Auth: **Supabase** confirmado (más fácil).
- LLM: **OpenRouter** (multi-modelo) en vez de un solo proveedor → probar varios modelos con un mismo API y elegir por tarea/costo.
- Cuentas de Modal + credenciales AWS: las configura **Johannes**, tras revisar el plan.

**Avances:**
- `CONTEXTO.md` actualizado: stack y pipeline (§3, §7) ahora usan OpenRouter; §8 pasó de "pendientes" a "decisiones tomadas".
- Creado [`SETUP.md`](./SETUP.md): guía paso a paso de la Fase 0 (Supabase, OpenRouter, AWS S3 + IAM + CORS, Modal) y mapa de cómo fluyen los secretos.

**Pendientes / próximos pasos:**
1. Johannes: seguir `SETUP.md` para crear cuentas y recolectar credenciales (checklist §5).
2. Claude: scaffoldear el monorepo (`web/`, `worker/`, `supabase/`) y el esquema SQL con RLS — no requiere credenciales, avanza en paralelo.

---

## 2026-07-22 — Kickoff: visión, stack y sprint definidos

**Decisiones:**
- El proyecto es un **Motor de Videos** para modo **agencia / equipo** (multi-usuario, multi-cliente).
- Regla de oro: **cada sprint entrega un E2E funcional.**
- Stack acordado sobre terreno conocido: **Next.js** (front) + **Python** (workers).
- **Modal** para el cómputo de video/IA (reemplaza montar Redis + cola + hosting de worker).
- **AWS S3** para almacenar los archivos de video.
- Recomendado y por confirmar: **Supabase** (auth + DB + realtime) y **Claude API** (cerebro editorial).
- Filosofía: la IA **propone**, el humano **revisa y aprueba** (human-in-the-loop).

**Avances:**
- Definido el mapa completo de la visión (ver [`CONTEXTO.md`](./CONTEXTO.md) §2).
- Definida la arquitectura web + Modal + S3 + Supabase (§3).
- Definido el modelo de datos borrador (§4) y la estructura de monorepo (§5).
- Definido el **Sprint actual**: *"El Cortador + Reencuadre + Plan.md"* con pipeline de 8 estados (§7).
- Creados los documentos base: `docs/CONTEXTO.md` y `docs/BITACORA.md`.

**Pendientes / próximos pasos:**
1. Confirmar decisiones abiertas: Supabase (DB/Auth), Claude (LLM), cuentas de Modal + AWS.
2. **Fase 0 — Cimientos:** scaffoldear el monorepo (`web/`, `worker/`, `supabase/`).
3. Crear el esquema de base de datos con RLS (workspaces, members, clients, projects, jobs, cut_plan, assets, cost_events).

**Aprendizajes:**
- Modal simplifica bastante la arquitectura de background jobs vs. montar la cola a mano.
