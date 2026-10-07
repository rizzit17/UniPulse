# UniPulse AWS Secrets Manager Configuration

resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.project_name}/${var.environment}/credentials"
  recovery_window_in_days = 0

  tags = {
    Name = "${var.project_name}-${var.environment}-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets_val" {
  secret_id = aws_secretsmanager_secret.app_secrets.id

  secret_string = jsonencode({
    DB_PASSWORD      = random_password.db_password.result
    REDIS_AUTH       = random_password.redis_auth.result
    JWT_SECRET       = random_password.jwt_secret.result
    DB_ENDPOINT      = aws_db_instance.postgres.endpoint
    REDIS_HOST       = aws_elasticache_replication_group.redis.primary_endpoint_address
  })
}

# IAM Policy for Reading Secrets
resource "aws_iam_policy" "secrets_read" {
  name        = "${var.project_name}-${var.environment}-secrets-read"
  description = "Allows ECS tasks to decrypt application secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = ["secretsmanager:GetSecretValue"]
      Effect   = "Allow"
      Resource = aws_secretsmanager_secret.app_secrets.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_secrets" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = aws_iam_policy.secrets_read.arn
}
