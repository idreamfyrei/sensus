# Sensus

A form builder for people who care how it feels. Pick a mood, ask the right questions, send a link. Sensus turns the form into a small experience, instead of a grey wall of inputs.

> Forms with a feeling. Not just another input. Built so the people who answer have as good a time as the people who ask.

## Table of Contents

1. [Introduction](#introduction)
2. [Demo](#demo)
3. [Tech Stack](#tech-stack)
4. [Features](#features)
5. [What's Done](#whats-done)
6. [Repository Layout](#repository-layout)
7. [What to Look at in Order](#what-to-look-at-in-order)
8. [Architecture](#architecture)
9. [Local Development](#local-development)
   - [Environment Variables](#environment-variables)
   - [Useful Scripts](#useful-scripts)
10. [Future Improvements](#future-improvements)

---

## Introduction

Sensus is a dynamic form builder that focuses on the respondent experience. Creators can build multi-step or single-page forms, apply stunning visual themes (like Glassmorphism, Brutalist, or Glitch), and track responses with real-time analytics.

The deployed project runs on `sensus.saumyagrawal.in`, with the web app served from `app.sensus.saumyagrawal.in` and the API served from `api.sensus.saumyagrawal.in`.

---

## Demo

|                  |                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| **Live app**     | [`https://sensus.saumyagrawal.in`](https://sensus.saumyagrawal.in)                                   |
| **API docs**     | [`https://api.sensus.saumyagrawal.in/docs`](https://api.sensus.saumyagrawal.in/docs)                 |
| **OpenAPI spec** | [`https://api.sensus.saumyagrawal.in/openapi.json`](https://api.sensus.saumyagrawal.in/openapi.json) |

### Demo credentials

These accounts are created by `pnpm db:seed-demo` and own the showcase forms in the dashboard, `/explore`, and `/templates`.

| Role                                    | Email              | Password          |
| --------------------------------------- | ------------------ | ----------------- |
| Studio (owns the showcase forms)        | `demo@sensus.app`  | `SeeSensus!`      |
| Visiting judge (owns one unlisted form) | `judge@sensus.app` | `SeeSensus!`      |
| Local dev account                       | `dev@sensus.local` | `DevPassword123!` |

---

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: Next.js 16 (App Router), Tailwind CSS, shadcn/ui, framer-motion, dnd-kit
- **Backend**: Express 5 + tRPC 11
- **Database**: PostgreSQL 15 + Drizzle ORM
- **Authentication**: Better Auth (Email/Password + Google OAuth)
- **Validation**: Zod + drizzle-zod
- **API Docs**: Scalar (`/docs`)

---

## Features

- **Dynamic Form Builder**: Build forms with 10 different field types (short text, long text, email, number, select, multi-select, checkbox, dropdown, rating, date) complete with validation and required logic.
- **Curated Themes**: Choose from 10 distinct design themes that apply end-to-end styling, including effects like scanlines, grain, and blur.
- **Conditional Logic**: Set up smart rules to show, hide, require, or jump to sections based on user responses.
- **Real-time Analytics**: Watch responses come in live. View charts on completion rates, views, and individual field distributions.
- **Drag & Drop Layouts**: Reorder questions effortlessly. Create multi-page experiences or long-scroll focus modes.
- **Templates**: Clone public templates created by the community directly into your own dashboard to get started instantly.

---

## What's Done

| Area                  | Completed work                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Product experience    | Landing page, dashboard, builder, preview, explore feed, templates, public form renderer, and analytics views are implemented.           |
| Form builder          | Field creation, section management, drag-and-drop ordering, layouts, publishing, preview mode, and respondent submission flow are built. |
| Themes                | Ten curated themes are seeded and applied through the shared renderer so preview and live forms use the same rendering path.             |
| Logic and validation  | Conditional show/hide/require/jump rules, field validation, required states, and server-side submit checks are wired in.                 |
| Data layer            | PostgreSQL schema, Drizzle migrations, soft-delete-aware services, dev seed data, and demo seed data are included.                       |
| Auth and accounts     | Better Auth email/password flow, optional Google OAuth configuration, protected dashboard routes, and demo accounts are available.       |
| API                   | Express, tRPC routers, OpenAPI generation, and Scalar docs are configured.                                                               |
| Email and rate limits | Resend email integration and Upstash-backed rate limiting are supported, with local fallbacks when those services are not configured.    |
| Tests                 | Tests are written across the workspace with Vitest, plus a Playwright e2e path for the web app.                                          |
| Quality gates         | Linting, type-checking, formatting, build scripts, Husky, and CI workflow support are in place.                                          |

---

## Repository Layout

```text
sensus/
├── apps/
│   ├── api/             Express + tRPC backend
│   └── web/             Next.js frontend
├── packages/
│   ├── auth/            Better Auth config
│   ├── database/        Drizzle schema, db client, seeds
│   ├── email/           React Email templates + Resend
│   ├── schemas/         Shared Zod validation schemas
│   ├── services/        Core business logic classes
│   └── trpc/            Server routers and endpoints
└── docker-compose.yml   Local Postgres
```

---

## What to Look at in Order

If you are exploring the codebase or a fresh local setup, follow this path:

1. **Landing Page**: Check out the homepage animations.
2. **Dashboard**: Sign in (e.g. `demo@sensus.app` / `SeeSensus!`). Look at the showcase forms.
3. **Builder**: Open a form in the builder, try dragging fields, and test the Theme picker.
4. **Preview**: Click "Preview" to see the form rendered with the live renderer engine.
5. **Explore Feed**: Visit `/explore` to see the public forms feed.
6. **Analytics**: Go back to the dashboard and view the responses and charts for a form.

---

## Architecture

```mermaid
flowchart LR
    subgraph Browser
        L[Landing /]
        E[/explore + /templates/]
        F[/f/:slug public renderer/]
        D[/dashboard + builder/]
    end

    subgraph "Next.js (apps/web)"
        L --> E --> D
        D -- "useQuery / useMutation" --> RPC
        F -- "publicForm.getBySlug + submit" --> RPC
        AH["/api/auth/[...all] (Better Auth)"]
    end

    RPC[tRPC over HTTP] --> API

    subgraph "Express + tRPC (apps/api)"
        API[serverRouter]
        SCALAR[/docs + /openapi.json/]
        API --> SCALAR
    end

    API -- "Drizzle ORM" --> PG[(Postgres 15)]
    AH -- "sessions, accounts" --> PG
```

---

## Local Development

### Prerequisites

- Node.js 22+ recommended
- pnpm 9+
- Docker (for the PostgreSQL container)

### 1. Initial Setup

```bash
git clone https://github.com/saumyagrawal/sensus.git
cd sensus

cp .env.example .env
# Optional: Generate a secure secret for BETTER_AUTH_SECRET
# openssl rand -base64 32
```

### 2. Environment Variables

The minimum required variables in `.env` for local dev are already set in `.env.example`, but key ones include:

| Variable                   | Local value                                                 | Purpose                                                       |
| -------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| `NODE_ENV`                 | `development`                                               | Runs the apps in development mode.                            |
| `PORT`                     | `8000`                                                      | Port for the Express API.                                     |
| `BASE_URL`                 | `http://localhost:8000`                                     | Base URL used by the API for logs and OpenAPI metadata.       |
| `LOGGER_LEVEL`             | `debug`                                                     | Verbosity for local server logs.                              |
| `WEB_ORIGIN`               | `http://localhost:3000`                                     | Allowed web origin for CORS.                                  |
| `DATABASE_URL`             | `postgresql://postgres:postgres@localhost:5432/sensus`      | Local Postgres connection string.                             |
| `TEST_DATABASE_URL`        | `postgresql://postgres:postgres@localhost:5432/sensus_test` | Separate database used by tests.                              |
| `POSTGRES_USER`            | `postgres`                                                  | Local Docker Postgres user.                                   |
| `POSTGRES_PASSWORD`        | empty by default                                            | Local Docker Postgres password.                               |
| `POSTGRES_DB`              | `sensus`                                                    | Local Docker Postgres database name.                          |
| `NEXT_PUBLIC_API_URL`      | `http://localhost:8000/trpc`                                | tRPC endpoint used by the web app.                            |
| `BETTER_AUTH_SECRET`       | generate locally                                            | Session signing secret. Use `openssl rand -base64 32`.        |
| `BETTER_AUTH_URL`          | `http://localhost:3000`                                     | Auth server origin.                                           |
| `NEXT_PUBLIC_AUTH_URL`     | `http://localhost:3000`                                     | Auth URL exposed to the web app.                              |
| `GOOGLE_CLIENT_ID`         | optional                                                    | Enables Google OAuth when paired with `GOOGLE_CLIENT_SECRET`. |
| `GOOGLE_CLIENT_SECRET`     | optional                                                    | Secret for Google OAuth.                                      |
| `UPSTASH_REDIS_REST_URL`   | optional                                                    | Enables Redis-backed rate limits.                             |
| `UPSTASH_REDIS_REST_TOKEN` | optional                                                    | Token for Upstash Redis.                                      |
| `IP_HASH_SALT`             | `change-me-please`                                          | Salt used when hashing IPs for abuse controls.                |
| `RESEND_API_KEY`           | optional                                                    | Enables real email delivery through Resend.                   |
| `RESEND_FROM`              | `Sensus <noreply@localhost>`                                | Sender identity for email.                                    |
| `CLOUDINARY_URL`           | optional                                                    | Reserved for image/upload integrations.                       |
| `DOMAIN`                   | `localhost`                                                 | Local domain placeholder.                                     |
| `ADMIN_EMAIL`              | `admin@localhost`                                           | Local admin/contact placeholder.                              |

### 3. Install & Start Database

```bash
pnpm install
docker compose up -d
```

### 4. Database Migrations & Seeding

```bash
pnpm db:migrate
pnpm db:seed-dev
pnpm db:seed-demo
```

### 5. Run the Application

```bash
pnpm dev
```

Your app will be live at `http://localhost:3000`.

### Useful Scripts

| Command             | What it does                                                      |
| ------------------- | ----------------------------------------------------------------- |
| `pnpm dev`          | Starts the API and web app in development mode through Turborepo. |
| `pnpm build`        | Builds all apps and packages through Turborepo.                   |
| `pnpm test`         | Runs the Vitest test suites across the workspace.                 |
| `pnpm test:e2e`     | Runs the Playwright e2e suite for the web app.                    |
| `pnpm db:generate`  | Generates a Drizzle migration after model changes.                |
| `pnpm db:migrate`   | Applies Drizzle migrations.                                       |
| `pnpm db:seed-dev`  | Seeds local dev data, including the local dev account and themes. |
| `pnpm db:seed-demo` | Seeds demo accounts, showcase forms, and sample responses/views.  |
| `pnpm db:studio`    | Opens Drizzle Studio on `:4983` for browsing the database.        |
| `pnpm lint`         | Runs ESLint across the workspace.                                 |
| `pnpm format`       | Formats TypeScript, React, and Markdown files with Prettier.      |
| `pnpm check-types`  | Runs TypeScript checks across the workspace.                      |
| `pnpm prepare`      | Installs Husky hooks after dependency installation.               |

---

## Future Improvements

- Implement webhook integrations for form submissions.
- Add more native field types (file upload, matrix scale).
- Introduce a plugin system for custom themes.
- Add advanced logic grouping (AND/OR conditions).
- Export analytics to Google Sheets or Notion directly.

---

Built with care. Use it kindly.
