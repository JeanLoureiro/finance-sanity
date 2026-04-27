---
description: Scaffold a complete new feature for this project
---

# New Feature Workflow

Scaffold a complete new feature: $ARGUMENTS

## Step 1 — Clarify requirements

Ask the user:
1. **Topology**: CRUD resource / sub-resource (nested under an existing model) / standalone API endpoint / pure lib function?
2. **Prisma model**: What fields does it need? What relations? (Ask for names and types, or let the user describe the domain)
3. **Access pattern**: Does it need shared-access support (settingsId relation to UserSettings)?

Do not proceed past this step until you have clear answers.

## Step 2 — Plan the full file set

For a **CRUD resource**, the complete file set is:
1. `prisma/schema.prisma` — new model + relation on UserSettings
2. `lib/schemas.ts` — Zod schema(s) for the resource
3. `app/api/<resource>/route.ts` — GET list + POST create
4. `app/api/<resource>/[id]/route.ts` — PATCH update + DELETE delete
5. `lib/queryKeys.ts` — new key factory
6. `app/(dashboard)/<resource>/<Resource>Client.tsx` — client component
7. `app/(dashboard)/<resource>/page.tsx` — server component page
8. `components/DashboardShell.tsx` — add nav entry

State the full file list to the user before starting.

## Step 3 — Prisma schema

Add the new model to `prisma/schema.prisma`. All monetary fields use `Decimal @db.Decimal(20, 6)`. All models need a relation back to `UserSettings` via `settingsId`.

Read `prisma/schema.prisma` first to understand existing model patterns and relation syntax.

After editing `schema.prisma`, run:
// turbo
```bash
npx prisma migrate dev --name add-<feature-name>
```

This applies the migration and regenerates the Prisma client.

## Step 4 — Zod schema

Add to `lib/schemas.ts` (read it first to follow existing patterns). Export both the schema and its inferred type:

```typescript
export const resourceSchema = z.object({
  name: z.string().min(1),
  // ... fields
});
export type ResourceInput = z.infer<typeof resourceSchema>;
```

## Step 5 — API routes

Create `app/api/<resource>/route.ts` and `app/api/<resource>/[id]/route.ts` using **Topology 1** from the Service Topologies section in CLAUDE.md.

Use the Zod schema you just created. Use `prisma.<ModelName>` (camelCase of the Prisma model name).

## Step 6 — Query key

Add to `lib/queryKeys.ts`:
```typescript
<resource>: {
  all: () => ["<resource>"] as const,
  detail: (id: string) => ["<resource>", id] as const,
},
```

## Step 7 — Client component

Create `app/(dashboard)/<resource>/<Resource>Client.tsx` using **Topology 2** from the Service Topologies section in CLAUDE.md.

Use `queryKeys.<resource>.all()` for the list query. Wire all three mutations (create, update, delete) with proper `invalidateQueries` on success.

Use Shadcn UI components (`components/ui/`) for the form and table. Read existing client components (e.g. `app/(dashboard)/loans/LoansClient.tsx`) for UI patterns.

## Step 8 — Page

Create `app/(dashboard)/<resource>/page.tsx`:
```typescript
import { ResourceClient } from "./<Resource>Client";

export default function ResourcePage() {
  return <ResourceClient />;
}
```

## Step 9 — Navigation

Read `components/DashboardShell.tsx` to understand the nav item structure, then add an entry for the new resource in the correct section.

## Step 10 — Validate

Run:
// turbo
```bash
npm run check
```

Fix any failures. Do not finish until `npm run check` passes cleanly.

## Step 11 — Write tests

Run the `/write-api-tests` command on the new API route:
> /write-api-tests app/api/<resource>/route.ts

## Step 12 — Summary

Report: all files created/modified, the migration name applied, and the route where the new feature is accessible.
