# UniPulse Production Deployment Guide & Runbook

This document details the end-to-end deployment, infrastructure provisioning, secrets management, and operational runbooks for **UniPulse** on Amazon Web Services (AWS) using Terraform, Docker, and ECS Fargate.

---

## 1. Cloud Architecture Overview

UniPulse is deployed across three AWS Availability Zones (`us-east-1a`, `us-east-1b`, `us-east-1c`) with strict network tier isolation:

```
[ Internet Traffic ]
        │
        ▼
[ CloudFront CDN (SPA) ] ──────► [ S3 Bucket (Static Web Assets) ]
        │
        ▼ (API Traffic)
[ Application Load Balancer ] (Public Subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
        │
        ├──► /api/v1/analytics/* ──► ECS Fargate: Analytics Service (Port 8083)
        ├──► /api/v1/notifications/* ──► ECS Fargate: Notification Service (Port 8082, SSE)
        └──► /* (Default) ─────────► ECS Fargate: Core API (Port 8080)
        │
        ▼
[ Private App Subnets ] (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
  ├── ECS Fargate: Core API (2 tasks)
  ├── ECS Fargate: Assignment Service (2 tasks)
  ├── ECS Fargate: Notification Service (2 tasks)
  ├── ECS Fargate: Analytics Service (2 tasks)
  └── Lambda: SLA Watcher (Triggered every 1 min by EventBridge)
        │
        ▼
[ Private Database Subnets ] (Isolated: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24)
  ├── Multi-AZ RDS PostgreSQL 16 (gp3 autoscaling storage)
  └── Multi-AZ ElastiCache Redis 7.1 (Auth-token + Transit Encryption)
```

---

## 2. Prerequisites & Local Environment

Ensure the following tooling is installed and authenticated:
- **AWS CLI v2** configured with Administrator or DevOps IAM credentials:
  ```bash
  aws sts get-caller-identity
  ```
- **Terraform** (`>= 1.5.0`):
  ```bash
  terraform version
  ```
- **Docker Engine** (`>= 24.0`) with Docker Buildx:
  ```bash
  docker buildx version
  ```
- **Node.js 22** & **OpenJDK 21**.

---

## 3. Step 1: Provision Cloud Infrastructure with Terraform

All infrastructure is defined declaratively in `infra/terraform/`.

```bash
cd infra/terraform

# Initialize Terraform plugins and backend
terraform init

# Validate syntax and provider schema
terraform validate

# Review the execution plan
terraform plan -out=tfplan.binary

# Apply infrastructure changes
terraform apply tfplan.binary
```

### Terraform Outputs
After successful application, Terraform prints key connection endpoints:
- `alb_dns_name`: Public load balancer hostname.
- `cloudfront_domain_name`: HTTPS CDN domain for the web application.
- `rds_endpoint`: PostgreSQL connection host.
- `elasticache_primary_endpoint`: Redis cluster primary endpoint.
- `s3_frontend_bucket`: S3 bucket name for web assets.
- `secrets_manager_arn`: ARN for application credentials.

---

## 4. Step 2: Build & Push Container Images to AWS ECR

Authenticate your local Docker client to Amazon ECR:

```bash
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-east-1"
REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${REGISTRY}
```

Create ECR repositories if they do not already exist:
```bash
for repo in unipulse-core-api unipulse-assignment-service unipulse-notification-service unipulse-analytics-service unipulse-frontend; do
  aws ecr create-repository --repository-name ${repo} --region ${AWS_REGION} || true
done
```

Build and push each service:

```bash
GIT_SHA=$(git rev-parse --short HEAD)

# 1. Core API
docker build -t ${REGISTRY}/unipulse-core-api:${GIT_SHA} -t ${REGISTRY}/unipulse-core-api:latest \
  -f backend/unipulse-core-api/Dockerfile backend
docker push ${REGISTRY}/unipulse-core-api:${GIT_SHA}
docker push ${REGISTRY}/unipulse-core-api:latest

# 2. Assignment Service
docker build -t ${REGISTRY}/unipulse-assignment-service:${GIT_SHA} -t ${REGISTRY}/unipulse-assignment-service:latest \
  -f backend/assignment-service/Dockerfile backend
docker push ${REGISTRY}/unipulse-assignment-service:${GIT_SHA}
docker push ${REGISTRY}/unipulse-assignment-service:latest

# 3. Notification Service
docker build -t ${REGISTRY}/unipulse-notification-service:${GIT_SHA} -t ${REGISTRY}/unipulse-notification-service:latest \
  -f backend/notification-service/Dockerfile backend
docker push ${REGISTRY}/unipulse-notification-service:${GIT_SHA}
docker push ${REGISTRY}/unipulse-notification-service:latest

# 4. Analytics Service
docker build -t ${REGISTRY}/unipulse-analytics-service:${GIT_SHA} -t ${REGISTRY}/unipulse-analytics-service:latest \
  -f backend/analytics-service/Dockerfile backend
docker push ${REGISTRY}/unipulse-analytics-service:${GIT_SHA}
docker push ${REGISTRY}/unipulse-analytics-service:latest
```

---

## 5. Step 3: Deploy Frontend SPA to S3 + CloudFront

Build the production frontend bundle and synchronize to S3:

```bash
cd frontend
npm ci
npm run build

S3_BUCKET=$(terraform -chdir=../infra/terraform output -raw s3_frontend_bucket)
CF_DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].Id=='S3-${S3_BUCKET}'].Id" --output text)

# Sync build files to S3 with cache controls
aws s3 sync dist/ s3://${S3_BUCKET}/ --delete \
  --cache-control "max-age=31536000,public,immutable" \
  --exclude "index.html"

# Upload index.html with no-cache to ensure immediate updates
aws s3 cp dist/index.html s3://${S3_BUCKET}/index.html \
  --cache-control "no-cache, no-store, must-revalidate"

# Invalidate CloudFront edge cache
aws cloudfront create-invalidation \
  --distribution-id ${CF_DIST_ID} \
  --paths "/*"
```

