---
id: changelog-2026-09-11-initial-kit
class: ledger
status: accepted
owner: "@dafrimer"
updated: 2026-09-11
date: 2026-09-11
---

## 2026-09-11 — Initial agent-docs-kit: templates, skills, installers, linter, and first retrofit

**Author:** @dafrimer

### What changed

- Added the class contract at `docs/architecture/doc-classes.md`, defining `living` / `ledger` / `flow` as update rules and the frontmatter every doc carries.
- Added 11 document templates under `templates/`: `AGENTS.md`, `CONTEXT.md`, `docs/README.md`, `docs/architecture/overview.md`, `docs/architecture/component.md`, and README-plus-TEMPLATE pairs for `docs/decisions/`, `docs/stories/`, and `docs/changelog/`. Each README carries the reasoning; each TEMPLATE carries the shape.
- Added 6 agent skills under `skills/`: `docs-kit`, `docs-audit`, `repo-architecture`, `decision-record`, `user-story`, `change-ledger`.
- Added two installers, `install.sh` and `install.ps1`, which create the `docs/` tree in a target repository.
- Added `scripts/lint-docs.mjs`, a zero-dependency ESM validator of the frontmatter contract. It errors on a missing or malformed contract field, on a `living` doc with no `verify:`, and on a `ledger` doc with no `date:`; placeholder residue is a warning only, and warnings never fail a run.
- Scoped the linter to `docs/` after its first run reported 32 errors against skill bodies and templates, which legitimately do not carry the doc contract. Recorded as `docs/decisions/0005-contract-governs-docs-only.md`.
- Retrofitted `homelab-ops` as the first real target, on branch `docs/agent-docs-kit-retrofit`, head commit `7d65e63`. The branch adds `AGENTS.md`, `docs/README.md`, `docs/architecture/overview.md`, six decision records covering ArgoCD, Longhorn, MetalLB, external-secrets, Traefik and the advisory policy rollout, four open stories, two archived under `docs/stories/done/`, a changelog entry, and brings the pre-existing `docs/ci-runbook.md` under the contract.
- Dogfooded the kit in this repository: five decision records, three stories, this changelog, and living indexes for all three folders.

### Why

The kit was built from `docs/research/2026-09-11-workspace-doc-audit.md`, an audit of 22 top-level project folders. That audit found no decision records anywhere, zero documents carrying a date, version or owner, a 46.4KB file mixing a running bug log with current truth, a 707-line plan sitting at 5 of 98 checkboxes, READMEs describing directories and Dockerfiles that do not exist, an 11-byte `.gitignore` hiding a repository's only planning artifact, and the real cross-project backlog in an unversioned vault untouched for seven months.

Every one of those failures is the same failure: a document whose update rule was never stated. Templates alone would not have prevented any of them, because a template shapes a file on the day it is created and says nothing about the day it goes wrong. The contract, the `verify:` requirement and the linter are the parts that act after day one.

The retrofit and this repository's own docs exist because an untested kit is a claim. Running it against `homelab-ops` is what turned the templates from plausible to used, and it is also what surfaced the linter scoping bug.

### Impact

- New repositories adopting the kit gain a `docs/` tree whose contract is checkable by one command with no install step.
- `homelab-ops` has documentation on a branch, not on the default branch. The branch is unmerged and needs review before it lands; nothing in the running cluster changed.
- Six previously-unrecorded homelab infrastructure decisions now have written rationale. They were reconstructed from the current state of the cluster and its configuration, not from contemporaneous notes, because no notes existed.
- The audit surfaced credential exposures and one over-broad agent permission setting. These are live risk. They are deliberately **not** enumerated in this repository: recording a path-precise map to un-rotated secrets creates a durable shopping list that outlives the exposure and survives in git history. The locations were reported to the owner out of band on 2026-09-11 and are tracked outside version control until the material is rotated.
- No CI enforces the contract yet, so today the linter runs only when someone runs it. Tracked by `docs/stories/ci-run-lint-docs.md`.
- The kit is not published. It exists in one local folder, so nothing outside this machine can install it. Tracked by `docs/stories/publish-kit-to-github.md`.

### Verification

- `node scripts/lint-docs.mjs docs` → `14 file(s) checked, 0 error(s), 2 warning(s)`, exit 0. Both remaining warnings are against `docs/research/2026-09-11-workspace-doc-audit.md`, which quotes a literal date placeholder and an empty-section stub line as audit evidence; they are quoted findings, not residue, and warnings never fail a run.
- `git -C ../homelab-ops log --oneline main..docs/agent-docs-kit-retrofit` → four commits, head `7d65e63 docs: bring ci-runbook under the doc-class contract`.
- `git -C ../homelab-ops diff --stat main...docs/agent-docs-kit-retrofit` → 23 files changed, 1639 insertions, 10 deletions.
- `git -C ../homelab-ops show --stat --oneline 7d65e63` → `docs/ci-runbook.md`, 13 insertions, 1 deletion, confirming the retrofit's final commit touches only the file it claims.
- Linter scoping confirmed by the change in its own output: the first run over the repository root reported 32 errors, all against `skills/` and `templates/`; the scoped run over `docs/` reports none.
