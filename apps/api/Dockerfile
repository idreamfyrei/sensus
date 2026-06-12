FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY apps/api/package.json ./apps/api/
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

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages ./packages
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY apps/api ./apps/api
COPY packages ./packages
RUN pnpm --filter @repo/api... build

RUN pnpm install --prod --frozen-lockfile --prefer-offline --force --ignore-scripts

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV PORT=8000
WORKDIR /app

RUN addgroup --system --gid 1001 sensus \
  && adduser --system --uid 1001 --ingroup sensus sensus

RUN apk add --no-cache tini

COPY --from=build --chown=sensus:sensus /app/node_modules ./node_modules
COPY --from=build --chown=sensus:sensus /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=sensus:sensus /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=sensus:sensus /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=sensus:sensus /app/packages ./packages
COPY --from=build --chown=sensus:sensus /app/package.json ./package.json
COPY --from=build --chown=sensus:sensus /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

USER sensus
EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s \
  CMD wget --quiet --tries=1 --spider http://localhost:8000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/api/dist/index.js"]
