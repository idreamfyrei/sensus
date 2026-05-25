# Glossary — Sensus

This file is a **glossary**, not a spec. It defines the canonical terms used
across this codebase. Implementation details, ADRs, and design decisions live
elsewhere (see the plan file).

If a term you want to use is missing here, add it before you write code that
references it. If a term here conflicts with what you mean, the term wins —
rename the code, not the glossary.

---

## Identity & people

- **User** — a row in the `users` table. Has our UUID primary key and a
  `clerkUserId` unique text column. A `User` is created lazily by the api on
  the first authenticated request from a given Clerk identity. Hard-deleted
  via the Clerk `user.deleted` webhook.
- **Creator** — a `User` viewed in their authoring role (they own forms).
  Same row as User; no separate table.
- **Respondent** — anyone filling a form. Never authenticated. The
  `/f/[slug]` route does not read a Clerk session, in any distribution mode.
  Identity, when any is needed, comes from the form's distribution mode
  (token, password, or none).

## Forms

- **Form** — top-level authored entity owned by exactly one `User` (no teams
  or orgs). Soft-deletable.
- **Form layout** — per-form setting on every form. Two values:
  `one_per_screen` (Typeform-style) or `single_page` (Google-Forms-style).
- **Screen** — one rendered view shown to a respondent at one time.
  Emerges from the layout: in `one_per_screen`, each field is its own
  screen; in `single_page`, the whole form (or one page chunk) is a screen.
- **Section** — a row in `form_sections`. A grouping of fields with a
  title and description. Carries two flags whose meaning is
  layout-dependent: `pageBreakBefore` (effective only in `single_page` —
  creates Next/Back pagination); `showIntroScreen` (effective only in
  `one_per_screen` — inserts a section-intro screen before its first field).
- **Page** — a hard break in `single_page` layout. _Not_ a separate table —
  pages emerge wherever a section has `pageBreakBefore=true`.
- **Field** — a row in `form_fields`. A single question/input belonging to
  a section.
- **Field type** — one of: `short_text`, `long_text`, `email`, `number`,
  `single_select`, `multi_select`, `checkbox`, `dropdown`, `rating`, `date`.
- **Condition** — a row in `field_conditions`. A trigger
  `(sourceField, operator, value)` plus an action ∈ `{show, hide, require,
jump_to}`. `jump_to` targets either a field or a section. Evaluated
  reactively on the client and re-validated on the server at submit.
- **Slug** — the global-unique URL handle for a form. Generated as
  `${kebab(title)}-${6-char-random}`. Mutable only while
  `status = draft`. Frozen on first publish. To rename a published form,
  clone it.

## Distribution & visibility

- **Visibility** — one of `public`, `unlisted`, `invite_only`. Carried on
  the form row. Defines where it appears and who can submit.
- **Public form** — `visibility = public`. Listed in `/explore`,
  `/templates` (if `isTemplate=true`), featured sections.
- **Unlisted form** — `visibility = unlisted`. Hidden from `/explore` and
  galleries. Reachable only via direct link.
- **Invite-only form** — `visibility = invite_only`. Reachable only via
  `/f/[slug]?invite=<token>`. Anonymous submission gated by a valid unused
  token. The token _is_ the identity.
- **Password gate** — orthogonal to visibility. A form may also set
  `passwordHash`; respondents must enter the password before seeing the
  fields. No login required.
- **QR share** — a graphical encoding of the public `/f/[slug]` URL. Inherits
  the form's visibility rules; no special access semantics.

## Invitations

- **Invite** — a row in `form_invites`. Single-use token tied to an email
  address and to one form. Validity follows the form's expiry and response
  limit; submission marks the invite `submitted` and the token is dead.
- **Invite batch** — a row in `invite_batches`. Represents one Excel upload
  by the creator. The raw Excel file's Cloudinary URL is retained for audit
  / resend.

## Lifecycle states

- **Status** — `draft | published | unpublished | archived`. Lives on
  `forms.status`. Drives whether the form accepts responses and where it
  surfaces.
- **Archive** — `status = 'archived'`. A _reversible_ pause. Form vanishes
  from the main dashboard and from explore; pending invites are
  invalidated; analytics and responses remain readable by the owner.
  Unarchive restores to `draft`.
- **Delete** — soft delete via `forms.deletedAt = now()`. The form
  disappears from _every_ creator view (including the Archived tab). All
  child rows (fields, sections, conditions, options, responses, answers,
  invites, batches, views, drafts) are **preserved**, not cascaded. There
  is no Undelete in the UI; only a future admin/purge tool can hard-delete.
- **Edit-after-publish rule** — once `status = published` (or any response
  exists), the form's schema is locked: existing field type/label/options/
  validation, conditions referencing them, and section structure cannot
  change. Metadata (title, description, theme, logo/cover, password,
  expiry, max responses, visibility, isTemplate) remains mutable. New
  _optional_ fields/sections may be appended. To break-change the schema,
  clone the form.

