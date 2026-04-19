# UI Test Agent

Use the Playwright MCP browser tools to interactively verify that a feature
works correctly in the running app, then write a persistent spec file.

## Arguments

`$ARGUMENTS` — describe the feature or page to test (e.g. "landing page",
"budget add item flow", "loan payment panel").

---

## Step 1 — Confirm the dev server is running

Check whether http://localhost:3000 is reachable. If not, instruct the user
to run `npm run dev` and wait before proceeding.

## Step 2 — Explore with the browser

Use browser MCP tools to navigate and observe the feature described in
`$ARGUMENTS`:

1. `browser_navigate` to the relevant URL
2. `browser_screenshot` to capture the initial state
3. Interact with the feature: click buttons, fill forms, navigate flows
4. `browser_screenshot` after each key interaction
5. Note any visual errors, broken links, missing content, or console errors

Summarise findings: what works, what looks broken.

## Step 3 — Check for an existing spec file

Look in `e2e/` for an existing spec that covers this feature.
- If one exists, read it and extend it with new cases.
- If none exists, create `e2e/<feature-name>.spec.ts`.

## Step 4 — Write the spec

Follow these rules:
- Use `@playwright/test` — no other testing libraries
- One `test.describe` block per page / feature area
- `test.beforeEach` navigates to the page
- Each `test()` covers one user-visible behaviour
- Assertions use `expect(locator).toBeVisible()`, `.toHaveText()`,
  `.toHaveAttribute()`, `.toHaveURL()` etc.
- Use accessible role selectors (`getByRole`, `getByLabel`, `getByText`)
  over CSS selectors where possible
- Do NOT test implementation details — only observable UI behaviour
- Do NOT use `page.waitForTimeout()` — use `await expect(...).toBeVisible()`
  which has built-in retrying

## Step 5 — Run the spec

```bash
npx playwright test e2e/<spec-file>.spec.ts --reporter=list
```

Fix any failures before finishing. If a test reveals a real bug, note it
clearly and open a GitHub issue or fix it inline if trivial.

## Step 6 — Report

Output a short summary:
- What was tested
- Screenshot paths (if any failures)
- Tests added / updated
- Any bugs found
