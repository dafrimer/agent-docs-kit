---
id: changelog-2026-09-30-ci-enforces-contract
class: ledger
status: accepted
owner: "@dafrimer"
updated: 2026-09-30
date: 2026-09-30
---

## 2026-09-30 — CI enforces the frontmatter contract; the kit's last open story closes

**Author:** @dafrimer

### What changed

- Added `.github/workflows/docs.yml`: one job, triggered on `pull_request` and on pushes to `main`. Steps are `actions/checkout@v4`, `actions/setup-node@v4` at Node 20, and `node bin/agent-docs-kit.mjs lint docs`. There is no dependency install step.
- Fixed the `verify:` on `docs/stories/README.md`. It read `grep -l 'status: done' docs/stories/*.md returns nothing`, which matched the verify line's own text and so reported a false positive against the index itself. It is now anchored to `^status: \(done\|dropped\)$`, which matches frontmatter and not prose.
- Closed `docs/stories/ci-run-lint-docs.md` with all six acceptance criteria ticked and its `## Closing` filled in, and moved it to `docs/stories/done/`.
- Updated `docs/stories/README.md`: the current-stories table is now empty, with both closed stories listed against their archive paths.

### Why

The contract was machine-checkable but not machine-checked. A doc with a missing `owner`, a status illegal for its class, or a `living` doc with no `verify:` could be merged and nobody would find out until someone happened to run the linter by hand. That is the gap `docs/decisions/0004-require-verify-on-living-docs.md` leaves open on its own: the requirement existed, the enforcement did not.

The story had been blocked since 2026-09-11 on two things that are now both gone. It needed a remote, which `docs/stories/done/publish-kit-to-github.md` supplied. It needed a linter reachable without a clone-relative path, which `docs/decisions/0006-skills-cli-and-npm-not-plugin.md` supplied by adding the `bin`.

The job installs nothing on purpose. `scripts/lint-docs.mjs:5` states the zero-dependency constraint, and a workflow that runs `npm ci` would quietly make that constraint unenforced in the one place it is easiest to break. The workflow carries a comment saying so, because a future `npm ci` added there would otherwise look like ordinary housekeeping.

Closing the story surfaced a `verify:` that had never passed. `docs/stories/README.md` carried `grep -l 'status: done' docs/stories/*.md returns nothing`, and that pattern matches the verify line's own text — so the command has reported a false positive against the index since the day it was written on 2026-09-11. `git show` against the pre-merge tree confirms the match predates this change. A `living` doc whose `verify:` cannot pass is the exact failure `docs/decisions/0004-require-verify-on-living-docs.md` exists to prevent, shipped inside the kit that defines it. The linter cannot catch this: `0005` scopes it to frontmatter presence and legality, not to running the command a `verify:` names. Nothing in this repository executes those commands automatically, which is why this one rotted unnoticed for nineteen days.

### Impact

- A pull request that breaks the contract is now rejected before it reaches `main`. As of this entry the check is advisory: branch protection requiring it is deliberately not configured, per the story's own out-of-scope list.
- The workflow runs `node bin/agent-docs-kit.mjs lint docs`, not `node scripts/lint-docs.mjs docs` as the story's second criterion originally specified. Both call the same function; the former is the entry point the README, the templates' `verify:` fields and the `docs-kit` skill all name, so CI now exercises the documented command rather than an alternate path to it. The criterion was rewritten to match what shipped.
- This repository has no open stories. That is the correct state, not a gap — pre-writing stories to populate the folder is the ORPHAN-PLAN failure the folder exists to prevent.
- **The npm package is still unpublished.** `npm whoami` returns `ENEEDAUTH` on this machine, so `npx agent-docs-kit` continues to resolve to nothing for everyone. CI is unaffected because it runs from a checkout.
- A second `verify:`-not-run gap is now visible and unaddressed: the linter checks that a `living` doc *has* a `verify:`, never that the command *passes*. Both defects found in this repository so far — the README's twelve-versus-ten table and this false-positive grep — were caught by a human reading, not by a check. No story is opened for it; the mechanism would have to execute arbitrary shell from frontmatter, which is a decision, not a chore.

### Verification

Three real GitHub Actions runs, not local invocations.

| Criterion | Branch | Run | Result |
| --- | --- | --- | --- |
| Runs on PR; no install; green on the current tree | `feat/ci-lint-docs` | 36769348131 | success — `15 file(s) checked, 0 error(s), 2 warning(s)` |
| Fails on a contract error, naming file and field | `proof/lint-fails-on-missing-owner` | 36769456490 | failure — `docs/decisions/README.md:owner: required field is missing`, then `15 file(s) checked, 1 error(s), 2 warning(s)` |
| Warnings alone do not fail | `proof/lint-warns-only` | 36769468259 | success — `15 file(s) checked, 0 error(s), 3 warning(s)`, warning text present in the log |

The failure-path log line is character-for-character the string the story predicted on 2026-09-11, when it named `docs/decisions/README.md:owner: required field is missing` as the expected output. The criterion specified the output and the output matched.

Both proof branches were throwaway, opened as PRs #3 and #4 solely to fire the `pull_request` trigger, then closed unmerged and deleted. Neither reached `main`.
