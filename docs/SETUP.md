# 🔧 SETUP — Fase 0: Cuentas y Credenciales

> Guía paso a paso de lo que hay que crear **antes** de escribir el pipeline.
> Todas las plataformas tienen **plan gratuito** suficiente para desarrollar.
> Responsable: **Johannes**. Cuando termines, tendrás una lista de secretos
> (§6) que conectaremos al código.

**Última actualización:** 2026-07-22

---

## 0. Cómo fluyen los secretos (mapa mental)

Hay dos "cajas" que consumen credenciales:

```
web/  (Next.js)                     worker/ (Modal)
──────────────                      ────────────────
Lee de web/.env.local:              Lee de "Modal Secrets":
- Supabase URL + anon key           - OpenRouter API key
- Supabase service key (server)     - AWS access key + secret
- URL del endpoint de Modal         - AWS region + bucket
                                    - Supabase URL + service key
```

Regla: **nunca** poner claves secretas (service key, AWS secret, OpenRouter)
en variables `NEXT_PUBLIC_*` — esas viajan al navegador. Las secretas viven en
el servidor (Next.js server / Modal Secrets).

### ¿Dónde pego cada valor? (los dos destinos reales)

Mientras recolectas keys (§1–§4) guárdalas en tu gestor de contraseñas. Ese es
**almacén temporal**, no el destino final. Los destinos reales son dos:

**1. `web/` → archivo `web/.env.local`.** Cópialo de la plantilla y rellena:

```bash
cp web/.env.example web/.env.local   # luego pega tus valores dentro
```

⚠️ En web, las variables públicas llevan **prefijo `NEXT_PUBLIC_`** (por eso el
nombre no es igual al de §1). La plantilla [`web/.env.example`](../web/.env.example)
es la **fuente de verdad** de los nombres exactos:

