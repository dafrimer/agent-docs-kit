---
name: change-ledger
description: Append a dated entry to docs/changelog/ when something ships. Use when a feature or fix lands, when a migration or dependency upgrade completes, when a config or infrastructure change alters behaviour a future reader will hit, when a change is reverted, or when asked what changed and why.
---

# Change ledger

`docs/changelog/` is a `ledger`: append-only. Entries are never rewritten, reordered, or tidied. An entry that turned out wrong is corrected by a **later dated entry that supersedes it** — the wrong old record is the reason the current one exists.

The model for this is the one good artifact the audit found (`docs/research/2026-09-11-workspace-doc-audit.md`, "The one exemplar"): dated, attributed, with an explicit `### Why`. Everything below is that shape, made mandatory.

## 1. Decide whether a change is ledger-worthy

Write an entry when someone arriving in three months would be confused without it:

- behaviour changed, for a user or an operator
- a migration, cutover, upgrade, or rollback completed
- a fix landed whose cause is not obvious from the diff
- a revert

Do not write an entry for: work in progress (that is a story — see the **user-story** skill), formatting, or a rename with no behavioural effect.

*Done when:* you can name, in one sentence, the behaviour that is different now. If you cannot, there is no entry to write.

## 2. Locate the changelog and its layout

Find `docs/changelog/`. If absent, create it with a `README.md` that states which layout this repo uses:

- **one file per entry** — `docs/changelog/<YYYY-MM-DD>-<slug>.md`, or
- **one appended file** — `docs/changelog/CHANGELOG.md`, newest entry first.

Pick one per repo and never mix them. If a changelog already exists, **match its existing heading shape exactly** rather than importing the shape below over the top of it.

*Done when:* you know the target file path and the heading shape already in use.

## 3. Append a new entry — never edit an existing one

Frontmatter (per file; `class: ledger` requires `date`):

```yaml
---
id: <entry-slug>
class: ledger
status: accepted
owner: "@handle"
updated: <YYYY-MM-DD>
date: <YYYY-MM-DD>
---
```

Entry body, newest first:

```markdown
## <YYYY-MM-DD> — <short title>
**Author:** @<handle>

### What changed
<The concrete change. Reference files by path and line; do not paste config.>

### Why
<The reason this was done now. Not a restatement of what changed.>

### Impact
<Who or what is affected, and anything an operator must do differently.>

### Verification
<The command run, or the observation made, that proves it works.>
```

All four sections are required, in that order, with the author line directly under the heading. An entry without `### Verification` is a claim, not a record.

Keep the entry pointing at truth rather than copying it: reference `bootstrap/smarthome-applicationset.yaml:14`, do not paste the manifest. The audit found one manifest living in three places (§5) and a duplicate table already disagreeing with its source.

**Never write a credential value into an entry** — not a token, key, password, or account number. Reference where it lives; omit the value. The audit found a Zigbee `network_key` sitting in an agent memory file.

*Done when:* a new entry exists at the top of the file (or as a new file), carrying date, author, and all four sections; no previously existing entry was modified.

## 4. Placeholder guard

**No placeholder text survives into a committed entry.** Before writing, scan your entry for:

- literal `YYYY-MM-DD` anywhere — including inside example paths and backup filenames
- `<angle-bracket>` slots
- `TODO`, `TBD`, `_No entries yet._`, or any other scaffold line

Both failures are real. The audit found `HomeLab/homeassistant-changelog.md` shipping literal `YYYY-MM-DD` placeholders inside its backup paths — a reader following that path finds nothing. It found `learned-fixes.md` still printing `_No entries yet._` above six real entries, so the file contradicted itself at the top.

If a value is genuinely unknown, say so in prose and name who knows it. Do not leave the slot.

*Done when:* the entry contains no `YYYY-MM-DD`, no `<…>` slot, and no "no entries yet" line; every date is a real date.

## 5. Changelog records the change; the ADR records the decision

The split:

- **Changelog** — *what* changed and *why it was done now*. Bounded. A few sentences per section.
- **ADR** (`docs/decisions/NNNN-slug.md`) — the *decision*: context, options considered, what was chosen, and the consequences accepted.

If you find yourself weighing alternatives at length in `### Why` — "we considered X, but Y, so we picked Z" — **stop: that is an ADR.** Say so explicitly, write the decision record (see the **decision-record** skill), and reduce the changelog `### Why` to one sentence plus a link to it.

This split is the fix for the audit's headline finding: 0 of 22 folders had a single recorded rationale (§6). ArgoCD, Longhorn, MetalLB, and Traefik were all adopted with no recorded why, and one repo pinned two mutually incompatible torch stacks under a rule — "do not loosen a constraint to resolve an installation failure" — whose reason nobody can now reconstruct. A trade-off buried in a changelog entry is a trade-off nobody will find.

*Done when:* the entry's `### Why` states the reason and nothing longer; any real trade-off lives in an ADR and is linked.

## 6. Corrections

To correct a shipped entry, append a new entry describing the correction, and add `superseded_by: <new-entry-id>` to the old file's frontmatter with `status: superseded` (or `status: reverted` for a revert). That frontmatter flip is the only permitted edit to a published entry — the prose body stays as it was written.

*Done when:* the old entry is marked and still readable in full, and the new entry explains what was wrong.
