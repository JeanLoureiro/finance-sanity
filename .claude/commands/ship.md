Review all changes, create a branch off main, commit with a detailed message, push, and open a PR.

## Step 1 — Understand the changes

Run in parallel:
- `git status` — all modified, added, deleted files
- `git diff` — unstaged changes
- `git diff --cached` — staged changes
- `git log --oneline -10` — recent commit style
- `git branch --show-current` — current branch

## Step 2 — Run the full check suite

```bash
npm run check
```

If any check fails, **stop and fix it before proceeding**. Do not commit broken code.

## Step 3 — Review the diff for quality

Read the changed files and ask:
- Does each change have a clear purpose?
- Are there any leftover debug statements, `console.log`, `TODO`, or commented-out code?
- Do new files follow the correct topology from CLAUDE.md?
- Does `node scripts/check-arch.mjs` report clean?

Fix anything found before proceeding.

## Step 4 — Create a branch off main

```bash
git fetch origin
git checkout main
git pull origin main
```

Then derive a branch name from the changes:
- `feat/` for new features
- `fix/` for bug fixes
- `refactor/` for refactoring
- `chore/` for tooling, config, harness, dependencies
- `test/` for test-only changes
- `docs/` for documentation

Use kebab-case, max 5 words. Examples: `feat/add-recurring-expenses`, `fix/loan-payment-schema`, `chore/agent-harness-setup`.

```bash
git checkout -b <branch-name>
```

## Step 5 — Stage changes

Stage only intentional changes. Warn the user and stop if any of these are in the diff:
- `.env`, `.env.*`, `*.pem`, `*credentials*`, `*secret*`
- Large binary files (> 1 MB)

```bash
git add -A
```

Then run `git diff --cached --stat` to confirm what is staged.

## Step 6 — Write a detailed commit message

Analyse the full staged diff. Write a commit message with:

**Subject line** (≤ 72 chars, imperative mood):
- Starts with a type prefix: `feat:`, `fix:`, `refactor:`, `chore:`, `test:`, `docs:`
- Describes *what* changed, not *how*

**Body** (wrap at 72 chars):
- Explain *why* the change was made, not just what files changed
- Use bullet points for multiple distinct changes
- Reference any conventions, patterns, or motivations

**Footer:**
```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Create the commit:
```bash
git commit -m "$(cat <<'EOF'
<subject line>

<body>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

If the pre-commit hook fails, fix the reported issue, re-stage, and create a **new** commit (never amend).

## Step 7 — Push

```bash
git push -u origin <branch-name>
```

## Step 8 — Create a pull request

Use the gh CLI targeting `main`:

```bash
gh pr create --title "<subject line without type prefix>" --body "$(cat <<'EOF'
## Summary
<!-- 3–5 bullets covering what changed and why -->

## Changes
<!-- Per-file or per-area breakdown -->

## Architecture notes
<!-- Any new conventions, topology choices, or sensor findings worth flagging -->

## Test plan
- [ ] `npm run check` passes
- [ ] <any manual verification steps specific to the changes>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Return the PR URL when done.
