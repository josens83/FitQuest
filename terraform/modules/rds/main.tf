# RDS Module

resource "random_password" "db_password" {
  length  = 32
  special = false
}

# Security Group
resource "aws_security_group" "rds" {
  name        = "${var.name_prefix}-rds-sg"
  description = "Security group for RDS"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-rds-sg"
  })
}

# Parameter Group
resource "aws_db_parameter_group" "main" {
  name   = "${var.name_prefix}-postgres-params"
  family = "postgres15"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = var.tags
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.name_prefix}-postgres"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "fitquest"
  username = "fitquest"
  password = random_password.db_password.result

  multi_az               = var.multi_az
  db_subnet_group_name   = "${var.name_prefix}-db-subnet-group"
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.main.name

  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  deletion_protection      = var.environment == "production"
  skip_final_snapshot      = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.name_prefix}-final-snapshot" : null

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = var.tags
}

# Store password in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.name_prefix}/database/password"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = aws_db_instance.main.username
    password = random_password.db_password.result
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    database = aws_db_instance.main.db_name
  })
}

# Read Replica (Production only)
resource "aws_db_instance" "read_replica" {
  count = var.create_read_replica && var.environment == "production" ? var.read_replica_count : 0

  identifier = "${var.name_prefix}-postgres-replica-${count.index + 1}"

  replicate_source_db = aws_db_instance.main.identifier
  instance_class      = var.replica_instance_class

  storage_encrypted = true
  storage_type      = "gp3"

  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.main.name

  # Replica-specific settings
  auto_minor_version_upgrade = true
  publicly_accessible        = false
  skip_final_snapshot        = true

  # Performance Insights
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  # CloudWatch logs
  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-postgres-replica-${count.index + 1}"
    Role = "read-replica"
  })
}

# Read Replica in different AZ for high availability
resource "aws_db_instance" "cross_az_replica" {
  count = var.create_cross_az_replica && var.environment == "production" ? 1 : 0

  identifier = "${var.name_prefix}-postgres-cross-az-replica"

  replicate_source_db = aws_db_instance.main.identifier
  instance_class      = var.replica_instance_class

  storage_encrypted     = true
  storage_type          = "gp3"
  availability_zone     = var.cross_az_availability_zone

  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.main.name

  auto_minor_version_upgrade = true
  publicly_accessible        = false
  skip_final_snapshot        = true

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-postgres-cross-az-replica"
    Role = "cross-az-read-replica"
  })
}

# CloudWatch alarms for replication lag
resource "aws_cloudwatch_metric_alarm" "replica_lag" {
  count = var.create_read_replica && var.environment == "production" ? var.read_replica_count : 0

  alarm_name          = "${var.name_prefix}-replica-${count.index + 1}-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 30 # seconds
  alarm_description   = "RDS replica lag is too high"
  alarm_actions       = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.read_replica[count.index].identifier
  }

  tags = var.tags
}
