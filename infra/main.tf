# =============================================================
# Motor de Videos — Infra AWS como código
# Huella mínima: 1 bucket S3 (privado + CORS) + 1 usuario IAM de
# mínimos privilegios. El cómputo vive en Modal y la DB en Supabase.
# =============================================================

# ---------- Almacenamiento: bucket S3 ----------
resource "aws_s3_bucket" "media" {
  bucket = var.bucket_name
}

# Nada público: los archivos se sirven con URLs firmadas.
resource "aws_s3_bucket_public_access_block" "media" {
  bucket                  = aws_s3_bucket.media.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CORS para permitir subidas (PUT) y lecturas (GET) firmadas desde el navegador.
resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "GET"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ---------- Acceso: usuario IAM de mínimos privilegios ----------
resource "aws_iam_user" "worker" {
  name = var.worker_user_name
}

data "aws_iam_policy_document" "worker" {
  statement {
    sid       = "ObjectReadWrite"
    effect    = "Allow"
    actions   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.media.arn}/*"]
  }

  statement {
    sid       = "ListBucket"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.media.arn]
  }
}

resource "aws_iam_user_policy" "worker" {
  name   = "motor-de-videos-s3"
  user   = aws_iam_user.worker.name
  policy = data.aws_iam_policy_document.worker.json
}

# Clave de acceso del worker. El secret queda en el state y en los outputs
# (sensibles) — protege el archivo de state (ver .gitignore / README).
resource "aws_iam_access_key" "worker" {
  user = aws_iam_user.worker.name
}
