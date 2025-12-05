output "endpoint" {
  value = aws_db_instance.main.address
}

output "port" {
  value = aws_db_instance.main.port
}

output "database_name" {
  value = aws_db_instance.main.db_name
}

output "username" {
  value = aws_db_instance.main.username
}

output "secret_arn" {
  value = aws_secretsmanager_secret.db_password.arn
}

output "replica_endpoints" {
  description = "Read replica endpoints"
  value       = aws_db_instance.read_replica[*].address
}

output "cross_az_replica_endpoint" {
  description = "Cross-AZ read replica endpoint"
  value       = length(aws_db_instance.cross_az_replica) > 0 ? aws_db_instance.cross_az_replica[0].address : null
}

output "read_endpoint" {
  description = "Comma-separated list of all read endpoints for connection pooling"
  value = join(",", concat(
    aws_db_instance.read_replica[*].address,
    length(aws_db_instance.cross_az_replica) > 0 ? [aws_db_instance.cross_az_replica[0].address] : []
  ))
}
