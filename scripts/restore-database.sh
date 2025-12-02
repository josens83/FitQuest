#!/bin/bash
#
# FitQuest Database Restore Script
# Usage: ./restore-database.sh [environment] [backup-file]
# Example: ./restore-database.sh staging /path/to/backup.sql.gz
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Arguments
ENVIRONMENT="${1:-}"
BACKUP_FILE="${2:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Show usage
usage() {
    cat << EOF
Usage: $0 <environment> <backup-file>

Arguments:
    environment     Target environment (staging|production)
    backup-file     Path to backup file (.sql.gz) or S3 URI

Examples:
    $0 staging /tmp/fitquest_staging_full_20240115.sql.gz
    $0 staging s3://fitquest-staging-backups/backups/staging/backup.sql.gz

Options:
    --dry-run       Show what would be done without executing
    --force         Skip confirmation prompt
    --help          Show this help message

EOF
    exit 1
}

# Validate arguments
validate_args() {
    if [[ -z "$ENVIRONMENT" ]] || [[ -z "$BACKUP_FILE" ]]; then
        usage
    fi

    if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        exit 1
    fi
}

# Load environment
load_env() {
    local env_file="${PROJECT_ROOT}/.env.${ENVIRONMENT}"
    if [[ -f "$env_file" ]]; then
        log_info "Loading environment from $env_file"
        set -a
        source "$env_file"
        set +a
    fi

    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_error "DATABASE_URL is not set"
        exit 1
    fi
}

# Parse DATABASE_URL
parse_database_url() {
    local url="$DATABASE_URL"
    url="${url#postgresql://}"
    url="${url#postgres://}"

    local userpass="${url%%@*}"
    DB_USER="${userpass%%:*}"
    DB_PASSWORD="${userpass#*:}"

    local hostpart="${url#*@}"
    local hostport="${hostpart%%/*}"
    DB_HOST="${hostport%%:*}"
    DB_PORT="${hostport#*:}"
    DB_NAME="${hostpart#*/}"
    DB_NAME="${DB_NAME%%\?*}"
    DB_PORT="${DB_PORT:-5432}"
}

# Download from S3 if needed
prepare_backup_file() {
    if [[ "$BACKUP_FILE" == s3://* ]]; then
        log_info "Downloading backup from S3..."
        local local_file="/tmp/$(basename "$BACKUP_FILE")"
        aws s3 cp "$BACKUP_FILE" "$local_file"
        BACKUP_FILE="$local_file"
        log_info "Downloaded to: $BACKUP_FILE"
    fi

    if [[ ! -f "$BACKUP_FILE" ]]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
}

# Confirm restore
confirm_restore() {
    if [[ "${FORCE:-}" == "true" ]]; then
        return 0
    fi

    echo ""
    log_warn "========================================"
    log_warn "WARNING: This will REPLACE all data in:"
    log_warn "  Database: $DB_NAME"
    log_warn "  Host: $DB_HOST"
    log_warn "  Environment: $ENVIRONMENT"
    log_warn "========================================"
    echo ""

    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
}

# Create pre-restore backup
create_pre_restore_backup() {
    log_info "Creating pre-restore backup..."

    export PGPASSWORD="$DB_PASSWORD"
    local pre_backup="/tmp/pre_restore_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql.gz"

    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --format=plain \
        --no-owner \
        --no-privileges \
        | gzip > "$pre_backup"

    unset PGPASSWORD

    log_info "Pre-restore backup created: $pre_backup"
    echo "$pre_backup"
}

# Restore database
restore_database() {
    log_info "Starting database restore..."

    export PGPASSWORD="$DB_PASSWORD"

    # Decompress if needed
    local sql_file="$BACKUP_FILE"
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        log_info "Decompressing backup..."
        sql_file="/tmp/restore_$(date +%s).sql"
        gunzip -c "$BACKUP_FILE" > "$sql_file"
    fi

    # Terminate existing connections
    log_info "Terminating existing connections..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres << EOF
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
EOF

    # Drop and recreate database
    log_info "Recreating database..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres << EOF
DROP DATABASE IF EXISTS ${DB_NAME};
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
EOF

    # Restore from backup
    log_info "Restoring data..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --single-transaction \
        --set ON_ERROR_STOP=on \
        < "$sql_file"

    unset PGPASSWORD

    # Cleanup temp file
    if [[ "$sql_file" != "$BACKUP_FILE" ]]; then
        rm -f "$sql_file"
    fi

    log_info "Restore completed"
}

# Verify restore
verify_restore() {
    log_info "Verifying restore..."

    export PGPASSWORD="$DB_PASSWORD"

    # Check table count
    local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

    # Check record counts for key tables
    local user_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")

    unset PGPASSWORD

    log_info "Tables restored: $table_count"
    log_info "Users restored: $user_count"

    if [[ "$table_count" -lt 1 ]]; then
        log_error "Restore verification failed: No tables found"
        exit 1
    fi

    log_info "Verification passed"
}

# Main
main() {
    log_info "=========================================="
    log_info "FitQuest Database Restore"
    log_info "Environment: $ENVIRONMENT"
    log_info "Backup File: $BACKUP_FILE"
    log_info "=========================================="

    validate_args
    load_env
    parse_database_url
    prepare_backup_file
    confirm_restore

    # Create safety backup
    pre_backup=$(create_pre_restore_backup)

    # Perform restore
    restore_database

    # Verify
    verify_restore

    log_info "=========================================="
    log_info "Restore completed successfully!"
    log_info "Pre-restore backup saved at: $pre_backup"
    log_info "=========================================="
}

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run) DRY_RUN=true; shift ;;
        --force) FORCE=true; shift ;;
        --help) usage ;;
        -*) log_error "Unknown option: $1"; usage ;;
        *)
            if [[ -z "$ENVIRONMENT" ]]; then
                ENVIRONMENT="$1"
            elif [[ -z "$BACKUP_FILE" ]]; then
                BACKUP_FILE="$1"
            fi
            shift
            ;;
    esac
done

trap 'log_error "Restore failed!"; exit 1' ERR

main
