# Valores que necesitan la web y Modal (ver docs/SETUP.md §6).
# Los secretos son `sensitive`: léelos con `terraform output -raw <nombre>`.

output "bucket_name" {
  description = "S3_BUCKET"
  value       = aws_s3_bucket.media.bucket
}

output "aws_region" {
  description = "AWS_REGION"
  value       = var.aws_region
}

output "worker_access_key_id" {
  description = "AWS_ACCESS_KEY_ID del worker"
  value       = aws_iam_access_key.worker.id
  sensitive   = true
}

output "worker_secret_access_key" {
  description = "AWS_SECRET_ACCESS_KEY del worker"
  value       = aws_iam_access_key.worker.secret
  sensitive   = true
}
