# agent-docs-kit

Documentation templates and installable agent skills for repos that coding agents work in.
It fixes one problem: documents whose **update rule** was never stated, so nobody knew whether to edit them, append to them, or close them.
Every template here traces to a specific failure found in an audit of 22 real project folders.

## The model

A doc's class is not its topic. It is what you are allowed to do to it.

| Class | Update rule | Examples | Required frontmatter |
| --- | --- | --- | --- |
| `living` | Edit in place. Never stale. History lives in git. | `CONTEXT.md`, `docs/architecture/overview.md` | `verify:` — a command or check proving it is still true |
| `ledger` | Append-only. Correct by superseding, never by editing. | `docs/decisions/NNNN-*.md`, `docs/changelog/*.md` | `date:` |
| `flow` | Moves through states, then archives to `done/`. | `docs/stories/*.md` | — |

Every doc carries `id`, `class`, `status`, `owner`, `updated`. Valid `status` per class:

| Class | Valid `status` |
| --- | --- |
| `living` | `current` |
| `ledger` | `accepted`, `superseded`, `reverted` |
| `flow` | `backlog`, `active`, `blocked`, `done`, `dropped` |

Three rules override everything else:

1. **Nothing durable is gitignored.**
2. **Docs point at config; they never copy it.** Reference the file and the line.
3. **One canonical path (`docs/`), thin per-harness pointers, never copies.**

The full contract is `docs/architecture/doc-classes.md`.

## Layout

```
agent-docs-kit/
├── install.sh / install.ps1   installers (equivalent semantics)
├── scripts/lint-docs.mjs      frontmatter linter, zero dependencies
├── docs/                      this kit's own docs (it dogfoods the model)
├── templates/                 copied into your repo
│   ├── AGENTS.md              the router an agent reads first
│   ├── CONTEXT.md             glossary and domain model
│   └── docs/{architecture,decisions,stories,changelog}/
└── skills/                    copied into your agent skill root
```

## Install

Skills go to `~/.claude/skills` by default. Run a dry run first — it writes nothing.

Bash (including Git Bash on Windows):

```sh
./install.sh --dry-run
./install.sh
./install.sh --skills-root ~/.claude/skills --skills-root ~/.config/opencode/skills
./install.sh --docs /path/to/your/repo
```

PowerShell:

```powershell
./install.ps1 -DryRun
./install.ps1
./install.ps1 -SkillsRoot "$HOME\.claude\skills","$HOME\.config\opencode\skills"
./install.ps1 -Docs C:\path\to\your\repo
```

Existing skill directories and existing doc files are skipped and reported, never silently clobbered. Pass `--force` / `-Force` to replace them. Both installers print a created / skipped / would-create summary and exit non-zero if a copy fails.

`--docs` / `-Docs` scaffolds `AGENTS.md`, `CONTEXT.md` and the `docs/` tree into a target repo. Use `--no-skills` / `-NoSkills` to scaffold docs without touching skill roots.

## Lint

```sh
node scripts/lint-docs.mjs            # defaults to docs/
node scripts/lint-docs.mjs templates
```

Checks frontmatter presence, class validity, status legality per class, `verify:` on living docs, `date:` on ledger docs, `updated` date format, and a real `owner`. Warns on placeholder residue (`TODO`, `TBD`, `_No entries yet._`, unfilled `<angle-brackets>`, literal `YYYY-MM-DD`). Exits 1 on any error; warnings alone do not fail. No dependencies — plain `node`.

## Skills

| Skill | Invocation | Purpose |
| --- | --- | --- |
| `docs-kit` | user | Router. Picks the right class and skill for the doc you are about to write. |
| `user-story` | model | Opens a `flow` doc for a unit of work, and closes it to `done/` or `dropped`. |
| `decision-record` | model | Writes an ADR as a `ledger` entry: Status / Context / Decision / Consequences. |
| `repo-architecture` | model | Creates or refreshes `AGENTS.md` and the `living` architecture overview. |
| `change-ledger` | model | Appends a dated changelog entry carrying author and an explicit Why. |
| `docs-audit` | user | Sweeps a repo for the failure classes below and reports what to fix. |

## Why this exists

From `docs/research/2026-09-11-workspace-doc-audit.md`, an audit of 22 top-level project folders:

- **9%** had any agent instructions file (`CLAUDE.md` or `AGENTS.md`) — 2 of 22.
- **0%** had any decision record. Across two years and 22 projects, not one architectural decision has a recorded rationale.

The audit named twelve recurring failures. Each template answers one:

| Failure | What it looked like | Artifact that prevents it |
| --- | --- | --- |
| NO-MAP | 8 top-level dirs, zero markdown files | `AGENTS.md`, committed, naming every dir |
| MONOLITH | A 46KB `CLAUDE.md` with two competing "current" markers | Split by class; one update rule per doc |
| ORPHAN-PLAN | A 707-line plan at 5 of 98 checkboxes | `flow` docs with `blocked` / `dropped` as real states |
| STALE | README claiming manual sync against automated prune + selfHeal | `verify:` on every living doc |
| DUP | One manifest stored in three places | Point at config; never copy it |
| NO-WHY | ArgoCD, Longhorn, MetalLB chosen with no rationale anywhere | `docs/decisions/NNNN-slug.md` |
| INVISIBLE | A `.gitignore` of 11 bytes hiding the repo's only plan | Nothing durable is gitignored |
| WRONG-HARNESS | The best doc on a path no tool loads | One canonical path, thin pointers |
| DRIFT | Branch intent encoded only in directory names | Intent recorded in a story file |
| UNDATED | `_No entries yet._` printed above 6 real entries | Entries require date, author, Why |

The audit's one exemplar — a changelog that was dated, attributed, and carried explicit `### Why` sections — is the shape `templates/docs/changelog/` copies.
