---
description: Write comprehensive API route tests
---

# Write API Tests Workflow

Write comprehensive API route tests for: $ARGUMENTS

This is a focused test-writing session for API route handlers. Cover every HTTP verb and every meaningful response branch.

## Step 1 — Read the routes

Read all route files for the given resource:
- `app/api/<resource>/route.ts` (GET list, POST create)
- `app/api/<resource>/[id]/route.ts` (PATCH update, DELETE delete)
- If sub-resources exist (e.g. `[id]/payments/`), read those too

Also read `lib/schemas.ts` to find the Zod schema for this resource.

## Step 2 — Set up the test file

Create `app/api/<resource>/route.test.ts` (or extend it if it exists).

Standard mock setup — use exactly this pattern:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// withAuth pass-through lets us test handlers directly
vi.mock("@/lib/auth", () => ({
  getAuthorisedSettings: vi.fn(),
  assertOwnership: vi.fn(),
  withAuth: (handler: Function) => handler,
  AuthError: class AuthError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
      this.name = "AuthError";
    }
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    <modelName>: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { GET, POST } from "@/app/api/<resource>/route";
import { PATCH, DELETE } from "@/app/api/<resource>/[id]/route";
import { getAuthorisedSettings, assertOwnership, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = vi.mocked(getAuthorisedSettings);
const mockAssertOwnership = vi.mocked(assertOwnership);

function makeRequest(body?: unknown, method = "POST"): Request {
  return new Request("http://localhost/api/resource", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}
```

## Step 3 — Write tests for each verb

### GET (list)
```typescript
describe("GET /api/<resource>", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ settingsId: "settings-1", role: "OWNER" });
  });

  it("returns items for authenticated user", async () => { /* ... */ });
  it("returns empty array when no items exist", async () => { /* ... */ });
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockRejectedValue(new AuthError(401, "Not authenticated"));
    // withAuth is bypassed in tests — test the AuthError handling directly
  });
  it("returns 500 when database throws", async () => { /* ... */ });
});
```

### POST (create)
```typescript
describe("POST /api/<resource>", () => {
  it("creates item and returns 201", async () => { /* ... */ });
  it("returns 400 for missing required fields", async () => { /* ... */ });
  it("returns 400 for invalid field types", async () => { /* ... */ });
  it("returns 401 when not authenticated", async () => { /* ... */ });
  it("returns 500 when database throws", async () => { /* ... */ });
});
```

### PATCH (update)
```typescript
describe("PATCH /api/<resource>/[id]", () => {
  it("updates item and returns 200", async () => { /* ... */ });
  it("returns 404 when item not found", async () => { /* ... */ });
  it("returns 403 when item belongs to different user", async () => {
    mockAssertOwnership.mockImplementation(() => {
      throw new AuthError(403, "Resource does not belong to your account");
    });
    // ...
  });
  it("returns 400 for invalid fields", async () => { /* ... */ });
  it("returns 401 when not authenticated", async () => { /* ... */ });
});
```

### DELETE
```typescript
describe("DELETE /api/<resource>/[id]", () => {
  it("deletes item and returns success", async () => { /* ... */ });
  it("returns 404 when item not found", async () => { /* ... */ });
  it("returns 403 when item belongs to different user", async () => { /* ... */ });
  it("returns 401 when not authenticated", async () => { /* ... */ });
});
```

## Step 4 — Run and iterate

// turbo
```bash
npm test -- app/api/<resource>/route.test.ts
```

Fix failures, re-run. Do not finish until all tests pass.

## Step 5 — Type check

// turbo
```bash
npm run check:types
```

Fix any TypeScript errors in the test file.

## Step 6 — Summary

Report: total tests written, verbs covered, any edge cases deliberately skipped and why.
