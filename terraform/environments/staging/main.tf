# Staging Environment

module "fitquest" {
  source = "../../"

  aws_region  = "ap-northeast-2"
  environment = "staging"

  # VPC
  vpc_cidr = "10.0.0.0/16"

  # EKS - smaller for staging
  eks_node_instance_types = ["t3.medium"]
  eks_node_desired_size   = 2
  eks_node_min_size       = 1
  eks_node_max_size       = 4

  # RDS - smaller for staging
  rds_instance_class        = "db.t3.small"
  rds_allocated_storage     = 20
  rds_max_allocated_storage = 50
  rds_multi_az              = false

  # ElastiCache - minimal for staging
  elasticache_node_type = "cache.t3.micro"
  elasticache_num_nodes = 1
}

output "eks_update_kubeconfig" {
  value = module.fitquest.eks_update_kubeconfig_command
}

output "database_url_template" {
  value     = module.fitquest.database_url_template
  sensitive = true
}

output "redis_url" {
  value = module.fitquest.redis_url
}
