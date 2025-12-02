#!/bin/bash
#
# FitQuest Database Backup Script
# Usage: ./backup-database.sh [environment] [backup-type]
# Example: ./backup-database.sh production full
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default values
ENVIRONMENT="${1:-production}"
BACKUP_TYPE="${2:-full}"  # full, schema, data
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-/tmp/fitquest-backups}"
S3_BUCKET="${S3_BUCKET:-fitquest-${ENVIRONMENT}-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Validate environment
validate_environment() {
    if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
        exit 1
    fi
}

# Load environment variables
load_env() {
    local env_file="${PROJECT_ROOT}/.env.${ENVIRONMENT}"
    if [[ -f "$env_file" ]]; then
        log_info "Loading environment from $env_file"
        set -a
        source "$env_file"
        set +a
    else
        log_warn "Environment file not found: $env_file"
        log_info "Using environment variables from shell"
    fi

    # Validate required variables
    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_error "DATABASE_URL is not set"
        exit 1
    fi
}

# Parse DATABASE_URL
parse_database_url() {
    # postgresql://user:password@host:port/database
    local url="$DATABASE_URL"

    # Remove protocol
    url="${url#postgresql://}"
    url="${url#postgres://}"

    # Extract user:password
    local userpass="${url%%@*}"
    DB_USER="${userpass%%:*}"
    DB_PASSWORD="${userpass#*:}"

    # Extract host:port/database
    local hostpart="${url#*@}"
    local hostport="${hostpart%%/*}"
    DB_HOST="${hostport%%:*}"
    DB_PORT="${hostport#*:}"
    DB_NAME="${hostpart#*/}"
    DB_NAME="${DB_NAME%%\?*}"  # Remove query string

    # Default port
    DB_PORT="${DB_PORT:-5432}"
}

# Create backup directory
setup_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    log_info "Backup directory: $BACKUP_DIR"
}

# Perform database backup
backup_database() {
    local backup_file="${BACKUP_DIR}/fitquest_${ENVIRONMENT}_${BACKUP_TYPE}_${TIMESTAMP}.sql"
    local compressed_file="${backup_file}.gz"

    log_info "Starting $BACKUP_TYPE backup for $ENVIRONMENT..."
    log_info "Database: $DB_NAME @ $DB_HOST:$DB_PORT"

    export PGPASSWORD="$DB_PASSWORD"

    case "$BACKUP_TYPE" in
        full)
            pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                --format=plain \
                --no-owner \
                --no-privileges \
                --verbose \
                > "$backup_file"
            ;;
        schema)
            pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                --schema-only \
                --no-owner \
                --no-privileges \
                > "$backup_file"
            ;;
        data)
            pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                --data-only \
                --no-owner \
                --no-privileges \
                > "$backup_file"
            ;;
        *)
            log_error "Invalid backup type: $BACKUP_TYPE"
            exit 1
            ;;
    esac

    unset PGPASSWORD

    # Compress backup
    log_info "Compressing backup..."
    gzip -9 "$backup_file"

    local size=$(du -h "$compressed_file" | cut -f1)
    log_info "Backup completed: $compressed_file ($size)"

    echo "$compressed_file"
}

# Upload to S3
upload_to_s3() {
    local backup_file="$1"
    local s3_key="backups/${ENVIRONMENT}/$(basename "$backup_file")"

    if command -v aws &> /dev/null; then
        log_info "Uploading to S3: s3://${S3_BUCKET}/${s3_key}"
        aws s3 cp "$backup_file" "s3://${S3_BUCKET}/${s3_key}" \
            --storage-class STANDARD_IA \
            --metadata "environment=${ENVIRONMENT},backup-type=${BACKUP_TYPE},timestamp=${TIMESTAMP}"
        log_info "Upload completed"
    else
        log_warn "AWS CLI not found. Skipping S3 upload."
    fi
}

# Cleanup old local backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "fitquest_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
    log_info "Cleanup completed"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"

    log_info "Verifying backup integrity..."

    # Check if file exists and is not empty
    if [[ ! -s "$backup_file" ]]; then
        log_error "Backup file is empty or doesn't exist"
        exit 1
    fi

    # Check gzip integrity
    if ! gzip -t "$backup_file" 2>/dev/null; then
        log_error "Backup file is corrupted"
        exit 1
    fi

    # Check SQL structure (basic check)
    local line_count=$(zcat "$backup_file" | wc -l)
    if [[ "$line_count" -lt 10 ]]; then
        log_warn "Backup seems unusually small ($line_count lines)"
    fi

    log_info "Backup verification passed"
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
                    \"title\": \"FitQuest Database Backup - ${ENVIRONMENT}\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"Type\", \"value\": \"$BACKUP_TYPE\", \"short\": true},
                        {\"title\": \"Timestamp\", \"value\": \"$TIMESTAMP\", \"short\": true}
                    ]
                }]
            }" || log_warn "Failed to send Slack notification"
    fi
}

# Main execution
main() {
    log_info "=========================================="
    log_info "FitQuest Database Backup"
    log_info "Environment: $ENVIRONMENT"
    log_info "Backup Type: $BACKUP_TYPE"
    log_info "Timestamp: $TIMESTAMP"
    log_info "=========================================="

    validate_environment
    load_env
    parse_database_url
    setup_backup_dir

    # Perform backup
    backup_file=$(backup_database)

    # Verify backup
    verify_backup "$backup_file"

    # Upload to S3
    upload_to_s3 "$backup_file"

    # Cleanup old backups
    cleanup_old_backups

    # Send success notification
    send_notification "success" "Backup completed successfully: $(basename "$backup_file")"

    log_info "=========================================="
    log_info "Backup completed successfully!"
    log_info "=========================================="
}

# Error handling
trap 'log_error "Backup failed!"; send_notification "error" "Backup failed at line $LINENO"; exit 1' ERR

main "$@"
