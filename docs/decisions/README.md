---
id: decisions-readme
class: living
status: current
updated: 2026-09-30
verify: "node bin/agent-docs-kit.mjs lint docs exits 0, and the Index table below has one row per docs/decisions/[0-9][0-9][0-9][0-9]-*.md file"
---

# Decisions

Architecture Decision Records for the agent-docs-kit itself. One file per decision, append-only, never rewritten.

These are the decisions that produced the kit. They are here because the kit has to use its own system: a repository that ships a decision-record template and has no decision records of its own is not evidence that the template works.

The bar for a record here is the three-part test in `templates/docs/decisions/README.md` — hard to reverse, surprising without context, and a real trade-off with live alternatives. Everything that failed that test went into `docs/changelog/` instead.

## Index

Newest last, matching file order. The title column is the decision, not the topic.

| # | Decision | Status | Date |
| --- | --- | --- | --- |
| [0001](0001-organize-docs-by-mutability.md) | Organize docs by mutability, not by topic | accepted | 2026-09-11 |
| [0002](0002-files-as-story-source-of-truth.md) | Files under `docs/stories/` are the source of truth for work, not GitHub Issues | accepted | 2026-09-11 |
| [0003](0003-worktree-not-gitignore-for-retrofits.md) | Isolate retrofit work in a git worktree, never in `.gitignore` | accepted | 2026-09-11 |
| [0004](0004-require-verify-on-living-docs.md) | Living docs must carry a runnable `verify:` | accepted | 2026-09-11 |
| [0005](0005-contract-governs-docs-only.md) | The frontmatter contract governs `docs/` only | accepted | 2026-09-11 |
| [0006](0006-skills-cli-and-npm-not-plugin.md) | Ship skills through the `skills` CLI and docs through npm, not through bespoke installers or a Paseo plugin | accepted | 2026-09-30 |

`Status` is copied from each record's frontmatter. A superseded row stays in the table; deleting it recreates the hole this folder exists to prevent.

## How these six relate

0001 sets the axis: class is the update rule. 0004 is what makes the `living` class enforceable rather than aspirational, and 0005 is what makes the enforcement usable by bounding where it applies. 0002 and 0003 are the two placement decisions that follow from the same evidence — work state and retrofit output both belong in the repository, tracked, because every audited artifact that lived outside a tracked working tree rotted. 0006 is the first decision about the kit's own distribution rather than its contents, and it applies rule 2 — point at config, never copy it — to the kit itself.

## Numbering and superseding

- Filename is `NNNN-kebab-slug.md`, four digits, monotonic. Take the highest number and add one. Never reuse, never renumber.
- A shipped record is not edited. To change a decision, write the next number with `supersedes:` set, then change only `status:` and add `superseded_by:` in the old file.
- Rolled back rather than replaced means the old record's status becomes `reverted`.

The full rules, and the test for whether something deserves a record at all, are in `templates/docs/decisions/README.md`.
