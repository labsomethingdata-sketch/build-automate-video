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

---

## 1. Supabase (auth + base de datos)

1. Entra a <https://supabase.com> → **New project**.
2. Nombre: `motor-de-videos`. Elige región cercana (ej. `us-east`). Guarda la
   **Database password** en tu gestor de contraseñas.
3. Cuando cargue, ve a **Project Settings → API** y copia:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role key** (¡secreta!) → `SUPABASE_SERVICE_ROLE_KEY`

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

## 3. AWS S3 (almacenamiento de videos)

### 3.1 Crear el bucket
1. Consola AWS → **S3** → **Create bucket**.
2. Nombre único global, ej. `motor-de-videos-media`. Región, ej. `us-east-1`
   (anótala → `AWS_REGION`). Deja **Block all public access = ON** (los archivos
   se sirven con URLs firmadas, no públicas).

### 3.2 Usuario IAM con permisos mínimos
1. **IAM → Users → Create user**: `motor-de-videos-worker`. **Sin** acceso a consola.
2. Adjunta una **política inline** (reemplaza `TU-BUCKET`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::TU-BUCKET/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::TU-BUCKET"
    }
  ]
}
```

3. Crea **Access key** → copia:
   - **Access key ID** → `AWS_ACCESS_KEY_ID`
   - **Secret access key** (¡secreta, se muestra una sola vez!) → `AWS_SECRET_ACCESS_KEY`

### 3.3 CORS del bucket (para subir desde el navegador con URL firmada)
En el bucket → **Permissions → CORS** pega (ajusta el origen en producción):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": ["ETag"]
  }
]
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
- [ ] AWS: bucket S3 creado + región anotada
- [ ] AWS: usuario IAM con política mínima + access key/secret guardadas
- [ ] AWS: CORS configurado en el bucket
- [ ] Modal: cuenta creada + `modal token new` hecho

---

## 6. Valores a recolectar (los conectamos al código)

| Variable                     | De dónde        | Va en                  | ¿Secreta? |
| ---------------------------- | --------------- | ---------------------- | --------- |
| `SUPABASE_URL`               | Supabase API    | web + Modal            | No        |
| `SUPABASE_ANON_KEY`          | Supabase API    | web (público)          | No        |
| `SUPABASE_SERVICE_ROLE_KEY`  | Supabase API    | web (server) + Modal   | **Sí**    |
| `OPENROUTER_API_KEY`         | OpenRouter      | Modal                  | **Sí**    |
| `AWS_ACCESS_KEY_ID`          | IAM             | Modal (+ web si firma) | **Sí**    |
| `AWS_SECRET_ACCESS_KEY`      | IAM             | Modal (+ web si firma) | **Sí**    |
| `AWS_REGION`                 | tú lo eliges    | web + Modal            | No        |
| `S3_BUCKET`                  | tú lo eliges    | web + Modal            | No        |

> Cuando tengas esto listo, avísame y conectamos todo. Mientras tanto, yo voy
> montando el esqueleto del repo y el esquema de base de datos (no necesitan
> tus credenciales).
