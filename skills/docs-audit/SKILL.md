---
name: docs-audit
description: Sweep a repo's docs for stale, duplicated, abandoned, hidden, and placeholder content, and report what should be pruned.
disable-model-invocation: true
---

# Docs audit

The anti-sediment pass. Docs accumulate; nothing removes them. This sweep finds what has rotted and reports it.

Human-triggered on purpose. A sweep that fires on its own becomes another background process nobody reads, and it would be pruning a tree while the person who knows what matters is not looking.

**This skill never deletes anything.** It produces a report. The human decides.

## What rot looks like

Calibration from the audit this kit was built on (`docs/research/2026-09-11-workspace-doc-audit.md`, 22 project folders):

- A **46.4KB / 803-line** agent instruction file, ~540 lines of which were a bug log, carrying two competing "current" date markers.
- A **707-line plan at 5 of 98 checkboxes** (5.1%), mixing 12 distinct concerns, against a 784-byte README — a 1:39 ratio where the entry point cannot route a reader.
- **Six abandoned worktree copies**, each a full clone of the repo.
- **Byte-identical duplicate manifests**: `migration.txt` and `migration.yaml`, 646 bytes each, both a third copy of a manifest already embedded in a spec.
- **Zero decision records** across 22 folders and two years.

None of that is exotic. It is what a repo looks like when no pass ever removes anything.

## Scope

Everything under `docs/`, plus `AGENTS.md`, `CONTEXT.md`, and any root-level `plan.md` / `TODO.md` / `notes.md`. Include gitignored files in the *inventory* — check 6 exists precisely to find them.

## The eight checks

### 1. Inventory

For every doc in scope, record: path, `class`, `status`, `owner`, `updated`, line count, and age. Age is the gap between `updated` and the last commit that touched the file:

```sh
git log -1 --format=%as -- <file>
```

A doc whose `updated` is far behind its last commit was edited without maintaining its own frontmatter — a soft staleness signal on its own.

*Done when:* every file in scope appears in the table exactly once, with no blank cells other than genuinely optional fields.

### 2. Missing frontmatter

Flag any doc with: no frontmatter block, no `class`, no `owner` (or a blank / placeholder owner), no `updated`, or — for `living` docs — no `verify:`.

*Done when:* each flagged doc has a named defect, and every unflagged doc has been confirmed to carry all required fields for its class.

### 3. Run every `verify:`

For each `living` doc, execute its `verify:` command and record pass/fail. A failing `verify:` means the doc asserts something the repo no longer does — that is a stale doc, not a broken command, until proven otherwise.

The audit's canonical case: a README claiming Ubuntu 16.04 and "manually sync" against a manifest setting `syncPolicy.automated` with prune and selfHeal. One `grep` would have caught it.

*Done when:* every living doc has a recorded pass, fail, or "not runnable" — and each "not runnable" names why, because an unrunnable `verify:` is itself a check-2 defect.

### 4. Stuck flow docs

Flag any `flow` doc in `status: active` whose file has not been touched in **14 days** (adjust per repo cadence; state the threshold you used). For each, the resolution is forced — it does not stay `active`:

- `blocked` with a reason and what would unblock it, or
- `dropped` with a reason, moved to `docs/stories/done/`.

`dropped` is the load-bearing state. The 707-line plan at 5 of 98 checkboxes was never abandoned on purpose; abandonment was simply never a recordable option.

*Done when:* no doc remains `active` past the threshold without either a new status and reason, or an explicit human decision recorded in the report to leave it.

### 5. Duplication and copied config

Two findings:

- **Same fact in two docs.** Compare numbers, command chains, directory listings, and manifests across docs. Report the duplicate pairs and which one should be the source. The audit found the same lint chain restated in three files, and a duplicate stats table that already disagreed with its source at different precision (0.168 vs 0.17) — proof the copy had already drifted.
- **Config copied instead of referenced.** Any doc containing a config block, manifest body, env table, or port list that exists in a real file. The fix is a path plus a line number, never a paste.

*Done when:* every duplicate pair names a proposed canonical source, and every copied config block names the file it should reference instead. Never report a credential value you find — report only the path and line.

### 6. Durable docs hidden by `.gitignore`

```sh
git check-ignore -v AGENTS.md CONTEXT.md docs/ <other-doc-paths>
```

Any hit is a finding. Also read `.gitignore` whole and flag broad patterns that swallow agent memory: `.claude/`, `.local/`, `plan.md`, `notes/`.

Both audited repos that did this rotted unreviewed — one `.gitignore` was 11 bytes, a blank line and `plan.md`, hiding the repo's only planning artifact.

*Done when:* `check-ignore` has been run against every path in the inventory, and each hit is reported with the offending pattern and a narrower replacement (`.local/cache/`, not `.local/`).

### 7. Placeholder residue

Grep committed docs for survivors:

- `TODO`, `TBD`, `FIXME` in prose (not in code samples)
- `_No entries yet._` above actual entries
- unfilled `<angle-bracket>` slots
- a literal `YYYY-MM-DD` where a real date belongs

All four are real audit findings, including a changelog shipped with literal `YYYY-MM-DD` inside backup paths and a learning log printing `_No entries yet._` above six live entries.

*Done when:* every match is reported with file and line, classified as either "fill in" or "delete the section".

### 8. Monolith risk

Flag any doc over **~400 lines**, and any doc mixing classes — dated entries inside a `living` doc, current-state prose inside a `ledger`, or a checklist inside either.

A doc that mixes classes has no single update rule, which is exactly how a file reaches 803 lines with two competing "current" markers. The split is by mutability: current truth stays, dated entries move to `docs/changelog/`, work items move to `docs/stories/`, rationale moves to `docs/decisions/`.

*Done when:* each oversized or mixed doc has a proposed split naming the destination class and path for every extracted section.

## Output

A report, printed for the human. Structure:

1. **Inventory table** — path, class, status, owner, updated, lines, age.
2. **Findings** — grouped by check number, each with file, line where applicable, and the proposed fix.
3. **Proposed deletions** — listed separately and never acted on. This is the part the human reads first and the part you must not pre-empt.

Offer to save the report as a dated ledger doc under `docs/research/`. Do not save it unasked — an unread audit report is itself sediment, and check 8 will find it next time.
