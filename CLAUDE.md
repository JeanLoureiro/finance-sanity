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
npm run check          # Full pre-commit check: tsc + lint + arch fitness + tests
npm run check:types    # TypeScript type check only
npm run check:lint     # ESLint only (zero warnings)
npm run check:arch     # Architecture fitness only (decimal.js, schemas, queryKeys)
npm run test:e2e       # Run Playwright E2E tests
npm run test:e2e:ui    # Playwright UI mode
npm run test:e2e:headed # Run E2E tests in headed browser
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
| Drag-and-drop | `@dnd-kit` (customizable widget grid) |
| Testing | Vitest 4 (Node env, no jsdom) |

### Folder structure

```
app/
  (dashboard)/         # Route group — all authenticated pages share layout.tsx
    dashboard/         # Main dashboard (aggregated net worth + chart)
      widgets/         # Reusable dashboard widget components
    cash/ stocks/ etfs/ crypto/ managed-funds/
    dividends/ budget/ loans/ property/ super/
    side-income/ other-assets/ capital-gains/ fire/ import/ settings/
    design-system/         # Sanctum design system showcase (tokens, components, patterns)
  api/                 # 53 route handlers — one folder per domain
  layout.tsx           # Root layout — mounts <Providers> (QueryClient, ThemeProvider)
  page.tsx             # Landing page
components/
  DashboardShell.tsx   # Sidebar + mobile nav wrapper
  Providers.tsx        # Client boundary for React Query + next-themes
  ui/                  # Shadcn UI primitives
  landing/             # Public landing page components
    BrandLogoMark.tsx  # SVG logo mark used across public + auth pages (xs/sm/md sizes)
    FeatureCard.tsx    # Feature grid card with teal accent icon
    LandingNav.tsx     # Fixed nav with scroll-aware teal/surface styling
lib/
  prisma.ts            # Prisma client singleton
  supabase/            # browser (client.ts) and server (server.ts) clients
  queryKeys.ts         # Centralised TanStack Query key factory
  schemas.ts           # All Zod schemas (single source of truth for validation)
  dashboardWidgets.ts  # Dashboard widget registry, layout management, grid geometry
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
- `lib/dashboardWidgets.ts` defines the widget registry, grid geometry, and layout logic — all widget metadata, sizing, and reconciliation must come from here.
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

### Working principles

**Think before coding.**
State your assumptions out loud. If the request is ambiguous, ask. If a simpler approach exists, push back. Stop when you are confused, name what is unclear, do not just pick one interpretation and run.

**Simplicity first.**
Write the minimum code that solves the problem. No speculative abstractions. No flexibility nobody asked for. The test: would a senior engineer call this overcomplicated.

**Surgical changes.**
Touch only what the task requires. Do not improve neighboring code. Do not refactor what is not broken. Every changed line should trace back to the request.

**Goal-driven execution.**
Turn vague instructions into verifiable targets before writing a line. "Add validation" becomes "write tests for invalid inputs, then make them pass."

---

## Service Topologies

This project has four recurring code shapes. When creating or modifying code, match the topology exactly. The architecture sensor (`npm run check:arch`) enforces these conventions automatically.

---

### Topology 1: CRUD API Route

Two files per resource: `app/api/{resource}/route.ts` (list + create) and `app/api/{resource}/[id]/route.ts` (update + delete).

**`app/api/{resource}/route.ts`**
```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resourceSchema } from "@/lib/schemas";           // always from lib/schemas.ts
import { getAuthorisedSettings, withAuth } from "@/lib/auth";

