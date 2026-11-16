---
name: Write tests first
description: Always write tests before implementation changes
type: feedback
---

Always write tests before making implementation changes (TDD). Write the test, confirm it fails, then implement. Coverage must be 100% — `npx vitest run --coverage` must pass with no threshold errors.

**Why:** User has explicitly corrected this multiple times. Coverage gaps require retroactive test-writing, which is painful. The vite.config.js enforces 100% thresholds on statements, branches, functions, and lines.

**How to apply:** For every code change — even small ones — write the test file edit first, run to confirm failure, then implement. After implementing, run `npx vitest run --coverage` to verify 100% is maintained. Never leave uncovered branches (including both sides of `||`, uppercase key variants, all phases of conditional rendering).
