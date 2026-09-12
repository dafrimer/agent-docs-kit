---
id: architecture-<component-slug>
class: living
status: current
owner: "@<handle>"
updated: <YYYY-MM-DD>
verify: "git grep -n '<exported symbol>' -- <src/path> returns the signatures listed under Public interface, and <test command for this component> exits 0"
---

# <Component name>

`<src/path/>` — linked from `docs/architecture/overview.md`.

## Purpose

<Two or three sentences: what this component is responsible for, and what it deliberately is not. If another component could plausibly own this job, say why it does not.>

## Public interface

The seam other code depends on. Everything not listed here is private and may change without a decision record.

| Symbol | Shape | Defined at |
| --- | --- | --- |
| `<name>` | `<signature or type>` | `<file>:<line>` |
| `<name>` | `<signature or type>` | `<file>:<line>` |

Signatures are referenced by `file:line`, never pasted in full. A pasted signature is a second source of truth and drifts silently.

**Consumers:** `<component>`, `<component>`. Changing anything above breaks them.

## Invariants

Rules that must hold for this component to be correct. Each one names where it is enforced, or admits that it is not enforced anywhere.

| Invariant | Why it holds | Enforced at |
| --- | --- | --- |
| `<rule that must always be true>` | `<the consequence if it is violated>` | `<file>:<line>` or **unenforced — convention only** |

An invariant recorded only in a comment or a docstring is one refactor away from gone. The audit behind this template found `seattle-world` stating the rule *"Do not loosen a constraint to resolve an installation failure"* while pinning two mutually incompatible torch stacks, with the reason recorded nowhere — an agent cannot honour a rule whose reason is missing, and the safest-looking fix is precisely the one the rule forbids. It also found `infiniteHorizon/CLAUDE.md` naming `/Content/AI_Generated` where the code uses `/Game/AI_Generated`: a stated invariant that had already silently stopped matching the code. If an invariant is load-bearing, it belongs in this table with an enforcement site, and the `verify:` command above should fail when it is broken.

## Dependencies

| Depends on | For | Direction |
| --- | --- | --- |
| `<component or package>` | <one line> | outbound |
| `<component>` | <one line> | inbound (it calls us) |

Cycles are a defect. If this table shows one, record a story to break it.

## Failure modes

| Failure | Symptom | Response |
| --- | --- | --- |
| `<what goes wrong>` | <what an operator actually sees> | <the action, or the runbook path> |

Unhandled failures are listed too, marked `unhandled`. Knowing a failure is unhandled is worth more than a table that implies coverage it does not have.
