---
id: changelog-readme
class: living
status: current
owner: "@dafrimer"
updated: 2026-09-11
verify: "Every file matching docs/changelog/20*.md has an Author line and a '### Why' heading, and node scripts/lint-docs.mjs docs exits 0"
---

# Changelog

Dated records of what changed in the agent-docs-kit and why. Append-only: entries are added, never rewritten.

An entry here records something that happened. A change that settles a hard-to-reverse trade-off with live alternatives goes to `docs/decisions/` instead — see `docs/decisions/README.md` for the three-part test.

## This repo uses: one file per entry

Entries live at `docs/changelog/`, one entry per file, named with a real ISO date followed by a kebab-case slug. This layout was chosen because entries here are long, they land on separate branches, and agents write them concurrently — which is exactly the case where a single shared file produces merge conflicts on every entry.

The other layout, a single appended `CHANGELOG.md`, is equally valid and is documented in `templates/docs/changelog/README.md`. Mixing the two is the failure mode: once some entries are in their own files and some are buried in a shared one, nobody can answer what shipped last month without reading both, so they read neither. This repo does not mix them.

## Entries

| Date | Entry | Author |
| --- | --- | --- |
| 2026-09-11 | [Initial kit](2026-09-11-initial-kit.md) | @dafrimer |

## Every entry carries date, author, and Why

Non-negotiable, all three:

- **Date** — a real ISO date in the `##` heading and in `date:`. It is the ordering key.
- **Author** — `**Author:** @handle` under the heading. It is who to ask when the Why turns out to be incomplete.
- **Why** — the reason the change happened, which is the only part git cannot reconstruct.

Never paste a credential, a token, or an account identifier into an entry. A ledger is append-only, so a secret written here cannot be cleanly removed — it can only be rotated. For the same reason, do not record a path-precise map to secrets that are still live: name the setting and its configuration path, never the value, and never the line.

## Entries are never edited, only superseded

An entry is a claim about a moment; editing it destroys the record of what was believed then. Got it wrong? Write a new entry, dated today, saying what the earlier one got wrong. Set the old entry's `status:` to `superseded` with `superseded_by:`, or to `reverted` if it was rolled back. Frontmatter status is the only permitted edit to a shipped entry.
