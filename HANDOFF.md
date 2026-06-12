# Sensus - session handoff

Read `CONTEXT.md` first for canonical terms, then use this file for current execution state and next actions.

---

## Current status

Tier progress:

- Phase 0-5.B: shipped
- Tier 1 (visibility, response mgmt, analytics, rate limit): shipped
- Tier 2 (explore, templates, landing, pricing): shipped
- Tier 3.A (demo seed): shipped
- Tier 3.B (deploy package): **verified and fixed**
- Tier 3.C (email notifications): not started

What changed during Tier 3.B verification:

- Added root `.dockerignore` to keep local artifacts out of Docker context.
- Web Docker context dropped from ~530 MB to ~20 KB.
- Fixed Docker-only `.env` symlink issue by creating `apps/web/.env` in image build stage.
- Fixed web build-stage workspace dependency resolution by copying `/app/packages` from deps stage.
- Fixed web Next build env validation during `/api/auth` page-data collection by setting a build-only placeholder `DATABASE_URL`.
- Fixed API prod-prune stage failure (`husky` prepare hook) by using `pnpm install --prod ... --ignore-scripts` in build stage.

Verification now complete:

- `docker build -f apps/web/Dockerfile ...` passes
- `docker build -f apps/api/Dockerfile ...` passes

Still unverified:

- `docker compose -f docker-compose.prod.yml up` end-to-end runtime boot (postgres/api/web/caddy together)

---

## Demo seed (Tier 3.A)

Seeded demo forms:

- `year-end-favorites` (vaporwave, public, template, 12 responses, 142 views)
- `pixel-jam-26` (pixel, public, template, 10 responses, 318 views)
- `anime-con-feedback` (anime, public, template, 9 responses, 421 views)
- `reading-room` (museum, public, template, 8 responses, 86 views)
- `after-show-notes` (brutalist, public, non-template, 7 responses, 108 views)
- `studio-standup` (terminal, unlisted, non-template, 5 responses, 64 views)

Demo credentials:

- `demo@sensus.app` / `SeeSensus!`
- `judge@sensus.app` / `SeeSensus!`
- `dev@sensus.local` / `DevPassword123!`

Seed command is idempotent: `pnpm db:seed-demo`.

---

## Deploy package files (Tier 3.B)

- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `docker-compose.prod.yml`
- `Caddyfile`
- `.env.example`
- `README.md` (full deployment + architecture rewrite)

---

## Commands to resume

From repo root:

```bash
# image verification (already passing)
docker build -f apps/api/Dockerfile -t sensus-api:test .
docker build -f apps/web/Dockerfile -t sensus-web:test \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000/trpc \
  --build-arg NEXT_PUBLIC_AUTH_URL=http://localhost:3000 .

# next high-priority verification
DOMAIN=sensus.local ADMIN_EMAIL=test@sensus.local \
POSTGRES_PASSWORD=test BETTER_AUTH_SECRET=$(openssl rand -base64 32) \
BETTER_AUTH_URL=https://app.sensus.local WEB_ORIGIN=https://app.sensus.local \
NEXT_PUBLIC_API_URL=https://api.sensus.local/trpc \
NEXT_PUBLIC_AUTH_URL=https://app.sensus.local \
docker compose -f docker-compose.prod.yml up
```

Hosts suggestion for local domain test:

```text
127.0.0.1 app.sensus.local api.sensus.local
```

---

## Next execution plan

1. Verify `docker-compose.prod.yml` startup and watch for crash loops.
2. Start Tier 3.C email notifications:
   - add `packages/email`
   - React Email templates for creator notice + respondent thank-you
   - Resend transport with logger fallback when API key missing
   - wire fire-and-forget sends from response submission
   - unit test mock-mode behavior
3. Re-run 4-gate (`lint`, `check-types`, `test`, `build`) and refresh docs if terms changed.
