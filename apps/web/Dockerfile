# Multi-stage Dockerfile for the Next.js web app, built from the repo
# root so pnpm workspace resolution works.

# ---------- 1. base ----------------------------------------------------
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# ---------- 2. deps ----------------------------------------------------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/auth/package.json ./packages/auth/
COPY packages/database/package.json ./packages/database/
COPY packages/email/package.json ./packages/email/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/logger/package.json ./packages/logger/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/services/package.json ./packages/services/
COPY packages/trpc/package.json ./packages/trpc/
COPY packages/typescript-config/package.json ./packages/typescript-config/
RUN pnpm install --frozen-lockfile --prefer-offline

# ---------- 3. build ---------------------------------------------------
FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
ENV WORKSPACE_ROOT=/app
# Required while compiling /api/auth route during next build.
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sensus
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY apps/web ./apps/web
COPY packages ./packages
RUN touch apps/web/.env

# Build args become NEXT_PUBLIC_* baked into the static output.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_AUTH_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_AUTH_URL=$NEXT_PUBLIC_AUTH_URL

RUN pnpm --filter web... build

# ---------- 4. runtime -------------------------------------------------
FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN addgroup --system --gid 1001 sensus \
  && adduser --system --uid 1001 --ingroup sensus sensus

RUN apk add --no-cache tini

# Next standalone output already inlines server + node_modules it needs.
COPY --from=build --chown=sensus:sensus /app/apps/web/.next/standalone ./
COPY --from=build --chown=sensus:sensus /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=sensus:sensus /app/apps/web/public ./apps/web/public

USER sensus
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
