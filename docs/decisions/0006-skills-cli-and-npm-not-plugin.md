---
id: adr-0006-skills-cli-and-npm-not-plugin
class: ledger
status: accepted
owner: "@dafrimer"
updated: 2026-09-30
date: 2026-09-30
---

# 0006. Ship skills through the `skills` CLI and docs through npm, not through bespoke installers or a Paseo plugin

## Context

The kit had one distribution mechanism: `install.sh` and `install.ps1`, 12.8KB of two scripts maintained in lockstep, each doing two unrelated jobs — copying `skills/` into an agent skill root, and copying `templates/` into a target repository. Both defaulted the skill root to `~/.claude/skills`, so every other harness needed the path passed by hand. Neither recorded what it had installed, so there was no update path: reinstalling was a re-clone and a re-run, and a skill edited upstream was invisible to an existing install.

The question that opened this was whether to package the kit as a Paseo plugin, since Paseo is where these agents are launched. Three findings answered it.

The Paseo plugin API has no skill contribution point. Its reference (2266 lines, fetched 2026-09-30) contains no occurrence of the word "skill". What a plugin can contribute is screens, sidebar items, workspace panels, Command Center items, slash commands, timeline transformers and rows, themes, attachment sources, RPC handlers, providers, and lifecycle and before hooks. Installing a `SKILL.md` is not among them.

Paseo does not ship its own skills as a plugin either. `/paseo`, `/paseo-handoff`, `/paseo-committee` and `/paseo-advisor` install with `npx skills add getpaseo/paseo`, per `paseo.sh/docs/skills.md`.

The reason both are true is that a skill is read by the harness, not by the orchestrator. Claude Code reads `.claude/skills/`, Codex reads `.codex/skills/`, OpenCode reads `.opencode/skills/`. Paseo launches those processes; it does not interpret their skills. A plugin that "installed skills" could only shell out to the same copy logic the installers already had, while restricting the audience to people running Paseo.

Meanwhile the ecosystem CLI already solves the job the installers were doing badly. `npx skills add owner/repository` resolves GitHub shorthand, full URLs, git URLs and local paths; knows the project and global skill root for Claude Code, Codex, Cursor and 29 more harnesses; offers symlink or copy; and provides `check`, `update`, `remove` and a lockfile. Its source layout requirement is a `SKILL.md` per skill directory, with `name` and `description` frontmatter — which is what `skills/` in this repository already was. Run against this tree unchanged, `npx skills add . --list` reported all six skills.

## Decision

We will distribute the two halves of the kit through the two channels that already own them.

Skills ship through the `skills` ecosystem CLI: `npx skills add dafrimer/agent-docs-kit`. This repository is the source; no adapter, manifest or publish step is required, because the existing `skills/*/SKILL.md` layout is already the expected one.

Templates and the linter ship as an npm package, `agent-docs-kit`, with a `bin`: `npx agent-docs-kit init [target]` scaffolds `AGENTS.md`, `CONTEXT.md` and the `docs/` tree, and `npx agent-docs-kit lint [path...]` runs the frontmatter contract. `scripts/lint-docs.mjs` now exports `main` and self-executes only when invoked directly, so both entry points share one implementation.

`install.sh` and `install.ps1` are deleted.

## Alternatives considered

### Build a Paseo plugin

Rejected on the evidence above: the API has no place to put a skill, Paseo does not use a plugin for its own skills, and the audience would shrink to Paseo users, excluding Cursor, Copilot, a plain terminal, and CI. A plugin remains a reasonable *later* convenience layer — a `workspace.created` hook that scaffolds docs into each new worktree, a `/docs-audit` slash command, a panel rendering lint output — but it is a layer on top of this decision, not a substitute for it. It is deliberately not built now.

### Keep the bespoke installers

Zero migration, no network dependency, works on a machine with no npm. Rejected because the cost is permanent and compounding: two scripts to keep in step, one harness path hardcoded, no update tracking, and no answer to "which version of this skill do I have". The `skills` CLI supplies all four, and the marginal work to adopt it was zero because the layout already matched.

### Bundle templates and the linter inside `skills/docs-kit/`

The `skills` CLI copies a whole skill directory, so the templates and the linter would travel with the skill and one command would deliver everything. Rejected because the linter's purpose is to run in CI. Under this layout its path becomes `~/.claude/skills/docs-kit/scripts/lint-docs.mjs` — a path that varies per harness and per scope, is absent from a fresh clone, and cannot be named in a workflow file. It also duplicates `templates/` the moment a second skill needs them, which is failure class DUP from the audit that produced this kit.

### Publish the npm package *and* keep a copy of templates in `skills/docs-kit/`

Maximum reach. Rejected for the same reason as above, more sharply: two copies of the templates, in one repository, with no mechanism keeping them identical. Rule 2 of the contract is that docs point at config and never copy it; shipping the kit in violation of its own rule is not a trade-off worth the convenience.

## Consequences

### Accepting

- One command per artifact, each from the tool that owns it: `npx skills add dafrimer/agent-docs-kit` for skills, `npx agent-docs-kit init` for docs.
- Skills reach 33 harnesses rather than one, and default to project scope — committed into the consuming repository, so teammates and every harness in that clone get them without installing anything.
- Installed skills gain `check` and `update`. Editing a skill here now propagates to existing installs.
- `npx agent-docs-kit lint` is a one-line CI step with no clone and no install, which unblocks `docs/stories/ci-run-lint-docs.md`.
- 12.8KB of dual-maintained shell and PowerShell is gone, along with the `~/.claude/skills` default that made every other harness a manual argument.

### Costs

- Two commands to adopt the kit where there was one. Anyone who wants skills *and* docs runs both.
- Both channels require network and npm. A machine with neither can still `git clone` and run `node bin/agent-docs-kit.mjs init`, but there is no longer a shell-only path.
- The package is not published yet, so `npx agent-docs-kit` resolves to nothing until it is. `npx skills add` works today because it reads this repository directly.
- Skill installation is now governed by a third-party CLI. Its scope rules, path table, and lockfile format are outside this repository's control, and a breaking change there is a breaking change here.
- The npm package and the git repository become separately versioned artifacts. A skill fixed in `main` is available through `skills update` immediately; a template fixed in `main` is not available through `npx` until a release is cut.
