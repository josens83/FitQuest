# FitQuest Deployment Guide

## Prerequisites

- AWS CLI configured
- kubectl configured
- Terraform >= 1.5
- Docker
- Node.js >= 18
- pnpm

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/fitquest.git
cd fitquest
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

### 3. Install Dependencies

```bash
pnpm install
```

## Local Development

### Quick Start

```bash
# Run setup script
./scripts/setup-local-dev.sh

# Start development servers
pnpm dev
```

### Manual Setup

```bash
# Start infrastructure
docker-compose up -d postgres redis

# Run database migrations
pnpm db:push

# Seed database (optional)
pnpm db:seed

# Start API
pnpm --filter @fitquest/api dev

# Start Web (in another terminal)
pnpm --filter @fitquest/web dev
```

## Staging Deployment

### Infrastructure (Terraform)

```bash
cd terraform/environments/staging

# Initialize Terraform
terraform init -backend-config=backend.tfvars

# Plan changes
terraform plan

# Apply changes
terraform apply
```

### Application (Kubernetes)

```bash
# Update kubeconfig
aws eks update-kubeconfig --name fitquest-staging-cluster --region ap-northeast-2

# Deploy with Kustomize
kubectl apply -k k8s/overlays/staging

# Verify deployment
kubectl get pods -n fitquest-staging
```

### Using Deploy Script

```bash
./scripts/deploy.sh staging --tag v1.0.0
```

## Production Deployment

### Infrastructure

```bash
cd terraform/environments/production

terraform init -backend-config=backend.tfvars
terraform plan
terraform apply
```

### Application

```bash
# Update kubeconfig
aws eks update-kubeconfig --name fitquest-production-cluster --region ap-northeast-2

# Deploy
./scripts/deploy.sh production --tag v1.0.0
```

## CI/CD Pipeline

GitHub Actions handles automated deployments:

```yaml
# Triggered on push to main
main branch → Build → Test → Deploy Staging → E2E Tests → Deploy Production
```

### Environment Variables (GitHub Secrets)

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `DOCKER_REGISTRY` | Container registry URL |
| `KUBE_CONFIG` | Kubernetes config (base64) |
| `SENTRY_DSN` | Sentry DSN |
| `SLACK_WEBHOOK_URL` | Slack notifications |

## Database Operations

### Backup

```bash
./scripts/backup-database.sh production full
```

### Restore

```bash
./scripts/restore-database.sh staging /path/to/backup.sql.gz
```

### Migrations

```bash
# Generate migration
pnpm db:migrate dev

# Apply migration
pnpm db:migrate deploy

# View database
pnpm db:studio
```

## Kubernetes Operations

### Scaling

```bash
# Manual scaling
kubectl scale deployment fitquest-api -n fitquest --replicas=5

# HPA is configured for automatic scaling
kubectl get hpa -n fitquest
```

### Logs

```bash
# API logs
kubectl logs -f deployment/fitquest-api -n fitquest

# All pods
kubectl logs -f -l app.kubernetes.io/name=fitquest -n fitquest
```

### Rolling Update

```bash
# Update image
kubectl set image deployment/fitquest-api api=fitquest/api:v1.1.0 -n fitquest

# Watch rollout
kubectl rollout status deployment/fitquest-api -n fitquest

# Rollback if needed
kubectl rollout undo deployment/fitquest-api -n fitquest
```

## Troubleshooting

### Pod Issues

```bash
# Check pod status
kubectl describe pod <pod-name> -n fitquest

# Check events
kubectl get events -n fitquest --sort-by='.lastTimestamp'
```

### Database Connection

```bash
# Port forward to database
kubectl port-forward svc/postgres-service 5432:5432 -n fitquest

# Test connection
psql -h localhost -U fitquest -d fitquest
```

### Redis Connection

```bash
kubectl port-forward svc/redis-service 6379:6379 -n fitquest
redis-cli ping
```

## Rollback Procedures

### Application Rollback

```bash
# List revisions
kubectl rollout history deployment/fitquest-api -n fitquest

# Rollback to previous
kubectl rollout undo deployment/fitquest-api -n fitquest

# Rollback to specific revision
kubectl rollout undo deployment/fitquest-api -n fitquest --to-revision=3
```

### Database Rollback

```bash
# Restore from backup
./scripts/restore-database.sh production s3://fitquest-backups/backup.sql.gz
```

## Monitoring

### Health Checks

```bash
# API health
curl https://api.fitquest.com/api/health

# Kubernetes health
kubectl get pods -n fitquest
kubectl top pods -n fitquest
```

### Metrics

- Prometheus: `http://prometheus.internal:9090`
- Grafana: `http://grafana.internal:3000`

### Logs

- CloudWatch Logs
- Kibana (if ELK stack is deployed)

## Security Checklist

- [ ] All secrets in Kubernetes Secrets or AWS Secrets Manager
- [ ] TLS certificates valid and auto-renewed
- [ ] Network policies applied
- [ ] RBAC configured
- [ ] Security scanning passed
- [ ] Backup tested
