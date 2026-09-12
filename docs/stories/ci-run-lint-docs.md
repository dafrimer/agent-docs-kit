---
id: ci-run-lint-docs
class: flow
status: backlog
owner: "@dafrimer"
updated: 2026-09-11
---

# Run the docs linter in CI and fail the build on errors

## Why

The frontmatter contract is only worth having because it is machine-checkable, and right now the machine only checks it when someone remembers to run the command. A doc with a missing owner, a wrong status for its class, or a `living` doc with no `verify` can be merged today and nobody finds out. After this ships, a change that breaks the contract is rejected before it reaches the default branch, so the contract is enforced rather than merely documented.

## Acceptance criteria

- [ ] A CI workflow exists in the repository and runs on every pull request and on pushes to the default branch.
- [ ] The workflow runs `node scripts/lint-docs.mjs docs` from the repository root.
- [ ] The workflow installs no dependencies: the job's only setup step is a Node runtime, matching the linter's zero-dependency constraint stated at the top of `scripts/lint-docs.mjs`.
- [ ] On the current tree the job passes, and its log contains the linter's summary line showing 0 errors.
- [ ] Failure path: a branch that removes the `owner:` line from any file under `docs/` produces a failing job, and the job log names the offending file and field, for example `docs/decisions/README.md:owner: required field is missing`.
- [ ] Warnings alone do not fail the job: a branch that introduces only a placeholder-residue warning still passes, and the warning text appears in the log.

## Out of scope

- Linting `templates/` in CI. It has its own placeholder-tolerant mode and a separate failure profile; add it as a second job only if template drift actually bites.
- Running any other linter, formatter, or test suite in the same workflow.
- Branch protection rules requiring the check. Configure after the job has been green for a while.
- Publishing the repository. Covered by `docs/stories/publish-kit-to-github.md`, which must land first since there is no CI without a remote.

## Notes

- Blocked-by, in practice: `docs/stories/publish-kit-to-github.md`
- Scope of what the linter checks and why it is bounded: `docs/decisions/0005-contract-governs-docs-only.md`
- Why `living` docs fail without a check: `docs/decisions/0004-require-verify-on-living-docs.md`
- Linter usage and exit codes: `scripts/lint-docs.mjs:7`

## Closing
