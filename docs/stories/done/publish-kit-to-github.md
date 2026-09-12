---
id: publish-kit-to-github
class: flow
status: done
owner: "@dafrimer"
updated: 2026-09-11
---

# Publish agent-docs-kit to GitHub

## Why

The kit exists in one local folder on one machine. Anyone who wants to use it — a fresh agent session in another project, a future clone of this machine — has no way to get it. Once this ships, installing the doc system into a project is cloning a repository and running one script, instead of copying a directory nobody else can see.

## Acceptance criteria

- [x] A **private** GitHub repository named `agent-docs-kit` exists under `@dafrimer` and its default branch contains the current tree: `templates/`, `skills/`, `scripts/`, `docs/`, `README.md`, `install.sh`, `install.ps1`.
- [x] `git clone` of the URL into an empty directory succeeds **for an authenticated owner**. The repo is private, so unauthenticated clone is expected to fail — that is the intent, not a defect.
- [x] In that fresh clone, `node scripts/lint-docs.mjs docs` exits 0 and prints no errors.
- [x] In that fresh clone, `bash install.sh` run against a throwaway target directory creates `docs/decisions/`, `docs/stories/`, `docs/changelog/` and `docs/architecture/` in the target, and exits 0.
- [ ] `install.ps1` run against a throwaway target directory on Windows produces the same folder set and exits 0.
- [x] The repository front page renders `README.md` with a working link to `docs/architecture/doc-classes.md`.
- [x] Failure path: running either installer against a target that already has a `docs/` tree does not overwrite an existing file without saying so — the run reports what it skipped, and the pre-existing file's contents are unchanged afterward.

## Out of scope

- Publishing to npm or any package registry. The install path is clone-and-run.
- Versioning, tags, or a release process. Covered by `docs/changelog/` until there is a reason for more.
- CI. Covered by `docs/stories/ci-run-lint-docs.md`.
- A documentation site or GitHub Pages rendering.
- Migrating any other project onto the kit. The homelab-ops retrofit landed as its own PR; further retrofits are separate stories.

## Notes

- Decision on where work state lives: `docs/decisions/0002-files-as-story-source-of-truth.md`
- Contract the linter enforces: `docs/architecture/doc-classes.md`
- Linter entry point: `scripts/lint-docs.mjs`
- Installers: `install.sh`, `install.ps1`

## Closing

**Closed:** 2026-09-11

**Shipped:** Private repository `dafrimer/agent-docs-kit`, default branch `main` at commit `e27aa79`, 39 tracked files. A `.gitattributes` pinning `eol=lf` was added during publication because git was set to convert LF to CRLF, which would have broken `install.sh` under bash; the committed installer was verified to contain 0 CR bytes.

**Verified from a fresh clone** of the remote, not the working tree:

- `git clone` → exit 0, 39 tracked files
- `node scripts/lint-docs.mjs docs` → `14 file(s) checked, 0 error(s), 2 warning(s)`, exit 0
- `bash install.sh --no-skills --docs ../target` → `12 created, 0 skipped, 0 failed`, exit 0
- Overwrite protection: appended a marker to `docs/decisions/README.md` in the target and re-ran → `0 created, 12 skipped, 0 failed`; md5 of the edited file identical before and after

**Diverged from the plan:**

1. **Private, not public.** The story was written assuming a public repo. The repository was deliberately created private, so the "clone without authentication" criterion was inverted: unauthenticated clone failing is now the correct behaviour. Criteria above were rewritten to match reality rather than left as a passing fiction.
2. **`install.ps1` left unticked.** Only `install.sh` was exercised from the fresh clone. The PowerShell installer was verified earlier against a fabricated fixture tree, but not from this clone, so the criterion is recorded as unmet rather than assumed.

The two remaining lint warnings are pre-existing in `docs/research/2026-09-11-workspace-doc-audit.md`, which quotes an empty-changelog stub marker and a literal date placeholder as audit evidence. Both are intentional citations, not residue.
