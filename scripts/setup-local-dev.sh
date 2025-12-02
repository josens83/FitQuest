#!/bin/bash
#
# FitQuest Local Development Setup
# Usage: ./setup-local-dev.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."

    local missing=()

    if ! command -v node &> /dev/null; then
        missing+=("Node.js (v18+)")
    fi

    if ! command -v pnpm &> /dev/null; then
        missing+=("pnpm")
    fi

    if ! command -v docker &> /dev/null; then
        missing+=("Docker")
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing+=("Docker Compose")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing prerequisites:"
        for item in "${missing[@]}"; do
            echo "  - $item"
        done
        echo ""
        echo "Please install the missing prerequisites and try again."
        exit 1
    fi

    log_info "All prerequisites satisfied"
}

# Setup environment files
setup_env_files() {
    log_step "Setting up environment files..."

    cd "$PROJECT_ROOT"

    if [[ ! -f ".env" ]]; then
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
            log_info "Created .env from .env.example"
        else
            log_warn ".env.example not found, creating basic .env"
            cat > .env << 'EOF'
# FitQuest Local Development Environment

NODE_ENV=development

# Database
DATABASE_URL=postgresql://fitquest:fitquest@localhost:5432/fitquest?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=local-dev-secret-change-in-production
JWT_REFRESH_SECRET=local-dev-refresh-secret-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Supabase (optional for local dev)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# API
API_PORT=4000
CORS_ORIGINS=http://localhost:3000

# OpenAI (optional)
OPENAI_API_KEY=

# Stripe (optional for local dev)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
EOF
        fi
    else
        log_info ".env already exists, skipping"
    fi
}

# Start infrastructure services
start_infrastructure() {
    log_step "Starting infrastructure services (PostgreSQL, Redis)..."

    cd "$PROJECT_ROOT"

    # Use docker-compose or docker compose
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.yml up -d postgres redis
    else
        docker compose -f docker-compose.yml up -d postgres redis
    fi

    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 5

    # Check PostgreSQL
    local retries=30
    while ! docker exec fitquest-postgres pg_isready -U fitquest &> /dev/null; do
        retries=$((retries - 1))
        if [[ $retries -le 0 ]]; then
            log_error "PostgreSQL failed to start"
            exit 1
        fi
        sleep 1
    done
    log_info "PostgreSQL is ready"

    # Check Redis
    if docker exec fitquest-redis redis-cli ping &> /dev/null; then
        log_info "Redis is ready"
    else
        log_warn "Redis may not be ready yet"
    fi
}

# Install dependencies
install_dependencies() {
    log_step "Installing dependencies..."

    cd "$PROJECT_ROOT"
    pnpm install

    log_info "Dependencies installed"
}

# Setup database
setup_database() {
    log_step "Setting up database..."

    cd "$PROJECT_ROOT"

    # Generate Prisma client
    log_info "Generating Prisma client..."
    pnpm db:generate

    # Push schema to database
    log_info "Pushing schema to database..."
    pnpm db:push

    # Seed database (optional)
    read -p "Do you want to seed the database with sample data? (y/n): " seed_choice
    if [[ "$seed_choice" =~ ^[Yy]$ ]]; then
        log_info "Seeding database..."
        pnpm db:seed
    fi

    log_info "Database setup completed"
}

# Print success message
print_success() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  FitQuest Development Setup Complete!  ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "You can now start the development servers:"
    echo ""
    echo "  # Start all services"
    echo "  pnpm dev"
    echo ""
    echo "  # Or start individually:"
    echo "  pnpm --filter @fitquest/api dev    # API at http://localhost:4000"
    echo "  pnpm --filter @fitquest/web dev    # Web at http://localhost:3000"
    echo ""
    echo "Other useful commands:"
    echo "  pnpm db:studio    # Open Prisma Studio"
    echo "  pnpm test         # Run tests"
    echo "  pnpm lint         # Run linting"
    echo ""
    echo "Documentation:"
    echo "  API Docs: http://localhost:4000/docs"
    echo ""
}

# Main
main() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  FitQuest Local Development Setup     ${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    check_prerequisites
    setup_env_files
    start_infrastructure
    install_dependencies
    setup_database
    print_success
}

main "$@"
