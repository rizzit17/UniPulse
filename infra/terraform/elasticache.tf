# UniPulse ElastiCache Redis Cluster

resource "random_password" "redis_auth" {
  length  = 32
  special = false
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.project_name}-${var.environment}-redis-subnet-group"
  subnet_ids = aws_subnet.private_db[*].id

  description = "Subnet group for UniPulse Redis cluster"
}

resource "aws_elasticache_parameter_group" "redis7" {
  name   = "${var.project_name}-${var.environment}-redis7-params"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "volatile-lru"
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id          = "${var.project_name}-${var.environment}-redis"
  description                   = "UniPulse Redis cluster for rate limiting and cache-aside"
  node_type                     = var.redis_node_type
  num_cache_clusters            = 2
  parameter_group_name          = aws_elasticache_parameter_group.redis7.name
  port                          = 6379
  subnet_group_name             = aws_elasticache_subnet_group.redis.name
  security_group_ids            = [aws_security_group.redis.id]
  automatic_failover_enabled    = true
  multi_az_enabled              = true
  engine                        = "redis"
  engine_version                = "7.1"
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  auth_token                    = random_password.redis_auth.result
  apply_immediately             = true

  tags = {
    Name = "${var.project_name}-${var.environment}-redis"
  }
}
