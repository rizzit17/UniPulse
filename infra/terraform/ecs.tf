# UniPulse ECS Fargate Cluster & Microservices

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cluster"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "ecs_logs" {
  for_each          = toset(["core-api", "assignment-service", "notification-service", "analytics-service"])
  name              = "/ecs/${var.project_name}-${each.key}"
  retention_in_days = 30

  tags = {
    Service = each.key
  }
}

# IAM Role: Task Execution Role (Pulling images, writing logs, reading secrets)
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.project_name}-${var.environment}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role: Application Task Role
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-${var.environment}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

# Task Definition: Core API
resource "aws_ecs_task_definition" "core_api" {
  family                   = "${var.project_name}-core-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.core_api_cpu
  memory                   = var.core_api_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name      = "core-api"
    image     = "unipulse/core-api:${var.app_version}"
    essential = true
    portMappings = [{
      containerPort = 8080
      hostPort      = 8080
      protocol      = "tcp"
    }]
    environment = [
      { name = "SPRING_PROFILES_ACTIVE", value = "prod" },
      { name = "SPRING_DATASOURCE_URL", value = "jdbc:postgresql://${aws_db_instance.postgres.endpoint}/${var.db_name}" },
      { name = "SPRING_DATA_REDIS_HOST", value = aws_elasticache_replication_group.redis.primary_endpoint_address },
      { name = "SPRING_DATA_REDIS_PORT", value = "6379" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.project_name}-core-api"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "core"
      }
    }
  }])
}

# ECS Service: Core API
resource "aws_ecs_service" "core_api" {
  name            = "${var.project_name}-core-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.core_api.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private_app[*].id
    security_groups = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.core_api.arn
    container_name   = "core-api"
    container_port   = 8080
  }

  deployment_controller {
    type = "ECS"
  }

  depends_on = [aws_lb_listener.http]
}

# Task Definition: Assignment Service
resource "aws_ecs_task_definition" "assignment" {
  family                   = "${var.project_name}-assignment-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name      = "assignment-service"
    image     = "unipulse/assignment-service:${var.app_version}"
    essential = true
    portMappings = [{
      containerPort = 8081
      hostPort      = 8081
      protocol      = "tcp"
    }]
    environment = [
      { name = "SPRING_PROFILES_ACTIVE", value = "prod" },
      { name = "SPRING_DATASOURCE_URL", value = "jdbc:postgresql://${aws_db_instance.postgres.endpoint}/${var.db_name}" },
      { name = "SPRING_DATA_REDIS_HOST", value = aws_elasticache_replication_group.redis.primary_endpoint_address }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.project_name}-assignment-service"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "assignment"
      }
    }
  }])
}

# ECS Service: Assignment Service
resource "aws_ecs_service" "assignment" {
  name            = "${var.project_name}-assignment-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.assignment.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private_app[*].id
    security_groups = [aws_security_group.ecs.id]
  }
}

# Task Definition: Notification Service
resource "aws_ecs_task_definition" "notification" {
  family                   = "${var.project_name}-notification-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name      = "notification-service"
    image     = "unipulse/notification-service:${var.app_version}"
    essential = true
    portMappings = [{
      containerPort = 8082
      hostPort      = 8082
      protocol      = "tcp"
    }]
    environment = [
      { name = "SPRING_PROFILES_ACTIVE", value = "prod" },
      { name = "AWS_REGION", value = var.aws_region }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.project_name}-notification-service"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "notification"
      }
    }
  }])
}

# ECS Service: Notification Service
resource "aws_ecs_service" "notification" {
  name            = "${var.project_name}-notification-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.notification.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private_app[*].id
    security_groups = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.notification.arn
    container_name   = "notification-service"
    container_port   = 8082
  }

  depends_on = [aws_lb_listener.http]
}

# Task Definition: Analytics Service
resource "aws_ecs_task_definition" "analytics" {
  family                   = "${var.project_name}-analytics-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name      = "analytics-service"
    image     = "unipulse/analytics-service:${var.app_version}"
    essential = true
    portMappings = [{
      containerPort = 8083
      hostPort      = 8083
      protocol      = "tcp"
    }]
    environment = [
      { name = "SPRING_PROFILES_ACTIVE", value = "prod" },
      { name = "SPRING_DATASOURCE_URL", value = "jdbc:postgresql://${aws_db_instance.postgres.endpoint}/${var.db_name}" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.project_name}-analytics-service"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "analytics"
      }
    }
  }])
}

# ECS Service: Analytics Service
resource "aws_ecs_service" "analytics" {
  name            = "${var.project_name}-analytics-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.analytics.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private_app[*].id
    security_groups = [aws_security_group.ecs.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.analytics.arn
    container_name   = "analytics-service"
    container_port   = 8083
  }

  depends_on = [aws_lb_listener.http]
}
