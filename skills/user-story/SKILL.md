---
name: user-story
description: Record and move work through docs/stories/ as flow-class files. Use when work is about to start on something not yet written down, when a branch or worktree is created for an unrecorded task, when work stalls or is abandoned, or when a story ships and needs closing out.
---

# User story

`docs/stories/` is the work tracker. Each story is a `flow` doc: it moves `backlog` → `active` → `done`, or leaves through `blocked` / `dropped`, and archives to `docs/stories/done/` when it ends.

**The story file is the only place branch intent is recorded.** A branch name is not a plan. The audit (`docs/research/2026-09-11-workspace-doc-audit.md` §10) found branch intent encoded solely in worktree directory names, and 63.5KB across 8 loose `.txt` status files that were never merged into anything. A directory name cannot hold acceptance criteria, a blocker, or a close-out. If work has a branch, a worktree, or a scratch note, it has a story file first.

Stories are committed. Never add `docs/stories/` to `.gitignore` — §7 of the audit found two repos whose only planning artifact was gitignored, and both rotted unreviewed.

## 1. Locate the stories folder

Look for `docs/stories/`. If it is absent, create `docs/stories/` and `docs/stories/done/`, and add `docs/stories/README.md` naming the five states and the archive rule.

*Done when:* `docs/stories/` and `docs/stories/done/` exist on a committed path.

## 2. Decide which of three operations this is

- **New** — the work has no story file. → Step 3.
- **Transition** — a story exists and its `status` no longer matches reality. → Step 4.
- **Close** — the work shipped, or is being abandoned. → Step 5.

Read the existing files before deciding. Two stories for one piece of work is the DUP failure (§5).

*Done when:* you have named the operation and, for transition/close, the exact file path you are editing.

## 3. New story

Allocate a stable `id`: a kebab-case slug that survives a title change, unique within `docs/stories/`. The filename is `<id>.md`.

```yaml
---
id: <story-slug>
class: flow
status: backlog
owner: "@handle"
updated: <YYYY-MM-DD>
---
```

Body:

```markdown
# <Story title>

## Intent
<What changes, for whom, and why now. One paragraph.>

## Acceptance criteria
- [ ] <Observable by a consumer of the system>
- [ ] <Observable by a consumer of the system>

## Notes
<Point at files by path and line. Never paste config in here.>

## Closing
<Empty until step 5.>
```

**Acceptance criteria are mandatory, and they must be observable by a consumer.** "Refactor the sync layer" is not a criterion — nobody outside the code can see it. "`argocd app get smarthome` reports `Synced` without manual intervention" is.

**Hard refusal:** if you cannot state at least one criterion that a consumer could observe, do not create the file. Say that the work is not yet specified enough to be a story, and ask for the observable outcome. A story with no acceptance criteria is the ORPHAN-PLAN failure (§3) in its first hour — the 707-line plan at 5 of 98 checkboxes had no definition of done either.

Set `status: active` only once work actually begins; otherwise leave it `backlog`.

*Done when:* the file exists with a unique `id`, `class: flow`, a valid `status`, a non-blank `owner`, today's date in `updated`, and at least one consumer-observable acceptance criterion.

## 4. Transition

Change `status` to the state that is now true, and set `updated` to today. Never leave a story in `active` once work has stopped.

| New status | Also required |
| --- | --- |
| `active` | nothing beyond `updated` |
| `blocked` | a `## Blocker` section: what is blocking, and the concrete event that would unblock it |
| `dropped` | a `## Dropped` section: why it was abandoned, and what supersedes it if anything |

`blocked` without a named unblocking event is just `active` with better manners — it will rot the same way. Write the event.

`dropped` is a legitimate ending. §3 of the audit found specs reading `Status: Proposed (PR for review)` months after the PRs merged, because abandonment was never a recordable state. Record it.

*Done when:* `status` and `updated` both reflect today's reality, and `blocked`/`dropped` carry their required section. A `dropped` story then follows step 5's archive move.

## 5. Close

Fill `## Closing` before moving the file:

```markdown
## Closing
**Closed:** <YYYY-MM-DD>

**Shipped:** <what actually exists now>

**Diverged:** <where the result differs from the plan, and why — or "none">
```

Then set `status: done` (or `dropped`), set `updated`, and move the file to `docs/stories/done/<id>.md`. The live folder holds only open work, so its length is a real backlog count.

Tick the acceptance criteria that were met. A criterion that was never met is a **Diverged** line, not a silent deletion.

If the story shipped a change a future reader would need explained, add a changelog entry — see the **change-ledger** skill. The story records intent; the changelog records what shipped.

*Done when:* `## Closing` names a date, what shipped, and divergence; the file lives under `docs/stories/done/`; and `docs/stories/` contains no file whose `status` is `done` or `dropped`.

## Placeholders

`<angle-bracket>` text is a slot, not content. Never commit a story still carrying one — the audit caught literal `YYYY-MM-DD` surviving into a real changelog (§11). Every placeholder in a committed story file is replaced or the section is deleted.