## Building, previewing, and templates

- **Builder** — the creator's form-editor canvas. A single
  inline-stacked doc editor (Tally pattern). One builder serves both
  layouts (`one_per_screen` and `single_page`); layout is a render setting,
  not a builder mode.
- **Builder save** — every change auto-saves via a 500 ms debounced tRPC
  mutation. UI is optimistic; failures roll back with a toast. Each
  successful write bumps `forms.version`; a mismatch detected in another
  tab triggers a "edited elsewhere" warning.
- **Preview** — the protected `/dashboard/forms/[id]/preview` route.
  Renders the form via the same `<FormRenderer>` used by `/f/[slug]` but
  with a `previewMode` flag that bypasses all visibility / status / expiry
  / limit / password guards and disables submit. No tokens, no public
  exposure.
- **Template** — any form with `isTemplate = true`. Owner-flagged (only
  while `visibility = public`); visible at `/templates`. Cloning a
  template ("Use template") produces a new form owned by the calling
  creator with a regenerated slug, `status = draft`, `isTemplate = false`;
  fields/sections/conditions/options/themeId are copied; responses,
  invites and analytics are not.

## Responses

- **Response** — a row in `responses`, one per successful form submission.
- **Answer** — a row in `response_answers`, one per (response, field).
- **View** — a row in `form_views`, recorded the first time `/f/[slug]`
  loads successfully for a given visit.
- **Draft** (respondent) — partial answers persisted between page
  refreshes. For invite-only forms: server-side via the `response_drafts`
  table, keyed by `inviteId`. For public/unlisted/password: browser
  `localStorage`, keyed by `formId + version`. In all cases, the draft is
  deleted on submit and on form hard-delete; there is no scheduler.
- **Progress indicator** — the respondent-visible position cue. Always
  shown except in `single_page` layout without page breaks
  (`one_per_screen` → "Question X of Y" + bar; `single_page` with page
  breaks → "Page X of Y").
- **Public-form states** — the typed union returned by
  `publicForm.getBySlug`. `ready | password_required | not_found |
unpublished | archived | expired | limit_reached | invite_required |
invite_used | invite_invalid`. Each is rendered by a themed
  `<UnavailableState>` variant; none of these are exceptions, they are
  product states.
- **Duplicate policy** — public/unlisted/password forms accept unlimited
  submissions by default. Per-form `oneResponsePerEmail` opt-in flag is
  effective only when the form has an `email` field; comparison is
  lowercased and trimmed. Invite-only forms are naturally one-per-token.

## Themes & assets

- **Theme** — a row in the `themes` table. One of 10 curated aesthetic
  presets: `pixel`, `glitch`, `terminal`, `brutalist`, `glassmorphism`,
  `bauhaus`, `museum`, `vaporwave`, `nature_minimal`, `anime`. Each
  carries a design-token set (palette, fonts, radii, borders) plus an
  `effects` JSONB (scanlines, glow, blur, grain, halftone flags).
- **Theme scope** — themes are painted **page-wide on `/f/[slug]` only**.
  Dashboard, builder, marketing pages, and admin all use a fixed neutral
  chrome.
- **Brand assets** — optional per-form `logoUrl` and `coverImageUrl`
  pointing at Cloudinary. Client-compressed before upload (target ≤ 1 MB
  / longest side 1920 px); MIME ∈ {png, jpg, webp, svg}; size ≤ 5 MB
  pre-compression. Cloudinary stores the _compressed_ file.

## Infrastructure-shaped vocabulary

- **Rate limit** — sliding-window enforcement on the public submit
  endpoint via Upstash Redis. Two keys: per-form-per-IP (5/min) and
  global-per-IP (30/min). IPs are SHA-256-hashed with a salt. A filled
  honeypot returns a silent 200 without recording a response. If Upstash
  is unreachable, the api fails _open_ with a warning log.
- **Stateless api** — every `apps/api` instance holds no mutable state in
  memory. Sessions, rate-limit counters, caches, and tokens all live in
  Postgres or Upstash. Multiple api instances behind a load balancer must
  behave identically.
- **Resend setup** — production email sender uses a verified domain
  (DKIM CNAME + SPF TXT + DMARC TXT in DNS). The `From` address is
  `noreply@<domain>`. Templates are React Email components.

## Out-of-scope terms (mentioned but explicitly not modeled)

- **Admin / role / admin dashboard** — there is no admin role and no admin
  surface. All users are equal. The `demo-admin-creator` seed account
  is a regular user that happens to own the curated templates.
- **File-upload field** — not a field type in Sensus. Cloudinary is used
  only for Excel invite files and brand assets.
- **Organization / team** — does not exist. Forms have a single owner.
- **Session table** — does not exist. Clerk owns sessions.
