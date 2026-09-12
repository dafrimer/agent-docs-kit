---
id: adr-0001-organize-docs-by-mutability
class: ledger
status: accepted
owner: "@dafrimer"
updated: 2026-09-11
date: 2026-09-11
---

# 0001. Organize docs by mutability, not by topic

## Context

An audit of 22 top-level project folders (`docs/research/2026-09-11-workspace-doc-audit.md`) found no shared rule anywhere for what a reader is permitted to do to a document. Every folder had topics — architecture notes, plans, logs, READMEs — and none had an update rule. The failures that followed all had the same shape.

One agent instructions file had grown to 46.4KB by mixing a running bug log into a document also being read as current truth, and carried two competing "current" date markers as a result. A 707-line migration plan sat at 5 of 98 checkboxes with no way to say it had been overtaken. A spec still read `Status: Proposed` months after the PRs it described had merged. None of these is a topic error. In each case the author appended to something that should have been rewritten, or rewrote something that should have been appended to, because nothing ever said which.

A kit that hands agents templates without stating the update rule reproduces exactly this, faster.

## Decision

We will class every document as `living`, `ledger`, or `flow`, declared in frontmatter, where the class is the update rule: `living` is rewritten in place and must always be true, `ledger` is appended to and never rewritten, `flow` moves through states and is archived when it ends. Class is orthogonal to topic and is the primary organizing axis of `docs/`.

## Alternatives considered

### Organize by topic

The conventional layout: `architecture/`, `operations/`, `runbooks/`, `planning/`. It is what every audited folder already did, and it tells a reader what a file is about while saying nothing about what they may do to it. A runbook and an incident log sit in the same topic and have opposite update rules; a plan and a glossary are both "planning" and decay in completely different ways. Topic does not constrain the edit, so it cannot prevent the edit that rots the file.

### Organize by audience — human docs versus agent docs

Tempting because agent-facing files are the new thing. It fails on the first real document: a glossary, an architecture overview, and a changelog are each read by both a person and an agent, with identical correctness requirements. Splitting them forces either duplication — which the audit already caught, with one manifest stored in three places and a duplicate table disagreeing with its source — or an arbitrary assignment that the other audience then cannot find.

### Do nothing — no classification

This is the audited status quo, and its cost is measured. It produced the 46.4KB file mixing a bug log with current truth and carrying two competing "current" markers, and it produced plans with no recordable abandoned state. Shipping a kit on top of that means shipping templates whose maintenance rule is still implicit.

## Consequences

### Accepting

- The frontmatter `class` field makes the update rule machine-checkable, which is what `scripts/lint-docs.mjs` enforces.
- Status vocabularies become meaningful per class rather than ad hoc per file: `current` for `living`, `accepted`/`superseded`/`reverted` for `ledger`, the story lifecycle for `flow`.
- `dropped` becomes an available state, so an abandoned plan can be recorded as abandoned instead of rotting at 5%.
- An agent can decide whether to edit a file in place or append to it from frontmatter alone, without reading the body.

### Costs

- A third vocabulary to learn, on top of topic folders and status values. Contributors must internalise that `living`/`ledger`/`flow` is not a category of subject matter.
- Documents that genuinely straddle classes must be split into two files. The 46.4KB learning log is one document to its author and two to this model, and splitting it is real work that nobody asked for.
- Class is declared, not derived, so it can be declared wrongly. A ledger mislabelled `living` passes the linter and then gets rewritten.
- Existing repos with topic-only layouts need a retrofit pass before the linter is useful to them.
