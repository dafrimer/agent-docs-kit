---
id: adr-0002-files-as-story-source-of-truth
class: ledger
status: accepted
owner: "@dafrimer"
updated: 2026-09-11
date: 2026-09-11
---

# 0002. Files under `docs/stories/` are the source of truth for work, not GitHub Issues

## Context

The kit needs one place where a unit of work lives. The audit (`docs/research/2026-09-11-workspace-doc-audit.md`) establishes what happens when that place is outside the repo. The real cross-project backlog was not in any repo at all: it lived in an unversioned Obsidian vault, where checkboxes had gone untouched for seven months, and one of the projects tracked there had no repository behind it whatsoever. The backlog was not abandoned on purpose — it simply sat somewhere that no working session ever opened, so no session ever updated it.

The same audit found the in-repo planning artifacts that agents did reach were the ones that got edited, even when they were hidden or malformed. Proximity to the working tree, not tooling quality, decided which documents stayed alive.

Agents are the primary writers here. An agent editing a file needs no credentials, produces a reviewable diff, and works inside whatever worktree the session happens to be in.

## Decision

We will treat Markdown files under `docs/stories/` as the authoritative record of planned, active and closed work. Story state lives in the `status:` frontmatter field of the file, and no external tracker is authoritative for it.

## Alternatives considered

### GitHub Issues

The default answer, and it has real advantages this loses: notifications, cross-repo query, a project board, and assignment. It was rejected because it needs authentication every session and because story state is not present in a fresh clone. An agent that clones the repo and reads `docs/` sees no work at all — which is precisely the failure that rotted the Obsidian backlog to seven months stale. The tracker being good does not help when the working session never reaches it.

### Files mirrored into GitHub Issues by a sync skill

Keep files authoritative and push a mirror out for humans and notifications. Rejected for now, not on principle: a sync is ongoing machinery that has to be maintained, and it introduces a second surface that can disagree with the first. The audit documents what that costs — one manifest stored in three places, and a duplicate table that already disagreed with its source. If notifications become the blocking gap, this is the alternative to revisit with a superseding record.

### Do nothing — leave work tracking undefined

Every project picks its own, which is the audited status quo: a vault for some projects, a 707-line plan file for another, nothing at all for most. The kit would ship a story template with no statement about where stories live, and the template would be copied into whichever location the session happened to favour.

## Consequences

### Accepting

- Story state travels with the code: a clone, a branch, or a worktree carries the backlog with it.
- Changes to work state go through pull request review like any other diff, and are attributable in `git log`.
- Agents create and transition stories with the same file tools they already use, with no credential path.
- The linter can enforce the story lifecycle, because the lifecycle is a field in a file it reads.

### Costs

- No notifications. Nobody is told a story changed; someone has to look.
- No project board and no cross-repo query. Answering "what is active across every project" means walking repositories and grepping frontmatter.
- No assignment or triage workflow beyond the `owner:` field.
- Stories are only as visible as the repo is, so a repo nobody opens has a backlog nobody reads — a softer version of the failure this decision is avoiding, not an elimination of it.
