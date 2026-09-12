---
id: stories-readme
class: living
status: current
owner: "@dafrimer"
updated: 2026-09-11
verify: "grep -l 'status: done' docs/stories/*.md returns nothing and grep -l 'status: dropped' docs/stories/*.md returns nothing — closed stories live in docs/stories/done/"
---

# Stories

Work on the agent-docs-kit itself. One file per unit of work, `flow` class: mutable while alive, archived to `docs/stories/done/` when it ends.

These files are the source of truth for what is planned, in progress and finished here. There is no issue tracker behind them — see `docs/decisions/0002-files-as-story-source-of-truth.md` for why, and for the notification and cross-repo query this costs.

Start a story by copying `templates/docs/stories/TEMPLATE.md` into this folder under a kebab-case slug, one file per story. State lives only in the `status:` frontmatter field; never restate it in prose.

## Current stories

| Story | Status | Owner |
| --- | --- | --- |
| [ci-run-lint-docs](ci-run-lint-docs.md) | backlog | @dafrimer |

Archived stories live in [`done/`](done/). `publish-kit-to-github` completed on 2026-09-11 and moved there.

Order is by urgency, not by date. `backlog` means real work that is not yet started.

`ci-run-lint-docs` was blocked on `publish-kit-to-github`; that dependency is now satisfied. It is recorded in the story's `## Notes` rather than in this table, so it has exactly one home.

## States

| State | Meaning | Where the file lives |
| --- | --- | --- |
| `backlog` | Agreed as worth doing. Nobody is on it. | `docs/stories/` |
| `active` | Being worked right now. | `docs/stories/` |
| `blocked` | Work stopped on something outside this story. | `docs/stories/` |
| `done` | Acceptance criteria met. | `docs/stories/done/` |
| `dropped` | Deliberately abandoned. | `docs/stories/done/` |

A story never sits in `active` once work stops. It moves the same day: `blocked` with the blocker named, `done` with `## Closing` filled in, or `dropped` with the reason recorded. The full lifecycle, the legal transitions, and why `dropped` is first-class are in `templates/docs/stories/README.md`.

## Keeping this index honest

This table is a copy of state that lives in the story files, which makes it the kind of duplicate the audit warned about. It earns its place only while it is short and only while it is updated in the same commit as the file it mirrors. The `verify` in this doc's frontmatter checks the harder half — that no closed story is still sitting in this folder — because that is the failure that actually hides work.
