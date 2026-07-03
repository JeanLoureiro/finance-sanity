# Project: Financial Sanity

**Financial Sanity** is a personal finance tracking web app built for Australian investors. It provides a unified view of net worth across 9+ asset classes, Australian tax tooling (FIFO CGT with the 50% discount, organised by financial year), and FIRE (Financial Independence, Retire Early) planning with year-by-year projections.

## Stack

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
| Finance math | `decimal.js` (monetary precision), `yahoo-finance2` (live prices) |
| Email | Resend via `@react-email/components` |
| Testing | Vitest 4 (Node env, no jsdom) + Playwright (E2E) |

## Repository layout

```
webapp/                        # All commands run from here
├── app/
│   ├── (dashboard)/           # Route group — authenticated pages, shared layout.tsx
│   │   ├── dashboard/         # Net worth summary + historical chart
│   │   ├── cash/ stocks/ etfs/ crypto/ managed-funds/
│   │   ├── property/ super/ loans/ budget/
│   │   ├── dividends/ side-income/ other-assets/
│   │   ├── capital-gains/     # FIFO CGT engine output by AU financial year
│   │   ├── fire/              # FIRE projection planner
│   │   ├── import/            # CSV bulk-import
│   │   └── settings/          # User + account settings
│   ├── api/                   # ~53 route handlers, one folder per domain
│   ├── layout.tsx             # Root layout — mounts <Providers>
│   └── page.tsx               # Public landing page
├── components/
│   ├── DashboardShell.tsx     # Sidebar + mobile nav wrapper
│   ├── Providers.tsx          # Client boundary (React Query + next-themes)
│   └── ui/                    # Shadcn UI primitives
├── lib/
│   ├── prisma.ts              # Prisma client singleton
│   ├── supabase/              # client.ts (browser) + server.ts (SSR)
│   ├── auth.ts                # withAuth wrapper, getAuthorisedSettings, assertOwnership
│   ├── queryKeys.ts           # Centralised React Query key factory (single source of truth)
│   ├── schemas.ts             # All Zod schemas (shared between client and API routes)
│   ├── finance.ts             # Pure finance functions: PMT, PV, FV, NPER, cumipmt, …
│   ├── capitalGains.ts        # FIFO CGT engine (Australian tax law)
│   ├── australianFY.ts        # AU fiscal year helpers
│   └── currency.ts            # AUD formatting helpers
├── emails/                    # React Email templates (sent via Resend)
├── prisma/
│   ├── schema.prisma          # 20+ models; all monetary fields use Decimal(20,6)
│   └── migrations/
├── proxy.ts                   # Edge middleware entry point (NOT middleware.ts)
└── CLAUDE.md                  # Full coding conventions, topologies, and quality rules

```

---

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
