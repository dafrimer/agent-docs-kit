---
id: ci-run-lint-docs
class: flow
status: done
owner: "@dafrimer"
updated: 2026-09-30
---

# Run the docs linter in CI and fail the build on errors

## Why

The frontmatter contract is only worth having because it is machine-checkable, and right now the machine only checks it when someone remembers to run the command. A doc with a missing owner, a wrong status for its class, or a `living` doc with no `verify` can be merged today and nobody finds out. After this ships, a change that breaks the contract is rejected before it reaches the default branch, so the contract is enforced rather than merely documented.

## Acceptance criteria

- [x] A CI workflow exists in the repository and runs on every pull request and on pushes to the default branch.
- [x] The workflow runs the linter from the repository root. It runs `node bin/agent-docs-kit.mjs lint docs` rather than `node scripts/lint-docs.mjs docs` as originally written — the same implementation reached through the canonical entry point added in `docs/decisions/0006-skills-cli-and-npm-not-plugin.md`.
- [x] The workflow installs no dependencies: the job's only setup step is a Node runtime, matching the linter's zero-dependency constraint stated at the top of `scripts/lint-docs.mjs`.
- [x] On the current tree the job passes, and its log contains the linter's summary line showing 0 errors.
- [x] Failure path: a branch that removes the `owner:` line from any file under `docs/` produces a failing job, and the job log names the offending file and field, for example `docs/decisions/README.md:owner: required field is missing`.
- [x] Warnings alone do not fail the job: a branch that introduces only a placeholder-residue warning still passes, and the warning text appears in the log.

## Out of scope

- Linting `templates/` in CI. It has its own placeholder-tolerant mode and a separate failure profile; add it as a second job only if template drift actually bites.
- Running any other linter, formatter, or test suite in the same workflow.
- Branch protection rules requiring the check. Configure after the job has been green for a while.
- Publishing the repository. Covered by `docs/stories/publish-kit-to-github.md`, which must land first since there is no CI without a remote.

## Notes

- Blocked-by, now cleared: `docs/stories/done/publish-kit-to-github.md`
- Scope of what the linter checks and why it is bounded: `docs/decisions/0005-contract-governs-docs-only.md`
- Why `living` docs fail without a check: `docs/decisions/0004-require-verify-on-living-docs.md`
- Linter usage and exit codes: `scripts/lint-docs.mjs:7`

## Closing

**Shipped:** `.github/workflows/docs.yml`, one job, on `pull_request` and on pushes to `main`. Steps are `actions/checkout@v4`, `actions/setup-node@v4` at Node 20, and `node bin/agent-docs-kit.mjs lint docs`. No install step.

**Verified on GitHub Actions, not locally.** Three real runs:

| Criterion | Branch | Run | Result |
| --- | --- | --- | --- |
| 1, 3, 4 | `feat/ci-lint-docs` | 36769348131 | success — `15 file(s) checked, 0 error(s), 2 warning(s)` |
| 5 | `proof/lint-fails-on-missing-owner` | 36769456490 | failure — `docs/decisions/README.md:owner: required field is missing`, `15 file(s) checked, 1 error(s), 2 warning(s)` |
| 6 | `proof/lint-warns-only` | 36769468259 | success — `15 file(s) checked, 0 error(s), 3 warning(s)`, warning text present |

The failure-path log line is character-for-character the string this story predicted when it was written on 2026-09-11, which is the point: the criterion named the output, and the output matched.

Both proof branches were throwaway. They were opened as PRs #3 and #4 purely to fire the `pull_request` trigger, then closed unmerged and deleted. Neither reached `main`.

**Diverged from the plan:** criterion 2 named `node scripts/lint-docs.mjs docs`. The workflow runs `node bin/agent-docs-kit.mjs lint docs` instead. Same function, same exit codes — `agent-docs-kit lint` imports `main` rather than spawning a child — but it is the entry point the README, the templates' `verify:` fields and the `docs-kit` skill all now name, so CI checking the other one would have left the documented command unexercised. The criterion was rewritten to match what shipped rather than left as a passing fiction.

**Left open deliberately:** branch protection requiring this check. The story put it out of scope until the job has been green for a while, and it has now been green for three runs, which is not a while.