---

## 6. Step 4: Database Migrations & Initial Seed Data

1. **Flyway Migrations**:
   Flyway runs automatically on startup of `unipulse-core-api` and `analytics-service`, applying `V1__init_schema.sql` and `V1__init_analytics_schema.sql` idempotently.

2. **Seed Data Execution**:
   To seed staging with the standard test dataset (4 departments, 12 categories, 20 technicians, 200 initial service requests):
   ```bash
   DB_HOST=$(terraform -chdir=infra/terraform output -raw rds_endpoint | cut -d: -f1)
   
   # Retrieve master database password from AWS Secrets Manager
   DB_PASS=$(aws secretsmanager get-secret-value \
     --secret-id "unipulse/staging/credentials" \
     --query SecretString --output text | jq -r .DB_PASSWORD)

   PGPASSWORD=${DB_PASS} psql -h ${DB_HOST} -U unipulse_admin -d unipulse -f infra/seed.sql
   ```

---

## 7. Step 5: Zero-Downtime Rolling Update on ECS

When new images are pushed, trigger zero-downtime rolling updates:

```bash
CLUSTER="unipulse-staging-cluster"

for svc in unipulse-core-api unipulse-assignment-service unipulse-notification-service unipulse-analytics-service; do
  aws ecs update-service \
    --cluster ${CLUSTER} \
    --service ${svc} \
    --force-new-deployment
done

# Wait for services to stabilize
aws ecs wait services-stable \
  --cluster ${CLUSTER} \
  --services unipulse-core-api unipulse-assignment-service unipulse-notification-service unipulse-analytics-service
```

---

## 8. Verification & Smoke Testing

Execute health check probes against the Application Load Balancer:

```bash
ALB_HOST=$(terraform -chdir=infra/terraform output -raw alb_dns_name)

# 1. Core API Health Check
curl -s -f "http://${ALB_HOST}/actuator/health" | jq .

# Expected Output:
# {
#   "status": "UP",
#   "components": {
#     "db": { "status": "UP" },
#     "redis": { "status": "UP" },
#     "diskSpace": { "status": "UP" }
#   }
# }

# 2. Analytics Service Routing Probe
curl -s -f "http://${ALB_HOST}/api/v1/analytics/overview" | jq .

# 3. Frontend Web CDN Check
CF_HOST=$(terraform -chdir=infra/terraform output -raw cloudfront_domain_name)
curl -s -I "https://${CF_HOST}/index.html" | grep "HTTP/2 200"
```

---

## 9. Monitoring, Metrics & Alerting

- **CloudWatch Dashboard**: `unipulse-staging-operational-dashboard`
  - Real-time ALB request rates and 5XX error spikes.
  - p50 and p95 target latency curves.
  - PostgreSQL CPU and active connection pool graphs.
  - ECS memory and CPU utilization percentages.
- **Configured Metric Alarms**:
  - `alb-high-5xx`: Fires if > 5 5XX errors occur in 1 minute.
  - `alb-high-latency`: Fires if p95 response time exceeds 500 ms for 3 consecutive minutes.
  - `rds-high-cpu`: Fires if PostgreSQL CPU exceeds 80% for 10 minutes.
  - `ecs-core-high-cpu`: Fires if Core API CPU exceeds 80% for 6 minutes.

Alarms automatically publish to the SNS topic `unipulse-staging-alarms-topic`, notifying DevOps engineers via email or PagerDuty.

---

## 10. Estimated Monthly AWS Infrastructure Costs

| Resource | Configuration / Capacity | Monthly Cost (USD) |
| :--- | :--- | :--- |
| **ECS Fargate Tasks** | 8 tasks across 4 microservices (0.5–1 vCPU, 1–2 GB RAM) | $85.00 |
| **RDS PostgreSQL Multi-AZ** | `db.t4g.medium` (2 vCPU, 4 GB RAM, 50 GB gp3 autoscaling) | $98.00 |
| **ElastiCache Redis Multi-AZ** | 2 x `cache.t4g.micro` with replication & failover | $28.00 |
| **Application Load Balancer** | 1 ALB with 3 target groups + LCU traffic | $22.00 |
| **NAT Gateways** | 3 AZs for high availability ($0.045/hr + bandwidth) | $97.00 (or $32.00 with single NAT in dev) |
| **S3 & CloudFront CDN** | Static hosting & global edge distribution (100 GB) | $5.00 |
| **CloudWatch Logs & Metrics** | 30-day log retention, custom dashboard, 4 alarms | $12.00 |
| **AWS Secrets Manager** | 1 secret with daily rotation | $1.00 |
| **Total Estimated Cost** | **Fully Redundant Multi-AZ Architecture** | **~$348.00 / month** |

*Note: For lower-cost staging or testing environments, reduce to a single shared NAT Gateway and `db.t4g.small` to bring total infrastructure costs down to ~$165/month.*

---

## 11. Infrastructure Teardown & Clean Destruction

To completely destroy all provisioned AWS cloud resources and prevent ongoing billing:

```bash
cd infra/terraform

# Clean up S3 bucket contents prior to destroy
S3_BUCKET=$(terraform output -raw s3_frontend_bucket)
aws s3 rm s3://${S3_BUCKET} --recursive || true

# Execute complete Terraform teardown
terraform destroy -auto-approve
```

Verify that the teardown completes with `Destroy complete! Resources: 42 destroyed.`
