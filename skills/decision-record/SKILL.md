---
name: decision-record
description: Record an architectural decision as a numbered ADR under docs/decisions/. Use when a choice between real alternatives was just made or is being made in conversation — a database, protocol, deployment model, library, auth model, or directory layout — when a diff introduces a dependency or pattern whose rationale is not written down, when someone asks "why is it done this way" and nothing in the repo answers, or when a shipped decision is being reversed or replaced and the old record needs superseding.
---

# Decision record

An ADR is a `ledger` doc: append-only, never rewritten. It exists so a future agent can tell a deliberate choice from an accident.

**Why this skill exists.** An audit of 22 project folders found **0 decision records — 0%** (`docs/research/2026-09-11-workspace-doc-audit.md`, Coverage). ArgoCD, Longhorn, MetalLB, Traefik and external-secrets were all adopted with no rationale anywhere. One folder pins two mutually incompatible torch stacks and states the rule *"Do not loosen a constraint to resolve an installation failure"* with no recorded why — a rule a future agent cannot honour. The workspace contained exactly one genuine Decision/Rationale/Alternatives document, `homelab-mcp/research.md`, and it was buried in a shipped feature directory, linked from nothing. **Being written was not enough; it had to be reachable.** So every ADR lands in `docs/decisions/` and is linked from the architecture overview.

## Step 1 — Detect the decision

Trigger on either signal:

- **Conversation:** an option was chosen over a named other option ("we'll use X rather than Y", "let's not do Z because…").
- **Diff:** a new dependency, service, protocol, storage engine, or top-level directory appears; or an existing one is swapped out.

*Complete when:* you can state the decision in one sentence of the form "We will \<do X\> instead of \<Y\>".

## Step 2 — Apply the three-part gate — HARD STOP

A decision earns an ADR **only if all three hold**:

1. **Hard to reverse.** Undoing it means a migration, a rewrite, or coordinated change across callers — not a one-line edit.
2. **Surprising without context.** A competent newcomer reading the code would ask "why this?" or would plausibly "fix" it back.
3. **A real trade-off with genuine alternatives.** At least one other option was actually viable, with its own costs.

**If any one of the three fails, do not write an ADR. Stop.** Say which part failed and move on. Do not write a weaker doc, do not write it "just in case", do not park it in `docs/decisions/` as a draft. A decisions folder that accepts everything is noise, and noise is why nobody reads the folder that finally contains the one record that mattered.

Fails the gate, for reference: formatting and lint settings; a library with no real competitor; anything reversible by editing one file; restating a framework default; a task that is actually work (that is a `flow` story, see `docs/stories/`).

*Complete when:* you have explicitly answered all three parts, or you have stopped and said which part failed.

## Step 3 — Allocate the next number

IDs are zero-padded and monotonic, never reused, never renumbered:

```sh
ls docs/decisions/ | grep -E '^[0-9]{4}-' | sort | tail -1
```

Next integer after that, four digits. First record is `0001`. Filename: `docs/decisions/NNNN-<kebab-slug>.md`; `id:` matches the filename stem.

*Complete when:* the file exists at a number no other file uses.

## Step 4 — Write the record

Frontmatter (`ledger` class — `date:` required, `verify:` is not):

```yaml
---
id: NNNN-<kebab-slug>
class: ledger
status: accepted
owner: "@<handle>"
updated: <YYYY-MM-DD>
date: <YYYY-MM-DD>
---
```

`status` is one of `accepted`, `superseded`, `reverted`. `owner` is never blank — the audit found zero documents across 22 folders carrying a date, version or owner, so nothing was anyone's job.

Four required sections:

- **Context** — the forces at the time: constraints, hardware, deadlines, what was already in place. Write it in past tense and do not update it later; a stale Context is the *point* of a ledger.
- **Decision** — one sentence, active voice: "We will …".
- **Alternatives considered** — each genuine option, and the specific reason it lost. "We considered nothing else" means Step 2 was answered wrong; go back.
- **Consequences** — split into **Benefits** and **Costs**. **Costs must be non-empty.** A decision with no downside was not a trade-off and did not pass the gate. Name what got harder, slower, more expensive or more locked-in.

Point at config, never copy it. Reference the file and line that encodes the decision (`bootstrap/smarthome-applicationset.yaml:12`), rather than pasting the manifest. The audit found one manifest stored in three places, and a duplicated table that already disagreed with its source at different precision.

Record no credential values — reference the secret's location, never its contents.

*Complete when:* all four sections are present, Costs is non-empty, and every claim about config carries a path.

## Step 5 — Make it reachable

Link the new ADR from `docs/architecture/overview.md` — specifically from the dependency or component the decision governs. An unlinked ADR repeats the `homelab-mcp/research.md` failure exactly.

*Complete when:* the overview links the file, and the ADR links back to the code or config it governs.

## Step 6 — Superseding — never edit a shipped ADR

A merged ADR is immutable. Reality changed? Write a **new** record.

1. New ADR: next number, `supersedes: NNNN-<old-slug>` in frontmatter, and a Context explaining what changed since the original.
2. Old ADR: the **only** permitted edits are `status:` → `superseded` (or `reverted`) and adding `superseded_by: MMMM-<new-slug>`. Leave every word of the body alone.

Never delete an entry and never silently rewrite one. The wrong old decision is the reason the current one exists — deleting it invites someone to make it again.

*Complete when:* both files point at each other and the old record's body is byte-unchanged apart from those two frontmatter fields.
