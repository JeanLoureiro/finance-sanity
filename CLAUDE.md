# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

---

## Commands

All commands run from `webapp/`:

```bash
npm run dev            # Start dev server on :3000
npm run build          # prisma generate → next build
npm run lint           # ESLint (flat config, Next.js core-web-vitals + TS)
npm test               # Run all tests once (Vitest)
npm run test:watch     # Vitest in watch mode
npm run test:coverage  # Vitest with v8 coverage
```

**Run a single test file:**
```bash
npm test -- lib/finance.test.ts
```

**After schema changes:**
```bash
npx prisma migrate dev   # Apply migration + regenerate client
npx prisma generate      # Regenerate client only (no migration)
```

---

## Architecture

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript 5 (strict) |
| Database | Supabase PostgreSQL via Prisma 7 |
| Auth | Supabase SSR (`@supabase/ssr`) |
| Server state | TanStack React Query 5 |
| Validation | Zod 4 + React Hook Form 7 |
| Styling | Tailwind CSS 4 + Shadcn UI (base-nova) |
| Charts | Recharts 3 |
| Finance math | `decimal.js` (monetary precision), `yahoo-finance2` (prices) |
| Testing | Vitest 4 (Node env, no jsdom) |

### Folder structure

```
app/
  (dashboard)/         # Route group — all authenticated pages share layout.tsx
    net-worth/         # Main dashboard (aggregated net worth + chart)
    cash/ stocks/ etfs/ crypto/ managed-funds/
    dividends/ budget/ loans/ property/ super/
    side-income/ other-assets/ capital-gains/ fire/ import/ settings/
  api/                 # 53 route handlers — one folder per domain
  layout.tsx           # Root layout — mounts <Providers> (QueryClient, ThemeProvider)
  page.tsx             # Redirects to /net-worth
components/
  DashboardShell.tsx   # Sidebar + mobile nav wrapper
  Providers.tsx        # Client boundary for React Query + next-themes
  ui/                  # Shadcn UI primitives
lib/
  prisma.ts            # Prisma client singleton
  supabase/            # browser (client.ts) and server (server.ts) clients
  queryKeys.ts         # Centralised TanStack Query key factory
  schemas.ts           # All Zod schemas (single source of truth for validation)
  finance.ts           # Financial functions: PMT, PV, FV, NPER, cumipmt, etc.
  capitalGains.ts      # FIFO CGT engine (Australian tax law)
  australianFY.ts      # Australian fiscal year helpers
  currency.ts          # AUD formatting helpers
prisma/
  schema.prisma        # 20+ models — all monetary fields use Decimal(20,6)
  migrations/          # Applied migration files
```

### Data flow

1. **Pages** under `(dashboard)/` are Server Components by default. They fetch initial data server-side via direct Prisma/Supabase calls, or they render a client component that owns the query.
2. **Client components** (`"use client"`) use `useQuery` / `useMutation` from React Query. Query keys come from `lib/queryKeys.ts`.
3. **API routes** (`app/api/**/route.ts`) are the mutation targets. Each resource follows the pattern:
   - `GET /api/{resource}` — list
   - `POST /api/{resource}` — create
   - `PATCH /api/{resource}/[id]` — update
   - `DELETE /api/{resource}/[id]` — delete
   - Nested purchases: `…/[id]/purchases/[purchaseId]`
4. **Validation** happens on both client (React Hook Form + Zod resolver) and server (API route parses the same Zod schema from `lib/schemas.ts`).
5. **Auth** is handled by Supabase SSR middleware; `lib/supabase/server.ts` provides the session-aware client inside Server Components and API routes.

### Key conventions

- **Do NOT create `middleware.ts`** — this project uses `proxy.ts` as the edge middleware entry point. Adding `middleware.ts` is wrong; all middleware logic lives in `proxy.ts`. To make a path public (accessible without auth), add it to `PUBLIC_PREFIXES` in `proxy.ts`.
- `lib/queryKeys.ts` is the single place to define React Query keys — always use it, never inline string keys.
- `lib/schemas.ts` is the single place for Zod schemas — share between client validation and API route parsing.
- All monetary values use `decimal.js` for arithmetic; never use plain JS floats for finance.
- `yahoo-finance2` is declared as `serverExternalPackages` in `next.config.ts` — it must only be called from Server Components or API routes.
- The Prisma client is generated to `app/generated/prisma/` (gitignored) — always run `prisma generate` after pulling schema changes.
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` for the client; `DATABASE_URL` (pooled, port 6543) + `DIRECT_URL` (direct, port 5432) for Prisma.

### Testing scope

Tests live in `lib/**/*.test.ts` and run in a Node (non-browser) environment. Coverage is currently focused on the pure financial logic in `lib/finance.ts` and `lib/capitalGains.ts`. UI components are not tested.

---

## Code Quality Rules

- Apply SOLID principles in all code.
- Apply DRY principles — avoid duplicating logic or data.
- Apply KISS principles — prefer the simplest solution that works.
- Never abbreviate variable or parameter names; use full, human-readable names. For example: `properties.map(property => property.name)` not `properties.map(p => p.name)`.
- Keep tests up to date whenever code changes affect them.
- When you notice a potential improvement in code that is unrelated to the requested changes, point it out to the user rather than silently applying it.
