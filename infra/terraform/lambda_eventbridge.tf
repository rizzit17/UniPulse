# UniPulse SLA Watcher Serverless Runner (Lambda + EventBridge)

resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-${var.environment}-sla-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# SLA Watcher Lambda Function (Java 21)
resource "aws_lambda_function" "sla_watcher" {
  function_name = "${var.project_name}-${var.environment}-sla-watcher"
  role          = aws_iam_role.lambda_exec.arn
  runtime       = "java21"
  handler       = "com.unipulse.sla.watcher.SlaWatcherLambdaHandler::handleRequest"
  memory_size   = 512
  timeout       = 60

  # Dummy or packaged zip placeholder for initial plan
  filename         = "${path.module}/sla-watcher-placeholder.zip"
  source_code_hash = fileexists("${path.module}/sla-watcher-placeholder.zip") ? filebase64sha256("${path.module}/sla-watcher-placeholder.zip") : null

  vpc_config {
    subnet_ids         = aws_subnet.private_app[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      CORE_API_URL     = "http://${aws_lb.main.dns_name}"
      SWEEP_SECRET_KEY = random_password.db_password.result
    }
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-sla-watcher"
  }
}

# EventBridge Schedule: Trigger SLA Sweep Every 1 Minute
resource "aws_cloudwatch_event_rule" "sla_schedule" {
  name                = "${var.project_name}-${var.environment}-sla-sweep-rule"
  description         = "Triggers UniPulse SLA sweep every 1 minute"
  schedule_expression = "rate(1 minute)"
}

resource "aws_cloudwatch_event_target" "sla_target" {
  rule      = aws_cloudwatch_event_rule.sla_schedule.name
  target_id = "SlaWatcherLambdaTarget"
  arn       = aws_lambda_function.sla_watcher.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sla_watcher.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.sla_schedule.arn
}
