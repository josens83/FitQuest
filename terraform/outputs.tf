# FitQuest Infrastructure Outputs

# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

# EKS Outputs
output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_certificate_authority" {
  description = "EKS cluster certificate authority data"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "eks_update_kubeconfig_command" {
  description = "Command to update kubeconfig"
  value       = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.aws_region}"
}

# RDS Outputs
output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.endpoint
}

output "rds_port" {
  description = "RDS port"
  value       = module.rds.port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.database_name
}

# ElastiCache Outputs
output "elasticache_endpoint" {
  description = "ElastiCache endpoint"
  value       = module.elasticache.endpoint
}

output "elasticache_port" {
  description = "ElastiCache port"
  value       = module.elasticache.port
}

# S3 Outputs
output "s3_assets_bucket" {
  description = "S3 assets bucket name"
  value       = module.s3.assets_bucket_name
}

output "s3_assets_bucket_domain" {
  description = "S3 assets bucket domain name"
  value       = module.s3.assets_bucket_domain_name
}

# Connection strings (for reference only, use secrets manager in production)
output "database_url_template" {
  description = "Database URL template (replace password)"
  value       = "postgresql://fitquest:PASSWORD@${module.rds.endpoint}:${module.rds.port}/${module.rds.database_name}?schema=public"
}

output "redis_url" {
  description = "Redis URL"
  value       = "redis://${module.elasticache.endpoint}:${module.elasticache.port}"
}
