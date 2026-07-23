# 🏗️ infra/ — AWS como código (Terraform)

Crea la huella mínima de AWS del proyecto: **1 bucket S3** (privado, con CORS) y
**1 usuario IAM** de mínimos privilegios que usan el worker (Modal) y la web
(para firmar subidas). El cómputo vive en Modal y la DB en Supabase, así que no
hay más infra en AWS.

## Requisitos

1. [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.5.
2. **Credenciales de AWS con permisos para crear S3 e IAM** (tu cuenta de
   admin/deployer). Configúralas de una de estas formas:
   ```bash
   aws configure              # opción A: perfil local
   # o exporta variables (opción B):
   export AWS_ACCESS_KEY_ID=...
   export AWS_SECRET_ACCESS_KEY=...
   ```
   > Ojo: estas son las credenciales para **desplegar la infra**. Son distintas
   > de las del **worker** (mínimos privilegios) que Terraform genera para la app.

## Uso

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # ajusta bucket_name (único global)
terraform init
terraform plan
terraform apply
```

## Salidas → dónde van (ver docs/SETUP.md §6)

```bash
terraform output bucket_name                     # S3_BUCKET
terraform output aws_region                      # AWS_REGION
terraform output -raw worker_access_key_id       # AWS_ACCESS_KEY_ID
terraform output -raw worker_secret_access_key   # AWS_SECRET_ACCESS_KEY
```

Esos cuatro valores van a los **Modal Secrets** (`aws`) y al `web/.env.local`.

## Notas de seguridad

- El `terraform.tfstate` **contiene secretos** (la secret key). Está en
  `.gitignore`. No lo commitees. Para equipo, migra a un backend remoto (S3 +
  DynamoDB lock) más adelante.
- El bucket bloquea todo acceso público; los archivos se sirven con URLs firmadas.
- Para producción, agrega el dominio real a `allowed_origins`.
