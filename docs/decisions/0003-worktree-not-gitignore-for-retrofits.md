---
id: adr-0003-worktree-not-gitignore-for-retrofits
class: ledger
status: accepted
owner: "@dafrimer"
updated: 2026-09-11
date: 2026-09-11
---

# 0003. Isolate retrofit work in a git worktree, never in `.gitignore`

## Context

Retrofitting this kit into an existing repository means writing a batch of new documents into a tree that has in-flight work. The first suggestion on the table was to gitignore the retrofit docs until they were ready, keeping them out of the way of the branch being worked on.

The audit had already measured that pattern. `shire-homeassistant/.gitignore` is 11 bytes: a blank line and `plan.md`. That single ignored file was the repository's only planning artifact, and it was invisible to review, to CI, to teammates, and to any fresh clone. `homelab-ops/.gitignore` hides the entire agent memory directory, so the accumulated learning log — the most-written document in that repo — reaches no other checkout. Both files rotted precisely because ignoring them removed every mechanism that would have caught them rotting.

The doc-classes contract already states the rule directly: nothing durable is gitignored (`docs/architecture/doc-classes.md`, "Three rules that override everything"). A retrofit that ships its own docs via `.gitignore` would violate the contract it is installing.

## Decision

We will isolate retrofit work in a dedicated git worktree on its own branch, commit the documents there normally, and merge through review. Retrofit output is never added to `.gitignore`.

## Alternatives considered

### Gitignore the retrofit docs until they are ready

The original suggestion. Rejected on direct evidence: this is the exact mechanism behind two of the audit's worst findings, an 11-byte `.gitignore` hiding a repo's only plan and an ignore rule hiding all agent memory from CI, teammates and worktrees. "Until they are ready" has no enforcement, so in practice it means permanently. An ignored document has no reviewer, no diff, and no way to be discovered stale.

### A separate repository for the retrofitted docs

Clean isolation, no interference with the target repo at all. Rejected because it splits documents from the code they describe. The docs then have their own clone, their own staleness clock, and no diff that ties a doc change to the code change that invalidated it — which is the coupling that makes a `verify` field enforceable in the first place.

### Commit straight to the working branch

Simplest possible path, and it keeps everything visible. Rejected because it conflates a bulk documentation import with whatever feature work is in flight on that branch, producing a diff nobody can review as one thing and a revert that cannot separate the two.

## Consequences

### Accepting

- Retrofit documents are tracked from the first commit, so they are reviewable, diffable, and visible to CI and to every other checkout.
- The target repo's working branch is untouched while the retrofit is written.
- The retrofit lands as one reviewable merge and can be reverted as one unit.
- The kit's own contract — nothing durable is gitignored — holds for the kit's own output.

### Costs

- A worktree is another checkout to remember. The audit observed stale worktrees in practice, so the isolation mechanism has its own decay mode.
- Contributors have to know `git worktree`, which is less familiar than a branch checkout and easier to leave half-cleaned-up.
- Retrofit docs are public in the branch before they are finished, so half-written documents are visible to anyone browsing branches.
- Two checkouts of the same repo on disk means twice the working tree, and edits made in the wrong one are a real and confusing failure.
