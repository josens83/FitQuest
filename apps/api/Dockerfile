# syntax=docker/dockerfile:1

# ================================
# Base stage
# ================================
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# Install necessary system dependencies
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# ================================
# Dependencies stage
# ================================
FROM base AS deps

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy package.json files from all packages and apps
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/utils/package.json ./packages/utils/

# Install all dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ================================
# Builder stage
# ================================
FROM base AS builder

ARG APP_VERSION=1.0.0
ENV APP_VERSION=${APP_VERSION}

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/utils/node_modules ./packages/utils/node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm --filter @fitquest/database db:generate

# Build packages
RUN pnpm --filter @fitquest/shared build
RUN pnpm --filter @fitquest/utils build
RUN pnpm --filter @fitquest/api build

# Prune dev dependencies
RUN pnpm --filter @fitquest/api deploy --prod /app/pruned

# ================================
# Production stage
# ================================
FROM node:20-alpine AS runner

# Install necessary runtime dependencies
RUN apk add --no-cache libc6-compat openssl dumb-init

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fitquest

WORKDIR /app

# Copy production dependencies and build output
COPY --from=builder --chown=fitquest:nodejs /app/pruned ./

# Copy Prisma schema and migrations
COPY --from=builder --chown=fitquest:nodejs /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder --chown=fitquest:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

ARG APP_VERSION=1.0.0
ENV APP_VERSION=${APP_VERSION}

# Switch to non-root user
USER fitquest

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/live || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]
