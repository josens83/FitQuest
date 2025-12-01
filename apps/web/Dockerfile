# syntax=docker/dockerfile:1

# ================================
# Base stage
# ================================
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# Install necessary system dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

# ================================
# Dependencies stage
# ================================
FROM base AS deps

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy package.json files from all packages and apps
COPY apps/web/package.json ./apps/web/
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
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL

ENV APP_VERSION=${APP_VERSION}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/utils/node_modules ./packages/utils/node_modules

# Copy source code
COPY . .

# Build packages
RUN pnpm --filter @fitquest/shared build
RUN pnpm --filter @fitquest/utils build
RUN pnpm --filter @fitquest/web build

# ================================
# Production stage
# ================================
FROM node:20-alpine AS runner

# Install necessary runtime dependencies
RUN apk add --no-cache libc6-compat dumb-init

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ARG APP_VERSION=1.0.0
ENV APP_VERSION=${APP_VERSION}

# Copy public files
COPY --from=builder /app/apps/web/public ./public

# Copy Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "apps/web/server.js"]