export const GET = withAuth(async () => {
  try {
    const { settingsId } = await getAuthorisedSettings();
    const items = await prisma.resourceModel.findMany({
      where: { settingsId },
      orderBy: { createdAt: "asc" },
    });
    return Response.json(items);
  } catch {
    return Response.json({ error: "Failed to load resources" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { settingsId } = await getAuthorisedSettings("WRITE");
    const body = await req.json();
    const parsed = resourceSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const item = await prisma.resourceModel.create({
      data: { ...parsed.data, settingsId },
    });
    return Response.json(item, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create resource" }, { status: 500 });
  }
});
```

**`app/api/{resource}/[id]/route.ts`**
```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { resourceSchema } from "@/lib/schemas";
import { getAuthorisedSettings, assertOwnership, withAuth } from "@/lib/auth";

export const PATCH = withAuth(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }   // params is a Promise in Next.js 16
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const existing = await prisma.resourceModel.findUnique({ where: { id }, select: { settingsId: true } });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(existing.settingsId, authorisedSettings);
    const body = await req.json();
    const parsed = resourceSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const item = await prisma.resourceModel.update({ where: { id }, data: parsed.data });
    return Response.json(item);
  } catch {
    return Response.json({ error: "Failed to update resource" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const authorisedSettings = await getAuthorisedSettings("WRITE");
    const existing = await prisma.resourceModel.findUnique({ where: { id }, select: { settingsId: true } });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    assertOwnership(existing.settingsId, authorisedSettings);
    await prisma.resourceModel.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete resource" }, { status: 500 });
  }
});
```

**Rules:**
- Zod schema in `lib/schemas.ts` — never defined inline in the route file
- Always use `withAuth` wrapper — never handle `AuthError` manually in route bodies
- Always call `assertOwnership` in `[id]` routes before any mutation
- `params` is a `Promise` in Next.js 16 — always `await params`
- `getAuthorisedSettings()` defaults to `"READ"` — pass `"WRITE"` for mutations

---

### Topology 2: React Query Client Component

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";              // always from lib/queryKeys.ts

type ResourceItem = { id: string; /* fields */ };

export default function ResourceClient() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<ResourceItem[]>({
    queryKey: queryKeys.resources.all(),                  // never inline strings
    queryFn: () => fetch("/api/resources").then((response) => response.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<ResourceItem, "id">) =>
      fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((response) => response.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resources.all() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: ResourceItem) =>
      fetch(`/api/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((response) => response.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resources.all() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/resources/${id}`, { method: "DELETE" }).then((response) => response.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resources.all() });
    },
  });

  // render using items, createMutation, updateMutation, deleteMutation
}
```

**Rules:**
- Add new query key factory functions to `lib/queryKeys.ts` before using them here
- Never write `queryKey: ["some-string"]` inline — always `queryKeys.something()`
- Do not perform monetary arithmetic in client components — push that to API routes or `lib/`
- Monetary API responses arrive as `number` (JSON) — format for display only, never compute with them

---

### Topology 3: Domain Library Function

```typescript
import Decimal from "decimal.js";                         // required for all monetary math

/**
 * [Brief description of what this function computes.]
 */
export function computeSomething(amount: Decimal, rate: Decimal): Decimal {
  // All intermediate values stay as Decimal
  const factor = new Decimal(1).plus(rate);
  return amount.times(factor);
}
```

**Rules:**
- All monetary parameters and return values must use `Decimal` from `decimal.js`
- Never use `+`, `-`, `*`, `/` on monetary values — use `.plus()`, `.minus()`, `.times()`, `.div()`
- Functions must be pure (no Prisma calls, no fetch) and testable in isolation
- Every new function in `lib/` must have a corresponding test in `lib/*.test.ts`
- Non-monetary helpers (dates, string formatting) may use plain JS primitives

---

### Topology 4: Email Template

```typescript
import {
  Body, Container, Head, Html, Preview, Section, Text
} from "@react-email/components";

interface ResourceEmailProps {
  // typed props — no `any`
}

export default function ResourceEmail({ ...props }: ResourceEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Preview text shown in email client inbox</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section>
            <Text style={headingStyle}>Heading</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const containerStyle: React.CSSProperties = { maxWidth: "600px", margin: "0 auto", padding: "20px" };
const headingStyle: React.CSSProperties = { fontSize: "24px", fontWeight: "bold" };
```

**Rules:**
- Styles are inline `React.CSSProperties` objects — no Tailwind classes (email clients strip stylesheets)
- Email components live in `emails/` — never in `app/` or `components/`
- Send via `lib/email.ts` which wraps Resend — do not instantiate Resend directly in routes or components
- Preview with `npm run email:dev` at localhost:3001
