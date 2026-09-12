---
id: context
class: living
status: current
owner: "@<handle>"
updated: <YYYY-MM-DD>
verify: "grep -niE '\\b(todo|roadmap|next step|we will|phase [0-9]|\\[ \\])' CONTEXT.md returns nothing, and every term in the table returns at least one hit from git grep -il '<term>'"
---

# Context

**This file is a glossary and nothing more.** It defines the words this repo uses. It holds no implementation detail, no specification, no plan, no todo list, and no status. If a line here would go stale when the code changes, it is in the wrong file:

| If you want to write... | Put it in |
| --- | --- |
| How a thing is built or wired | `docs/architecture/` |
| Why a choice was made | `docs/decisions/` |
| Work that is planned or in flight | `docs/stories/` |
| What changed and when | `docs/changelog/` |

The audit behind this template found a 707-line planning file mixing 12 distinct concerns and a 20KB README carrying a pitch, results, a changelog, architecture, three runbooks, a config reference and a layout map. A document that mixes concerns has no single update rule, so nobody can say when it is wrong. This one has exactly one: a term's definition changed, so the definition changes.

## Terms

Define a term here when it is load-bearing, repo-specific, or easily confused with a neighbouring term. The **Not** column is mandatory for any confusable pair — it is the column that actually prevents the mistake.

| Term | Means | Not |
| --- | --- | --- |
| **Device** | One physical unit of hardware as the integration reports it: a radiator valve, a bulb, a hub. Has a manufacturer, a model, and exactly one radio address. | Not an **Entity**. A Device is the box; it exposes zero or more Entities. Deleting a Device deletes its Entities; the reverse is not true. |
| **Entity** | One addressable value or control surface exposed by a Device: a temperature reading, an on/off switch, a battery level. Has a unique id and a state. | Not a **Device**. One Device commonly publishes six or more Entities, so "the sensor is offline" is ambiguous and must be resolved to one or the other before it means anything. |
| `<term>` | `<definition in one or two sentences>` | `<the neighbouring term it is confused with, and the distinction>` |

## Naming rules

Rules that govern names rather than a single name. Keep them short and testable.

- `<rule>` — enforced at `<file>:<line>`.

## Not defined here

Terms used in this repo that mean exactly what they mean everywhere else do not belong in this table. A glossary that defines `array` is a glossary nobody re-reads.
