variable "aws_region" {
  type        = string
  description = "Región de AWS donde vive el bucket."
  default     = "us-east-1"
}

variable "bucket_name" {
  type        = string
  description = "Nombre del bucket S3. DEBE ser único a nivel global."
  default     = "motor-de-videos-media"
}

variable "allowed_origins" {
  type        = list(string)
  description = "Orígenes permitidos para CORS (subidas firmadas desde el navegador)."
  default     = ["http://localhost:3000"]
}

variable "worker_user_name" {
  type        = string
  description = "Nombre del usuario IAM de mínimos privilegios que usan el worker (Modal) y la web (firmar subidas)."
  default     = "motor-de-videos-worker"
}
