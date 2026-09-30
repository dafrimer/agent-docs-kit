# agent-docs-kit

Documentation templates and installable agent skills for repos that coding agents work in.
It fixes one problem: documents whose **update rule** was never stated, so nobody knew whether to edit them, append to them, or close them.
Every template here traces to a specific failure found in an audit of 22 real project folders.

```sh
npx skills add dafrimer/agent-docs-kit   # the six skills, into your harness
npx agent-docs-kit init                  # AGENTS.md, CONTEXT.md, docs/
npx agent-docs-kit lint docs             # fails until you fill the placeholders
```

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
├── bin/agent-docs-kit.mjs    CLI: `init` scaffolds, `lint` checks
├── scripts/lint-docs.mjs     frontmatter linter, zero dependencies
├── docs/                     this kit's own docs (it dogfoods the model)
├── templates/                copied into your repo by `init`
│   ├── AGENTS.md             the router an agent reads first
│   ├── CONTEXT.md            glossary and domain model
│   └── docs/{architecture,decisions,stories,changelog}/
└── skills/                   installed by the `skills` CLI, not by this one
```

## Install the skills

Skills are consumed by the agent harness, not by this kit, so they install with the
[`skills` CLI](https://github.com/antfu/skills-cli) — which knows the skill root of 30-odd
harnesses, handles project versus global scope, and tracks updates:

```sh
npx skills add dafrimer/agent-docs-kit --list     # see what is on offer
npx skills add dafrimer/agent-docs-kit            # project scope: ./<agent>/skills/
npx skills add dafrimer/agent-docs-kit -g         # global scope: ~/<agent>/skills/
npx skills add dafrimer/agent-docs-kit --skill docs-kit --skill docs-audit
```

Project scope is the right default for a repo you share: the skills land in `.claude/skills/`
(or `.codex/skills/`, `.cursor/skills/`, …), get committed, and every teammate and every
harness picks them up from the clone. Use `-g` for skills you want everywhere.

`npx skills check` and `npx skills update` keep installed copies current.

## Scaffold the docs

> **Not published yet.** `npx agent-docs-kit` resolves to nothing until the first npm
> release. Until then, clone this repo and run `node bin/agent-docs-kit.mjs` in place of
> `npx agent-docs-kit`. The `npx skills add` command above needs no publish and works today.

```sh
npx agent-docs-kit init                  # into the current repo
npx agent-docs-kit init /path/to/repo    # into another repo
npx agent-docs-kit init --dry-run        # print every action, write nothing
npx agent-docs-kit init --force          # overwrite files that already exist
```

`init` writes `AGENTS.md`, `CONTEXT.md` and the `docs/` tree. Existing files are reported and
left alone unless `--force` is passed. The command prints a created / skipped / would-create
summary and exits non-zero if a write fails.

## Lint

```sh
npx agent-docs-kit lint            # defaults to docs/
npx agent-docs-kit lint templates  # placeholder-tolerant mode
node scripts/lint-docs.mjs docs    # same thing, from a clone
```

Checks frontmatter presence, class validity, status legality per class, `verify:` on living docs, `date:` on ledger docs, `updated` date format, and a real `owner`. Warns on placeholder residue (`TODO`, `TBD`, `_No entries yet._`, unfilled `<angle-brackets>`, literal `YYYY-MM-DD`). Exits 1 on any error; warnings alone do not fail. No dependencies — plain `node`.

A freshly scaffolded tree lints dirty on purpose: the placeholder owners are errors until you
fill them. That first failing run is the handoff from template to document.

## Skills

| Skill | Invocation | Purpose |
| --- | --- | --- |
| `docs-kit` | user | Router. Picks the right class and skill for the doc you are about to write. |
| `user-story` | model | Opens a `flow` doc for a unit of work, and closes it to `done/` or `dropped`. |
| `decision-record` | model | Writes an ADR as a `ledger` entry: Status / Context / Decision / Consequences. |
| `repo-architecture` | model | Creates or refreshes `AGENTS.md` and the `living` architecture overview. |
| `change-ledger` | model | Appends a dated changelog entry carrying author and an explicit Why. |
| `docs-audit` | user | Sweeps a repo for the failure classes below and reports what to fix. |

## Worked example

`dafrimer/homelab-ops` is the reference retrofit: a real GitOps repository brought under this contract in one pass. The repository is private, so the numbers below are the evidence rather than a link.

It produced an `AGENTS.md` naming every top-level directory, an architecture overview verified against the actual bootstrap manifests, six ADRs reconstructing platform rationale that had never been written down, six stories, and a changelog entry — 17 files, docs only.

Applying the kit also caught two factual errors the repository had carried for months: the README claimed the cluster synced manually when all five bootstrap root objects set `syncPolicy.automated` with prune and selfHeal, and the CI runbook said "Four workflows" directly above a six-row table. Both were found by writing a `verify:` command and running it, which is the mechanism rather than the luck.

## Why this exists

From `docs/research/2026-09-11-workspace-doc-audit.md`, an audit of 22 top-level project folders:

- **9%** had any agent instructions file (`CLAUDE.md` or `AGENTS.md`) — 2 of 22.
- **0%** had any decision record. Across two years and 22 projects, not one architectural decision has a recorded rationale.

The audit named twelve recurring failures. Ten have an artifact here:

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

The two without one are deliberate. **AD-HOC-WORK** — a cross-project backlog in an unversioned Obsidian vault, untouched for seven months — is a habit, and no file in a repository reaches it. **CONFIG-DRIFT** — five `.claude/settings.local.json` allow-lists using two incompatible matcher grammars — is harness configuration, not documentation; `docs/decisions/0005-contract-governs-docs-only.md` is why this kit does not reach across that line.

The audit's one exemplar — a changelog that was dated, attributed, and carried explicit `### Why` sections — is the shape `templates/docs/changelog/` copies.

## License

MIT. See `LICENSE`.
