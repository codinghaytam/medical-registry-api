output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.app.dns_name
}

output "node_service_url" {
  description = "HTTP endpoint for the Node.js API"
  value       = "http://${aws_lb.app.dns_name}"
}

output "keycloak_url" {
  description = "HTTP endpoint for the Keycloak console"
  value       = "http://${aws_lb.app.dns_name}/keycloak"
}

output "s3_bucket_name" {
  description = "Name of the uploads S3 bucket"
  value       = aws_s3_bucket.uploads.bucket
}

output "s3_public_url" {
  description = "Base URL to access images in S3"
  value       = "https://${aws_s3_bucket.uploads.bucket}.s3.${var.aws_region}.amazonaws.com"
}

output "rds_endpoint" {
  description = "PostgreSQL endpoint"
  value       = aws_db_instance.postgres.address
}

output "database_name" {
  description = "Primary database name"
  value       = aws_db_instance.postgres.db_name
}

output "database_username" {
  description = "Primary database username"
  value       = var.db_username
}

output "database_password" {
  description = "Primary database password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "keycloak_admin_password" {
  description = "Auto-generated Keycloak admin password"
  value       = random_password.keycloak_admin.result
  sensitive   = true
}
