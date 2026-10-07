# UniPulse Relational Database Service (PostgreSQL 16)

resource "random_password" "db_password" {
  length           = 24
  special          = false
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_db_subnet_group" "rds" {
  name        = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids  = aws_subnet.private_db[*].id
  description = "Subnet group for UniPulse PostgreSQL"

  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet-group"
  }
}

resource "aws_db_parameter_group" "postgres16" {
  name   = "${var.project_name}-${var.environment}-pg16-params"
  family = "postgres16"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "250" # Log queries taking longer than 250ms
  }
}

resource "aws_db_instance" "postgres" {
  identifier             = "${var.project_name}-${var.environment}-db"
  engine                 = "postgres"
  engine_version         = "16.2"
  instance_class         = var.db_instance_class
  allocated_storage      = 50
  max_allocated_storage  = 200
  storage_type           = "gp3"
  db_name                = var.db_name
  username               = var.db_username
  password               = random_password.db_password.result
  multi_az               = true
  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.postgres16.name

  storage_encrypted       = true
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Sun:04:30-Sun:05:30"
  auto_minor_version_upgrade = true
  deletion_protection     = false
  skip_final_snapshot     = true

  tags = {
    Name = "${var.project_name}-${var.environment}-db"
  }
}
