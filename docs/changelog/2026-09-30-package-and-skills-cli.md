---
id: changelog-2026-09-30-package-and-skills-cli
class: ledger
status: accepted
owner: "@dafrimer"
updated: 2026-09-30
date: 2026-09-30
---

## 2026-09-30 — Distribution moves to the `skills` CLI and an npm `bin`; both installers deleted

**Author:** @dafrimer

### What changed

- Added `package.json` declaring `agent-docs-kit` with `bin: agent-docs-kit`, `files: [bin/, scripts/, templates/]`, `type: module`, and `engines.node >= 18`. No dependencies. The name was free on the registry as of this date.
- Added `bin/agent-docs-kit.mjs` with two commands. `init [target]` mirrors `templates/` into a repository, defaulting to the current directory, honouring `--force` and `--dry-run`, skipping existing files by name, and printing the same created / skipped / would-create summary the deleted installers printed. `lint [path ...]` runs the frontmatter contract.
- Changed `scripts/lint-docs.mjs` to `export function main` and to self-execute only when `process.argv[1]` resolves to its own module URL. `agent-docs-kit lint` imports that function rather than spawning a child process, so there is one implementation and one exit-code path. Its usage banner now names both entry points.
- Deleted `install.sh` and `install.ps1`, 12.8KB of two scripts maintained in lockstep.
- Rewrote the README's Layout, Install and Lint sections around the two new channels, and fixed four defects a public reader hits: added a three-line quick start and an explicit "not published yet" note so `npx agent-docs-kit` does not silently 404; replaced the dead `homelab-ops#104` link, which pointed into a private repository, with the evidence itself; and corrected the failure-taxonomy count.
- Added `LICENSE`. `package.json` declared MIT with no license file in the repository, which is a claim with nothing behind it on a public repository.
- Recorded the reasoning as `docs/decisions/0006-skills-cli-and-npm-not-plugin.md`, and added its row to `docs/decisions/README.md`.

**The README carried its own STALE defect.** It said "The audit named twelve recurring failures. Each template answers one" directly above a ten-row table — the identical shape the kit's own worked example calls out, a CI runbook reading "Four workflows" above a six-row table. The audit does name twelve classes (`docs/research/2026-09-11-workspace-doc-audit.md`, §1–§12); two of them, AD-HOC-WORK and CONFIG-DRIFT, have no artifact here and never did. The text now says ten, and a following paragraph names the two the kit deliberately does not address and why. Padding the table to twelve would have been the wrong fix: CONFIG-DRIFT is harness configuration, which `docs/decisions/0005-contract-governs-docs-only.md` puts outside this contract.

### Why

The opening question was whether to repackage the kit as a Paseo plugin so it could be installed alongside other Paseo work. It cannot usefully be one. The Paseo plugin reference, 2266 lines fetched on 2026-09-30, contains no occurrence of the word "skill"; its contribution points are UI surfaces, Command Center items, slash commands, timeline transformers, themes, attachment sources, RPC handlers, providers, and lifecycle hooks. Paseo does not use a plugin for its own four orchestration skills either — `paseo.sh/docs/skills.md` installs them with `npx skills add getpaseo/paseo`. The underlying reason is that a skill is read by the harness process, not by the orchestrator that launches it.

That pointed at the channel Paseo itself uses. The `skills` ecosystem CLI expects exactly the `skills/*/SKILL.md` layout this repository already had, so no adaptation was needed at all: `npx skills add . --list` run against the unmodified tree found all six skills. It also supplies the three things the bespoke installers never had — a correct skill-root path for Claude Code, Codex, Cursor and 29 more harnesses instead of a hardcoded `~/.claude/skills`; project scope, which commits skills into the consuming repository where teammates and every harness in that clone pick them up; and `check` / `update` / `remove`, so an edit here reaches an existing install.

What the `skills` CLI does not move is `templates/` and `scripts/lint-docs.mjs`, because they are not skills. Bundling them inside `skills/docs-kit/` so one command delivered everything was considered and rejected: the linter's job is to run in CI, and under that layout its path varies per harness and per scope and is absent from a fresh clone. An npm `bin` gives it a stable `npx agent-docs-kit lint`, and keeps one copy of the templates rather than the two that layout would have required — which is failure class DUP, from the audit that produced this kit.

### Impact

- Adopting the kit is now two commands, `npx skills add dafrimer/agent-docs-kit` and `npx agent-docs-kit init`, where it was one clone plus one script. That is a real cost, accepted in 0006.
- `npx agent-docs-kit lint` is a CI step with no clone and no install step, which removes the blocker named in `docs/stories/ci-run-lint-docs.md`. That story is still open: nothing has been wired into a workflow yet.
- **The npm package is not published.** `npx agent-docs-kit` resolves to nothing until a release is cut; today the CLI runs only from a clone as `node bin/agent-docs-kit.mjs`. `npx skills add` needs no publish and works now, because it reads the repository directly.
- `docs/stories/done/publish-kit-to-github.md` contains three acceptance criteria naming `install.sh` and `install.ps1`, one of them still unticked. It is an archived flow doc and has deliberately not been edited; this entry is the record that those criteria now describe a mechanism that no longer exists.
- The 2026-09-11 changelog entry likewise still claims the kit ships two installers. It is a ledger entry and is not rewritten; this entry supersedes that claim.
- Skill distribution now depends on a third-party CLI whose scope rules and path table are outside this repository's control.

### Verification

Run from the working tree at `H:/Projects/agent-docs-kit`.

- `npx -y skills@latest add . --list` → `Found 6 skills`, listing `change-ledger`, `decision-record`, `docs-audit`, `docs-kit`, `repo-architecture`, `user-story`. The layout needed no change to be a valid source.
- `node bin/agent-docs-kit.mjs --version` → `0.1.0`.
- `node bin/agent-docs-kit.mjs init H:/tmp/adk-smoke --dry-run` → `12 would create, 0 skipped, 0 failed. Nothing was written.`, and the target was confirmed empty afterwards.
- `node bin/agent-docs-kit.mjs init H:/tmp/adk-smoke` → `12 created, 0 skipped, 0 failed.`
- Re-running `init` against the populated target → `0 created, 12 skipped, 0 failed.` Overwrite protection holds without `--force`; with `--force` the twelve files are rewritten.
- `node bin/agent-docs-kit.mjs lint docs` → `13 file(s) checked, 0 error(s), 2 warning(s)`, exit 0. Both warnings are the pre-existing quoted placeholders in `docs/research/2026-09-11-workspace-doc-audit.md`.
- `node bin/agent-docs-kit.mjs lint H:/tmp/adk-smoke/docs` → `9 file(s) checked, 11 error(s), 64 warning(s)`, exit 1. A scaffolded-but-unfilled tree failing is the intended behaviour: the placeholder owners are errors until someone fills them.
- `node bin/agent-docs-kit.mjs lint templates` → `11 file(s) checked, 0 error(s), 88 warning(s)`, exit 0. The placeholder-tolerant mode from 0005 survives the new entry point.
- Exit codes: clean lint 0, dirty lint 1, unknown command 2, `--help` 0.
