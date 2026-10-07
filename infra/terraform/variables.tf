variable "aws_region" {
  description = "AWS deployment region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Target deployment environment (staging, production)"
  type        = string
  default     = "staging"
}

variable "project_name" {
  description = "Unique project identifier prefix"
  type        = string
  default     = "unipulse"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones for multi-AZ topology"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "db_instance_class" {
  description = "Instance class for RDS PostgreSQL"
  type        = string
  default     = "db.t4g.medium"
}

variable "db_name" {
  description = "PostgreSQL initial database name"
  type        = string
  default     = "unipulse"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "unipulse_admin"
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t4g.micro"
}

variable "app_version" {
  description = "Docker image tag or commit SHA"
  type        = string
  default     = "latest"
}

variable "core_api_cpu" {
  description = "Fargate CPU units for Core API"
  type        = number
  default     = 1024
}

variable "core_api_memory" {
  description = "Fargate memory (MB) for Core API"
  type        = number
  default     = 2048
}

variable "alert_email" {
  description = "DevOps notification email for CloudWatch SNS alarms"
  type        = string
  default     = "devops-alerts@unipulse.edu"
}
