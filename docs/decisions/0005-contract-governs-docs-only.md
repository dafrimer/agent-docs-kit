---
id: adr-0005-contract-governs-docs-only
class: ledger
status: accepted
owner: "@dafrimer"
updated: 2026-09-11
date: 2026-09-11
---

# 0005. The frontmatter contract governs `docs/` only

## Context

The first run of `scripts/lint-docs.mjs` over the kit's own tree reported 32 errors, and every one of them was bogus. They were skill bodies under `skills/`, which carry the skill frontmatter schema of `name` and `description` rather than the doc contract, and template files under `templates/`, which carry unfilled angle-bracket slots and literal date placeholders on purpose. The repository's front-door `README.md` was flagged for the same reason: it is a front door, not a classed document.

A linter whose first output is 32 false positives does not get used. It also teaches the wrong lesson — that the contract is noise to be silenced — which is exactly the opposite of what a machine-checkable contract is for.

The underlying confusion is scope. The contract in `docs/architecture/doc-classes.md` describes documents that make claims about a system and therefore need an update rule. A skill body is instructions to an agent, a template is a shape to be copied, and a project README is an entry point. None of the three is that kind of document.

## Decision

We will scope the frontmatter contract to files under a `docs/` path: `lint-docs.mjs` errors on missing frontmatter only for such files, skips `templates/` and `skills/` when walking into a tree, and tolerates placeholder owners and dates when `templates/` is named explicitly on the command line.

## Alternatives considered

### Apply the contract to every Markdown file in the repo

Maximum coverage, one rule, nothing to remember. Rejected because it is wrong on the merits, not merely noisy: a front-door README genuinely has no class, and a template's placeholder owner handle is correct content, not an unfilled field. Enforcing the contract there means either adding meaningless frontmatter to files that do not want it, or maintaining an ignore list that grows with every new kind of file.

### Per-file opt-out markers

A magic comment or a `lint: skip` frontmatter key on each exempt file. Rejected because it puts the exemption in the file rather than in the rule, so the reason is restated 30-odd times and drifts. It also fails on templates, where the point is that the file is a copy source: the opt-out marker would be copied into every real document made from it.

### Do nothing — accept the false positives

Leave the linter noisy and tell people which errors to ignore. Rejected because a check with known-ignorable output is not a check. Once a reader is trained to skim past errors, the real one is skimmed past too.

## Consequences

### Accepting

- `node scripts/lint-docs.mjs docs` is meaningful in CI: any error is a real error, so the build can fail on it.
- Templates stay authentic. They keep their angle-bracket slots and placeholder owners, which is what makes an unfilled slot obvious on sight in a copied file.
- Skills keep their own frontmatter schema without a second, conflicting one layered on top.
- `node scripts/lint-docs.mjs templates` still works as a deliberate, placeholder-tolerant mode for checking template structure.

### Costs

- Two lint modes to understand — walking a tree versus naming a directory explicitly — and the difference is invisible from the command line unless you know it exists.
- A document placed outside `docs/` escapes the contract silently. There is no error, no warning, and no sign that the file was skipped, so a misfiled architecture note is simply unchecked.
- The `docs/` path becomes load-bearing: reorganising a repo so that classed documents live elsewhere quietly disables enforcement.
- `templates/` and `skills/` are matched by directory name anywhere in a tree, so an unrelated directory that happens to be called `templates` is skipped too.
