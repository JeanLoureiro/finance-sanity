#!/usr/bin/env node
/**
 * Architecture fitness checks for compiledSanity/webapp.
 *
 * Usage:
 *   node scripts/check-arch.mjs               # scan full project
 *   node scripts/check-arch.mjs path/to/file  # scan single file (used by PostToolUse hooks)
 *
 * Exits 0 when clean, 1 when violations are found.
 * Output is formatted for LLM self-correction: each violation includes the exact fix.
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, resolve, relative, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const targetFile = process.argv[2] ? resolve(process.argv[2]) : null;

// ── helpers ────────────────────────────────────────────────────────────────────

const SKIP_DIRS = ["node_modules", ".next", ".git", "app/generated", "emails", "e2e"];

function walkDir(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    if (SKIP_DIRS.some((skip) => fullPath.includes(skip))) continue;
    const stat = statSync(fullPath);
    if (stat.isDirectory()) walkDir(fullPath, files);
    else if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) files.push(fullPath);
  }
  return files;
}

function getFilesToCheck() {
  if (targetFile) {
    if (!targetFile.endsWith(".ts") && !targetFile.endsWith(".tsx")) return [];
    return [targetFile];
  }
  return walkDir(ROOT);
}

function relPath(filePath) {
  return relative(ROOT, filePath);
}

let violations = 0;

function report(check, filePath, lineNumber, message, hint) {
  violations++;
  console.error(`\n[arch:${check}] ${relPath(filePath)}:${lineNumber}`);
  console.error(`  ${message}`);
  if (hint) console.error(`  FIX: ${hint}`);
}

// ── check 1: inline Zod schemas outside lib/schemas.ts ────────────────────────
//
// Detects: const fooSchema = z.object(  or  const bar = z.string()  etc.
// Excludes: lib/schemas.ts itself, *.test.ts files

const SCHEMAS_FILE = resolve(ROOT, "lib/schemas.ts");
const INLINE_ZOD_RE = /^\s*(?:export\s+)?const\s+(\w+)\s*=\s*z\.(object|string|number|enum|array|boolean|coerce|union|literal|discriminatedUnion|record|tuple)\s*[<(]/;

function checkInlineZodSchemas(files) {
  for (const filePath of files) {
    if (filePath === SCHEMAS_FILE) continue;
    if (filePath.endsWith(".test.ts")) continue;

    const content = readFileSync(filePath, "utf8");
    // Only flag files that actually import from zod
    if (!/from ['"]zod['"]/.test(content)) continue;

    const lines = content.split("\n");
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const match = line.match(INLINE_ZOD_RE);
      if (match) {
        const schemaName = match[1];
        report(
          "schemas",
          filePath,
          index + 1,
          `Inline Zod schema '${schemaName}' defined outside lib/schemas.ts.`,
          `Move '${schemaName}' to lib/schemas.ts, export it, then: import { ${schemaName} } from "@/lib/schemas";`
        );
      }
    }
  }
}

// ── check 2: inline React Query key strings outside lib/queryKeys.ts ──────────
//
// Detects: queryKey: ["some-string"  or  queryKey: ['some-string'
// Excludes: lib/queryKeys.ts itself

const QUERY_KEYS_FILE = resolve(ROOT, "lib/queryKeys.ts");
const INLINE_QUERY_KEY_RE = /queryKey:\s*\[['"`]/;

function checkInlineQueryKeys(files) {
  for (const filePath of files) {
    if (filePath === QUERY_KEYS_FILE) continue;

    const lines = readFileSync(filePath, "utf8").split("\n");
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (INLINE_QUERY_KEY_RE.test(line)) {
        const keyPreview = line.match(/queryKey:\s*(\[.{0,50})/)?.[1] ?? "";
        report(
          "querykeys",
          filePath,
          index + 1,
          `Inline React Query key string: ${keyPreview.trim()}`,
          `Use queryKeys from "@/lib/queryKeys". Add new key factories to lib/queryKeys.ts if needed.`
        );
      }
    }
  }
}

// ── check 3: plain float arithmetic on monetary values ────────────────────────
//
// Scoped to lib/ and app/api/ only (dashboard UI math is allowed to use plain numbers for display).
// Detects two patterns:
//   A) Number(x) + Number(y)  — double-wrapping and operating
//   B) .reduce((acc, item) => acc + Number(  — accumulator float pattern

const FLOAT_DOUBLE_WRAP_RE = /Number\([^)]+\)\s*[+\-*/]\s*Number\([^)]+\)/;
const REDUCE_FLOAT_ACCUM_RE = /=>\s*\w+\s*\+\s*Number\(/;

function checkMonetaryArithmetic(files) {
  const monetaryFiles = files.filter((filePath) => {
    const relative = relPath(filePath);
    return relative.startsWith("lib/") || relative.startsWith("app/api/");
  });

  for (const filePath of monetaryFiles) {
    if (filePath.endsWith(".test.ts")) continue;

    const lines = readFileSync(filePath, "utf8").split("\n");
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];

      if (FLOAT_DOUBLE_WRAP_RE.test(line)) {
        report(
          "decimal",
          filePath,
          index + 1,
          `Plain float arithmetic on Number()-wrapped values.`,
          `Use decimal.js: new Decimal(a).plus(new Decimal(b)). Never use + - * / on monetary values.`
        );
      } else if (REDUCE_FLOAT_ACCUM_RE.test(line)) {
        report(
          "decimal",
          filePath,
          index + 1,
          `Float accumulation in reduce() — likely operating on a monetary field.`,
          `Use: items.reduce((acc, item) => acc.plus(new Decimal(item.amount)), new Decimal(0))`
        );
      }
    }
  }
}

// ── run all checks ─────────────────────────────────────────────────────────────

const allFiles = getFilesToCheck();

checkInlineZodSchemas(allFiles);
checkInlineQueryKeys(allFiles);
checkMonetaryArithmetic(allFiles);

if (violations > 0) {
  console.error(`\n[arch] ${violations} architectural violation(s) found.`);
  process.exit(1);
} else {
  console.log(`[arch] All architectural checks passed.`);
}
