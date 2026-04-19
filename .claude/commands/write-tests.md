Write comprehensive Vitest tests for the file at: $ARGUMENTS

## Step 1 — Understand the target

Run these in parallel:
- Read the target file in full
- Check if a test file already exists (look for `lib/<name>.test.ts` or nearby `__tests__/`)
- Run `npm test 2>&1 | tail -20` to see current test state

## Step 2 — Detect topology and plan coverage

Determine which topology the file belongs to:

**`lib/*.ts` (pure domain function)**
Cover:
- Happy path for each exported function
- Edge cases: zero values, negative values, Decimal precision boundaries
- Error cases: invalid inputs, division by zero
- Boundary values: min/max inputs

**`app/api/**/route.ts` (API route handler)**
Cover for each HTTP verb (GET, POST, PATCH, DELETE):
- 200/201: successful response with correct shape
- 400: validation failure (missing required fields, wrong types)
- 401: no authenticated session
- 403: authenticated but wrong ownership
- 404: resource not found (for [id] routes)
- 500: Prisma throws unexpectedly

## Step 3 — Write the tests

### For `lib/*.ts` tests

Place test file at `lib/<name>.test.ts`. Follow the pattern in `lib/capitalGains.test.ts` and `lib/finance.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import { functionUnderTest } from "./moduleName";

describe("functionUnderTest", () => {
  it("returns correct result for standard input", () => {
    const result = functionUnderTest(new Decimal("100"), new Decimal("0.05"));
    expect(result.toFixed(2)).toBe("105.00");
  });

  it("handles zero input", () => {
    const result = functionUnderTest(new Decimal("0"), new Decimal("0.05"));
    expect(result.toFixed(2)).toBe("0.00");
  });
});
```

Rules:
- Use `Decimal` for all monetary expected values — never raw JS number comparisons
- Use `.toFixed(N)` or `.toString()` for Decimal equality checks, not `.toEqual(new Decimal(...))`
- No mocks needed for pure functions

### For `app/api/**/route.ts` tests

Place test file at `lib/__tests__/<resource>.test.ts` or `app/api/<resource>/route.test.ts`.

Mock strategy:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/resource/route";

// Mock auth
vi.mock("@/lib/auth", () => ({
  getAuthorisedSettings: vi.fn(),
  assertOwnership: vi.fn(),
  withAuth: (handler: Function) => handler,  // pass-through for testing
  AuthError: class AuthError extends Error {
    constructor(public statusCode: number, message: string) { super(message); }
  },
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    resourceModel: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { getAuthorisedSettings } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = vi.mocked(getAuthorisedSettings);
const mockFindMany = vi.mocked(prisma.resourceModel.findMany);

describe("GET /api/resource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ settingsId: "settings-1", role: "OWNER" });
  });

  it("returns list of items for authenticated user", async () => {
    mockFindMany.mockResolvedValue([{ id: "1", settingsId: "settings-1" }]);
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
  });
});
```

## Step 4 — Iterate until green

Run: `npm test -- <testfile>`

If tests fail:
- Read the failure output carefully
- Fix the test (or the implementation if it's a genuine bug)
- Re-run until all pass

## Step 5 — Verify types

Run: `npm run check:types`

Fix any TypeScript errors in the test file before finishing.

## Step 6 — Report

Summarise what was tested and what coverage gaps remain (if any).