| Valor que recolectaste | Nombre exacto en `web/.env.local` |
| ---------------------- | --------------------------------- |
| Supabase Project URL   | `NEXT_PUBLIC_SUPABASE_URL`        |
| Supabase anon key      | `NEXT_PUBLIC_SUPABASE_ANON_KEY`   |
| Supabase service_role  | `SUPABASE_SERVICE_ROLE_KEY` (sin prefijo, solo server) |
| AWS access/secret/region + bucket | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET` |
| URL del endpoint de Modal | `MODAL_START_PIPELINE_URL` (la imprime `modal deploy`; la llenamos juntos) |

`web/.env.local` está en `.gitignore` — nunca se commitea.

**2. `worker/` (Modal) → NO hay archivo.** Los valores viven como *Modal Secrets*,
cargados con los comandos de [§4](#4-modal-cómputo-del-pipeline). El archivo
[`worker/.env.example`](../worker/.env.example) es **solo** para correr el worker
localmente fuera de Modal (opcional); no lo necesitas para el flujo normal.

---

## 1. Supabase (auth + base de datos)

1. Entra a <https://supabase.com> → **New project**.
2. Nombre: `motor-de-videos`. Elige región cercana (ej. `us-east`). Guarda la
   **Database password** en tu gestor de contraseñas.
3. Cuando cargue, ve a **Project Settings → API** y copia:
   - **Project URL** → `SUPABASE_URL` (en web se llama `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public key** → `SUPABASE_ANON_KEY` (en web: `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role key** (¡secreta!) → `SUPABASE_SERVICE_ROLE_KEY`

> El nombre exacto en cada archivo está en §0 → *¿Dónde pego cada valor?*

> Con el proyecto creado, yo aplico el esquema (tablas + RLS) por migraciones —
> tú no tienes que crear tablas a mano.

---

## 2. OpenRouter (LLM multi-modelo)

1. Entra a <https://openrouter.ai> → crea cuenta.
2. **Keys** → **Create Key** → nómbrala `motor-de-videos-dev`.
3. Copia la clave → `OPENROUTER_API_KEY`.
4. (Opcional) Carga unos pocos USD de crédito; hay modelos muy baratos e incluso
   algunos gratuitos para probar. Elegiremos el modelo por tarea desde el código.

---

## 3. AWS S3 (almacenamiento de videos) — vía Terraform

**No hay pasos manuales en la consola.** El bucket S3 (privado + CORS) y el usuario
IAM de mínimos privilegios se crean como código con Terraform (carpeta
[`infra/`](../infra/README.md)).

Solo necesitas:

1. Instalar [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.5.
2. Tener **credenciales de AWS con permisos para crear S3 e IAM** (tu cuenta
   admin/deployer), vía `aws configure` o variables de entorno.
   *(Estas son para desplegar; Terraform genera aparte las credenciales del worker.)*
3. Desplegar:
   ```bash
   cd infra
   cp terraform.tfvars.example terraform.tfvars   # ajusta bucket_name (único global)
   terraform init && terraform apply
   ```
4. Leer las salidas → estos son tus valores de AWS:
   ```bash
   terraform output bucket_name                     # S3_BUCKET
   terraform output aws_region                      # AWS_REGION
   terraform output -raw worker_access_key_id       # AWS_ACCESS_KEY_ID
   terraform output -raw worker_secret_access_key   # AWS_SECRET_ACCESS_KEY
   ```

---

## 4. Modal (cómputo del pipeline)

1. Entra a <https://modal.com> → crea cuenta (login con GitHub es lo más rápido).
2. En tu máquina, con Python instalado:
   ```bash
   pip install modal
   modal token new      # abre el navegador y autentica el CLI
   ```
3. Cuando tengamos el código del worker, guardaremos las credenciales como
   **Modal Secrets** (no van en archivos). Comandos (los correremos juntos):
   ```bash
   modal secret create openrouter OPENROUTER_API_KEY=...
   modal secret create aws AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... AWS_REGION=... S3_BUCKET=...
   modal secret create supabase SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
   ```

---

## 5. Checklist rápido

- [ ] Proyecto Supabase creado; URL + anon key + service_role key guardadas
- [ ] OpenRouter: cuenta + API key (+ crédito opcional)
- [ ] AWS: `terraform apply` en `infra/` hecho; outputs recolectados (bucket, región, access key/secret)
- [ ] Modal: cuenta creada + `modal token new` hecho

---

## 6. Valores a recolectar (los conectamos al código)

| Variable                     | De dónde        | Va en                  | ¿Secreta? |
| ---------------------------- | --------------- | ---------------------- | --------- |
| `SUPABASE_URL`               | Supabase API    | web + Modal            | No        |
| `SUPABASE_ANON_KEY`          | Supabase API    | web (público)          | No        |
| `SUPABASE_SERVICE_ROLE_KEY`  | Supabase API    | web (server) + Modal   | **Sí**    |
| `OPENROUTER_API_KEY`         | OpenRouter      | Modal                  | **Sí**    |
| `AWS_ACCESS_KEY_ID`          | Terraform (infra/) | Modal + web (firma)  | **Sí**    |
| `AWS_SECRET_ACCESS_KEY`      | Terraform (infra/) | Modal + web (firma)  | **Sí**    |
| `AWS_REGION`                 | Terraform (infra/) | web + Modal          | No        |
| `S3_BUCKET`                  | Terraform (infra/) | web + Modal          | No        |
| `MODAL_START_PIPELINE_URL`   | `modal deploy` (worker) | web (server)     | No        |

> **Nombres exactos y dónde pegarlos:** ver §0 → *¿Dónde pego cada valor?*. En
> `web/.env.local`, las variables públicas de Supabase llevan prefijo `NEXT_PUBLIC_`.

> Cuando tengas esto listo, avísame y conectamos todo. Mientras tanto, yo voy
> montando el esqueleto del repo y el esquema de base de datos (no necesitan
> tus credenciales).
