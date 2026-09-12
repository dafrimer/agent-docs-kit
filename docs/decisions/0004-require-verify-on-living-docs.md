---
id: adr-0004-require-verify-on-living-docs
class: ledger
status: accepted
owner: "@dafrimer"
updated: 2026-09-11
date: 2026-09-11
---

# 0004. Living docs must carry a runnable `verify:`

## Context

A `living` document claims to state current truth. Nothing in the act of writing it makes that claim testable, and the audit (`docs/research/2026-09-11-workspace-doc-audit.md`) is a catalogue of the claim failing silently.

One README described cluster application sync as a manual step while the ApplicationSet it documented ran automated prune plus selfHeal. The document was not vague, it was confidently wrong, and a single `grep syncPolicy bootstrap/*.yaml` would have exposed it. Another README documented a `servers/procare/` directory and a `deploy/Dockerfile` that do not exist — and CI referenced that same missing Dockerfile, so the documentation and the pipeline were wrong in the same direction at the same time, with nothing comparing either to the tree.

The audit also found zero documents across 22 folders carrying a date, version or owner. There was no signal of staleness available at all, so drift was undetectable rather than merely undetected.

## Decision

We will require every `living` document to carry a non-empty `verify:` field in frontmatter holding a command or concrete check that fails when the document has become untrue, and `scripts/lint-docs.mjs` will error on a `living` doc without one.

## Alternatives considered

### Periodic human review

Schedule a re-read of each living doc. Rejected on the audit's own numbers: 22 folders, accumulated over years, with no evidence of any review pass ever happening. A process that depends on someone choosing to re-read a document that currently looks fine is the process that already failed here. Review also scales with document count, and the check does not.

### Freshness dates alone

Require `updated:` and treat an old date as suspect. This is already required, and it is not sufficient. A date records when a file was touched, not whether it is true; a doc edited yesterday for a typo looks fresh and can still describe a directory that was deleted last quarter. The procare README would have passed a freshness check on the day it was wrong.

### Do nothing — leave `verify` optional

Authors who want a check write one. In practice the docs most in need of a check are the ones written fastest, and an optional field is omitted exactly there. Optional also means the linter cannot say anything, so the contract stops being machine-checkable at the one point where checking has the most value.

## Consequences

### Accepting

- Every living doc ships with an executable definition of its own correctness.
- Drift becomes a CI-detectable event rather than something discovered by a confused reader months later.
- Writing the `verify` forces the author to state what the doc actually asserts, which is a useful discipline even before the check is ever run.
- A doc whose `verify` cannot be written is a signal in itself: it is usually not a living doc, or not a single doc.

### Costs

- Writing a discriminating check is real work, and it is work at the moment the author least wants more of it.
- A weak `verify` that always passes is worse than no `verify`, because it manufactures confidence: the linter goes green, CI goes green, and the document is still wrong.
- The linter can only enforce that the field is non-empty. It cannot judge whether the check discriminates, so this cost cannot be automated away.
- `verify` commands are themselves coupled to paths and tools, so they rot too, and a broken check must be distinguished from a failing one.
