Review the file or feature for convention compliance: $ARGUMENTS

This is a structured code review against the project's architectural conventions. Output a clear pass/fail report.

## Step 1 — Run automated sensors

Run in parallel:
```bash
node scripts/check-arch.mjs <file>
npx tsc --noEmit 2>&1 | grep -A2 "<filename>"
```

Report all violations from both commands before proceeding.

## Step 2 — Detect topology and read the file

Read the file. Determine which topology it belongs to (see Service Topologies in CLAUDE.md), then apply the relevant checklist.

---

### Checklist: API Route (`app/api/**/route.ts`)

- [ ] Uses `withAuth` wrapper on every exported handler
- [ ] Calls `getAuthorisedSettings("WRITE")` for POST/PATCH/DELETE, `getAuthorisedSettings()` (READ) for GET
- [ ] Calls `assertOwnership` in all `[id]` mutation routes before any Prisma mutation
- [ ] Zod schema imported from `lib/schemas.ts` — not defined inline
- [ ] `params` awaited as a Promise: `const { id } = await params`
- [ ] Returns `Response.json(...)` (not `NextResponse.json`)
- [ ] Has a `try/catch` in every handler body
- [ ] No `any` types

---

### Checklist: Client Component (`app/(dashboard)/`)

- [ ] Has `"use client"` directive at top
- [ ] All query keys use `queryKeys.*` from `lib/queryKeys.ts` — no inline strings
- [ ] `invalidateQueries` called on every mutation `onSuccess`
- [ ] No monetary arithmetic (display only — no `+`, `-`, `*`, `/` on monetary values)
- [ ] Imports types from shared schema (`lib/schemas.ts`) or Prisma types — not re-declared locally

---

### Checklist: Domain Library Function (`lib/*.ts`)

- [ ] All monetary parameters typed as `Decimal`
- [ ] All monetary return values typed as `Decimal`
- [ ] No `+`, `-`, `*`, `/` operators on monetary values — uses `.plus()`, `.minus()`, `.times()`, `.div()`
- [ ] Function is pure — no Prisma calls, no fetch, no side effects
- [ ] Has corresponding test in `lib/*.test.ts`

---

### Checklist: Email Template (`emails/`)

- [ ] All styles are inline `React.CSSProperties` objects — no Tailwind classes
- [ ] Sends via `lib/email.ts` — no direct Resend instantiation
- [ ] Lives in `emails/` directory — not in `app/` or `components/`

---

## Step 3 — Output structured report

Format the output as:

```
## Review: <filename>

### Automated checks
✓ tsc: no errors
✗ arch: 2 violations (see above)

### Manual checklist — <topology>
✓ Uses withAuth
✓ assertOwnership called
✗ Inline Zod schema — move 'paymentSchema' to lib/schemas.ts
✓ params awaited correctly
...

### Summary
X issue(s) found. Y require immediate action, Z are suggestions.

### Required fixes
1. Move 'paymentSchema' to lib/schemas.ts (arch convention)
2. ...
```

Be specific: for each failure, include the line number and the exact change needed.
