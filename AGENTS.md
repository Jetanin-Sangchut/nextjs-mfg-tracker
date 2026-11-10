<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Rules

### Code Quality
- No duplicate blocks/patterns in same file → dedupe/extract helper before task is done
- No nested if → use guard clause (early return) first; multiple cases → lookup table instead
- No trash code: unused vars/imports, commented-out code, dead branches, debug logs, orphaned files — clear all before task is done

### Database Design
- Default schema = Star Schema (fact table + dimension tables) unless explicitly instructed otherwise

### Command: "Report Final App"
When user types this after testing, create a new HTML report (filename: `Report_dd-mm-yyyy_HH-mm-ss.html`) covering: Performance, Quality Code, App Health, API Health, Issues + fixes, Recommendations.
- Always re-run all checks fresh — never reuse old results
- Clear cache (.next, tsconfig.tsbuildinfo) before App Health/build check
- If previously reported wrong → add "correction note" explicitly in new report, never silently fix

### Convention Reference
Read `CODE_CONVENTION.md` in this project before writing any code. It is the authoritative guide for folder structure, naming, TypeScript patterns, guard clauses, and component design.

### SPEC Drift Prevention
Before marking any task done, verify:
- page.tsx is thin (imports View component, no logic)
- Server Actions have "use server" at top
- Client Components that use hooks/browser APIs have "use client" at top
- No unused imports or variables
- No hardcoded non-English text
- Tailwind classes via cn(), no inline styles
- No nested if — guard clauses or lookup tables used instead
