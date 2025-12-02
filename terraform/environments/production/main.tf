# Production Environment

module "fitquest" {
  source = "../../"

  aws_region  = "ap-northeast-2"
  environment = "production"

  # VPC
  vpc_cidr = "10.1.0.0/16"

  # EKS - production scale
  eks_node_instance_types = ["t3.large", "t3.xlarge"]
  eks_node_desired_size   = 3
  eks_node_min_size       = 3
  eks_node_max_size       = 20

  # RDS - production scale
  rds_instance_class        = "db.r6g.large"
  rds_allocated_storage     = 100
  rds_max_allocated_storage = 500
  rds_multi_az              = true

  # ElastiCache - production scale
  elasticache_node_type = "cache.r6g.large"
  elasticache_num_nodes = 2
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
