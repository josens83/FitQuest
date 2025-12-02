#!/bin/bash
#
# FitQuest Deployment Script
# Usage: ./deploy.sh <environment> [options]
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration
ENVIRONMENT="${1:-}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
KUBECONFIG="${KUBECONFIG:-$HOME/.kube/config}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

usage() {
    cat << EOF
Usage: $0 <environment> [options]

Arguments:
    environment     Target environment (staging|production)

Options:
    --tag           Docker image tag (default: latest)
    --dry-run       Show what would be done
    --skip-build    Skip building Docker images
    --skip-tests    Skip running tests
    --force         Skip confirmation prompts
    --help          Show this help

Examples:
    $0 staging
    $0 production --tag v1.2.3
    $0 staging --skip-build --dry-run

EOF
    exit 1
}

# Validate environment
validate_environment() {
    if [[ -z "$ENVIRONMENT" ]]; then
        log_error "Environment is required"
        usage
    fi

    if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        exit 1
    fi
}

# Run tests
run_tests() {
    if [[ "${SKIP_TESTS:-}" == "true" ]]; then
        log_warn "Skipping tests"
        return 0
    fi

    log_step "Running tests..."
    cd "$PROJECT_ROOT"

    pnpm typecheck
    pnpm lint
    pnpm test

    log_info "All tests passed"
}

# Build Docker images
build_images() {
    if [[ "${SKIP_BUILD:-}" == "true" ]]; then
        log_warn "Skipping build"
        return 0
    fi

    log_step "Building Docker images..."

    cd "$PROJECT_ROOT"

    # Build API
    log_info "Building API image..."
    docker build \
        -f apps/api/Dockerfile \
        -t "${DOCKER_REGISTRY}/fitquest/api:${IMAGE_TAG}" \
        -t "${DOCKER_REGISTRY}/fitquest/api:${ENVIRONMENT}" \
        .

    # Build Web
    log_info "Building Web image..."
    docker build \
        -f apps/web/Dockerfile \
        -t "${DOCKER_REGISTRY}/fitquest/web:${IMAGE_TAG}" \
        -t "${DOCKER_REGISTRY}/fitquest/web:${ENVIRONMENT}" \
        .

    log_info "Docker images built successfully"
}

# Push images to registry
push_images() {
    if [[ -z "$DOCKER_REGISTRY" ]]; then
        log_warn "DOCKER_REGISTRY not set, skipping push"
        return 0
    fi

    log_step "Pushing images to registry..."

    docker push "${DOCKER_REGISTRY}/fitquest/api:${IMAGE_TAG}"
    docker push "${DOCKER_REGISTRY}/fitquest/api:${ENVIRONMENT}"
    docker push "${DOCKER_REGISTRY}/fitquest/web:${IMAGE_TAG}"
    docker push "${DOCKER_REGISTRY}/fitquest/web:${ENVIRONMENT}"

    log_info "Images pushed successfully"
}

# Run database migrations
run_migrations() {
    log_step "Running database migrations..."

    # This would typically run as a Kubernetes Job
    kubectl apply -f - << EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: fitquest-migration-$(date +%s)
  namespace: fitquest${ENVIRONMENT == "staging" ? "-staging" : ""}
spec:
  ttlSecondsAfterFinished: 300
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migration
          image: ${DOCKER_REGISTRY}/fitquest/api:${IMAGE_TAG}
          command: ["pnpm", "db:migrate", "deploy"]
          envFrom:
            - secretRef:
                name: fitquest-secrets
EOF

    # Wait for migration to complete
    kubectl wait --for=condition=complete job/fitquest-migration-* -n fitquest --timeout=300s

    log_info "Migrations completed"
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    log_step "Deploying to Kubernetes..."

    cd "$PROJECT_ROOT/k8s"

    local overlay="overlays/${ENVIRONMENT}"

    if [[ ! -d "$overlay" ]]; then
        log_error "Overlay not found: $overlay"
        exit 1
    fi

    # Apply with Kustomize
    if [[ "${DRY_RUN:-}" == "true" ]]; then
        kubectl kustomize "$overlay"
    else
        kubectl apply -k "$overlay"

        # Wait for rollout
        log_info "Waiting for API deployment..."
        kubectl rollout status deployment/fitquest-api -n fitquest --timeout=300s

        log_info "Waiting for Web deployment..."
        kubectl rollout status deployment/fitquest-web -n fitquest --timeout=300s
    fi

    log_info "Kubernetes deployment completed"
}

# Verify deployment
verify_deployment() {
    log_step "Verifying deployment..."

    local namespace="fitquest"
    [[ "$ENVIRONMENT" == "staging" ]] && namespace="fitquest-staging"

    # Check pod status
    kubectl get pods -n "$namespace" -l app.kubernetes.io/name=fitquest

    # Check service endpoints
    kubectl get endpoints -n "$namespace"

    # Health check
    local api_pod=$(kubectl get pods -n "$namespace" -l app.kubernetes.io/component=api -o jsonpath='{.items[0].metadata.name}')
    if [[ -n "$api_pod" ]]; then
        kubectl exec -n "$namespace" "$api_pod" -- curl -s http://localhost:4000/api/health || log_warn "Health check failed"
    fi

    log_info "Deployment verification completed"
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"

    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local color="good"
        [[ "$status" == "error" ]] && color="danger"

        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"FitQuest Deployment - ${ENVIRONMENT}\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"Image Tag\", \"value\": \"$IMAGE_TAG\", \"short\": true}
                    ]
                }]
            }" || log_warn "Failed to send notification"
    fi
}

# Confirm deployment
confirm_deployment() {
    if [[ "${FORCE:-}" == "true" ]]; then
        return 0
    fi

    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo ""
        log_warn "========================================"
        log_warn "  PRODUCTION DEPLOYMENT"
        log_warn "========================================"
        echo ""
        read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
        if [[ "$confirm" != "yes" ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
}

# Main
main() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  FitQuest Deployment                   ${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Image Tag: $IMAGE_TAG"
    echo ""

    validate_environment
    confirm_deployment

    run_tests
    build_images
    push_images
    deploy_to_kubernetes
    verify_deployment

    send_notification "success" "Deployment completed successfully"

    echo ""
    log_info "=========================================="
    log_info "  Deployment completed successfully!"
    log_info "=========================================="
}

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        --tag) IMAGE_TAG="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        --skip-build) SKIP_BUILD=true; shift ;;
        --skip-tests) SKIP_TESTS=true; shift ;;
        --force) FORCE=true; shift ;;
        --help) usage ;;
        -*) log_error "Unknown option: $1"; usage ;;
        *)
            if [[ -z "$ENVIRONMENT" ]]; then
                ENVIRONMENT="$1"
            fi
            shift
            ;;
    esac
done

trap 'log_error "Deployment failed!"; send_notification "error" "Deployment failed"; exit 1' ERR

main
