---
id: doc-classes
class: living
status: current
owner: "@dafrimer"
updated: 2026-09-11
verify: "Every file under docs/ has frontmatter whose `class` is one of living|ledger|flow — run scripts/lint-docs.mjs"
---

# Doc classes

Every document in this system belongs to exactly one class. The class is not a topic — it is the **update rule**. Topic tells you what a doc is about; class tells you what you are allowed to do to it, and that is the property that actually decays when it is left undefined.

This model comes from an audit of 22 real project folders (`docs/research/2026-09-11-workspace-doc-audit.md`). Every failure found there was a document whose update rule had never been stated.

## The three classes

### `living` — edit in place, never stale

The current truth about how something is. There is exactly one, it is rewritten whenever reality changes, and history lives in git rather than in the file.

- **Examples:** `CONTEXT.md` (glossary), `docs/architecture/overview.md`
- **Never:** append a dated entry to a living doc. That is a ledger, and mixing them produces a 46KB file with two competing "current" markers.
- **Required frontmatter:** `verify` — a command or concrete check that proves the doc is still true.

The `verify` field is the anti-stale lever. A living doc that cannot be checked will drift, and the audit found exactly that: a README claiming manual sync against an ApplicationSet doing automated prune + selfHeal. A `verify` of `grep syncPolicy bootstrap/*.yaml` would have caught it in one command.

### `ledger` — append-only, never rewritten

An immutable record of something that happened or was decided. Correct a ledger entry by adding a new one that supersedes it, never by editing the original.

- **Examples:** `docs/decisions/NNNN-*.md` (ADRs), `docs/changelog/*.md`
- **Never:** delete or silently edit an entry. The wrong old decision is the *reason* the current one exists.
- **Required frontmatter:** `date`. Optional `supersedes` / `superseded_by`.

### `flow` — moves through states, then archives

A unit of work with a lifecycle. It is mutable while active and leaves the live folder when it ends.

- **Examples:** `docs/stories/*.md`
- **States:** `backlog` → `active` → `done`, plus `blocked` and `dropped`.
- **Never:** leave a story in `active` once work stops. Either `blocked` with a reason, or `dropped` with a reason.
- **Archive:** `done` and `dropped` stories move to `docs/stories/done/`.

`dropped` is load-bearing. The audit found a 707-line plan at 5 of 98 checkboxes and a spec reading `Status: Proposed` months after it merged. Neither was abandoned on purpose — abandonment was simply never an available, recordable state. Making it one is what stops a plan from rotting in place.

## Frontmatter contract

Every doc carries:

```yaml
---
id: <stable-slug>          # never changes, even if the title does
class: living|ledger|flow
status: <see below>
owner: "@handle"           # who is accountable; never blank
updated: YYYY-MM-DD
---
```

| Class | Valid `status` | Additional required |
| --- | --- | --- |
| `living` | `current` | `verify:` |
| `ledger` | `accepted`, `superseded`, `reverted` | `date:` |
| `flow` | `backlog`, `active`, `blocked`, `done`, `dropped` | — |

`owner` is never blank. The audit found zero documents in 22 folders carrying a date, version, or owner — so nothing was anyone's job, and nothing got fixed.

## Three rules that override everything

1. **Nothing durable is gitignored.** Two of the audited repos hid their only real planning doc behind `.gitignore`; both rotted unreviewed. If a doc is worth writing, it is worth committing.
2. **Docs point at config; they never copy it.** The audit found one manifest stored in three places, and a duplicate table that already disagreed with its source at different precision. Reference the file and the line; let the environment stay the source of truth.
3. **One canonical path, thin per-harness pointers.** The best architecture doc in the audit lived at `.github/copilot/skills/` — a path Claude Code and OMP never load. Canonical docs live in `docs/`; each harness gets a pointer file, never a copy.
