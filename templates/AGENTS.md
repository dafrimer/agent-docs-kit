---
id: agents
class: living
status: current
owner: "@<handle>"
updated: <YYYY-MM-DD>
verify: "for d in */; do grep -q \"$d\" AGENTS.md || echo MISSING $d; done"
---

<!-- POINTER INDEX, NOT A KNOWLEDGE DUMP. This file is loaded on every session,
     so every line is paid for on every turn. Bug logs go to docs/changelog/,
     rationale to docs/decisions/, work state to docs/stories/. The audit behind
     this template found a 46.4KB / 803-line CLAUDE.md that was ~540 lines of bug
     log carrying two competing "current" date markers. Cap: 60 lines. -->

# <repo-name>

<One sentence: what this repo does and who runs it.>

## Map

| Path | What lives there |
| --- | --- |
| `<dir>/` | <one line> |
| `<dir>/` | <one line> |
| `docs/` | Canonical documentation. Start at `docs/README.md`. |

Every top-level directory appears above. An omitted directory is a bug — the audited `homelab-ops/README.md` omitted `smarthome/` entirely.

## Docs

- `CONTEXT.md` — glossary. Read when a term here is ambiguous. Definitions only.
- `docs/architecture/overview.md` — repo map, entry points, data flow.
- `docs/decisions/` — why a choice was made. Read before changing or arguing with one.
- `docs/stories/` — current work state. Branch names are not a work tracker.
- `docs/changelog/` — what changed, when, by whom, and why.

## Commands

```sh
<build>
<test>
<run>
```

Copied from `<file>:<line>`. If a command drifts, fix it there first, then here.

## Doc classes

Every doc declares a `class` in frontmatter, which states its update rule: `living` is edited in place and carries a `verify:` check, `ledger` is append-only and carries a `date:`, `flow` moves through states and archives into a `done/` folder. Never append a dated entry to a living doc and never rewrite a ledger entry — that mix is exactly what produces an unloadable file with two competing "current" markers.

## Per-harness pointers

Canonical docs live in `docs/`. Every other harness path gets a one-line pointer, never a copy:

- `CLAUDE.md` → `See AGENTS.md.`
- `.github/copilot/README.md` → `See ../../AGENTS.md.`

The audit found a repo's best architecture doc stranded at `.github/copilot/skills/<name>/SKILL.md`, a path Claude Code and OMP never load. A copy on a second path becomes a second truth; a pointer cannot.
