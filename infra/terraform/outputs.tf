# UniPulse Terraform Outputs

output "alb_dns_name" {
  description = "Public DNS hostname of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name serving the frontend SPA"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "rds_endpoint" {
  description = "PostgreSQL primary host endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "elasticache_primary_endpoint" {
  description = "Redis primary endpoint for caching and rate limiting"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "s3_frontend_bucket" {
  description = "S3 bucket name storing the production frontend assets"
  value       = aws_s3_bucket.frontend.id
}

output "secrets_manager_arn" {
  description = "ARN of AWS Secrets Manager secret storing application credentials"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "cost_estimate_note" {
  description = "Estimated monthly AWS infrastructure cost breakdown for staging/production"
  value       = <<EOT
UniPulse Staging/Production AWS Monthly Cost Breakdown:
=======================================================
- ECS Fargate (8 tasks across 4 services, avg 0.5-1 vCPU, 1-2 GB RAM): ~$85/month
- RDS PostgreSQL Multi-AZ (db.t4g.medium, 50 GB gp3 storage):         ~$98/month
- ElastiCache Redis Multi-AZ (2 x cache.t4g.micro):                     ~$28/month
- Application Load Balancer (1 ALB + LCU traffic):                      ~$22/month
- NAT Gateways (3 AZs, $0.045/hr + data processing):                   ~$97/month (or ~$32/mo with 1 shared NAT GW for staging)
- S3 & CloudFront (static hosting, 100 GB transfer):                    ~$5/month
- CloudWatch Alarms & Logs (30-day retention):                          ~$12/month
- AWS Secrets Manager:                                                  ~$1/month
-------------------------------------------------------
Total Estimated Infrastructure Cost: ~$348/month (Staging with 1 NAT: ~$283/month)

To completely destroy all resources and prevent AWS billing:
  cd infra/terraform
  terraform destroy -auto-approve
EOT
}
