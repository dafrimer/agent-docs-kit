---
name: docs-kit
description: Set up a repo's documentation system and route to the right doc skill for a given job.
disable-model-invocation: true
---

# Docs kit

Two jobs: point at the right sibling skill, and stand up the doc system in a repo that has none.

## The model, in three lines

- **living** — one current truth, edited in place. Carries `verify:`, a command that proves it is still true.
- **ledger** — append-only record of what happened or was decided. Carries `date:`. Correct it by adding an entry, never by editing one.
- **flow** — a unit of work with states (`backlog` → `active` → `done`, plus `blocked` / `dropped`), archived to a `done/` folder when it ends.

Class is the *update rule*, not the topic. A doc whose update rule is undefined is a doc that will rot. Full contract: `docs/architecture/doc-classes.md` in the kit.

## The sibling skills

| Skill | Reach for it when |
| --- | --- |
| `repo-architecture` | The repo has no map — write or refresh `AGENTS.md` / `docs/architecture/overview.md` (living). |
| `decision-record` | A choice is being made whose rationale would otherwise be lost — write `docs/decisions/NNNN-slug.md` (ledger). |
| `user-story` | A piece of work needs a home with a state — write `docs/stories/<slug>.md` (flow). |
| `change-ledger` | Something shipped, broke, or was reverted — append a dated entry with a **Why** to `docs/changelog/` (ledger). |
| `docs-audit` | Docs have accumulated and nobody trusts them — run the eight-check prune sweep. |

The first four are model-invoked: they fire on their own when the work matches. `docs-audit` is user-invoked and deliberately so — a sweep that runs unprompted just adds sediment. **This router cannot launch it.** Tell the human to run `docs-audit` themselves.

## Three rules that override everything

1. Nothing durable is gitignored.
2. Docs point at config; they never copy it. Cite file + line.
3. One canonical path (`docs/`), thin per-harness pointers, never copies.

## First-time setup

Templates live in the `agent-docs-kit` checkout under `templates/`. If you do not know where that checkout is, ask before guessing.

### 1. Confirm the target

Establish the repo root (`git rev-parse --show-toplevel`) and check what already exists: `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `README.md`, `docs/`, any `plan.md` or `TODO.md` at root.

*Done when:* you can name every existing doc-shaped file and whether you are creating, merging, or leaving it alone. Never overwrite a file with content in it — merge, and say what you merged.

### 2. Copy the skeleton

From `templates/`, copy into the repo root:

```
AGENTS.md
CONTEXT.md
docs/README.md
docs/architecture/
docs/decisions/
docs/stories/
docs/stories/done/
docs/changelog/
```

*Done when:* every copied file is present and no file still contains a template marker other than the `<angle-bracket>` slots you are about to fill.

### 3. Fill `AGENTS.md` by enumerating, not guessing

Read the actual tree — `git ls-files | cut -d/ -f1 | sort -u` for tracked top-level entries, plus a directory listing for anything untracked but real. Write one line per top-level directory saying what lives there and who reads it.

*Done when:* every top-level directory appears exactly once, and none appears that does not exist on disk. The audit found a README that omitted a whole top-level directory (`smarthome/`), and another repo with 8 top-level directories and zero markdown files.

### 4. Fill the architecture overview

`docs/architecture/overview.md` is `living`, so it needs a `verify:` that is a real command. Capture:

- Entry points — what actually starts, and from which file.
- The contract surface — the file where the shared types / API schema / manifest set lives. Cite the path. Do not restate its contents.
- Where configuration lives, by path and line. Never paste config values into the doc.

*Done when:* `verify:` runs green, and every factual claim in the doc names the file it came from.

### 5. Fill `CONTEXT.md`

Glossary of terms that appear in this codebase's identifiers but not in plain English: service names, invented nouns, abbreviations. One line each, pointing at where the term is defined in code.

*Done when:* a reader who has never seen the repo can decode the directory names from step 3.

### 6. Check `.gitignore` — do not skip this

Read the whole `.gitignore`, then prove the new docs are tracked:

```sh
git check-ignore -v AGENTS.md CONTEXT.md docs/ && echo "IGNORED — fix .gitignore"
```

`git check-ignore` printing nothing is the pass condition. Also grep for patterns covering agent memory: `.claude/`, `.local/`, `plan.md`, `notes/`, `*.local.md`.

This is a step, not a formality. The audit found `shire-homeassistant/.gitignore` at **11 bytes** — a blank line and `plan.md` — hiding the repo's only planning artifact from git entirely. It found `homelab-ops/.gitignore` at three lines (`.claude/`, `.local/`, `node_modules/`) excluding every piece of agent memory the project had: learning log, changelog, and both working plans, invisible to CI, teammates, and fresh clones.

*Done when:* the `check-ignore` command prints nothing for all created paths, and any pattern that was hiding durable memory is either removed or replaced with a narrower one (ignore `.local/cache/`, not `.local/`).

### 7. Frontmatter sweep

Every created doc carries:

```yaml
---
id: <stable-slug>
class: living|ledger|flow
status: <current | accepted | backlog>
owner: "@<handle>"
updated: <YYYY-MM-DD>
---
```

Plus `verify:` on living docs and `date:` on ledger docs.

*Done when:* no created file still contains an unfilled `<angle-bracket>` slot, a literal `YYYY-MM-DD`, or an empty `owner`. The audit found a changelog shipped with literal `YYYY-MM-DD` inside backup paths, and a learning log printing `_No entries yet._` above six real entries.

### 8. Harness pointers

If the repo is used from more than one harness, the canonical docs stay in `docs/` and each harness gets a pointer file of a few lines that says where to look. Never a second copy.

*Done when:* `AGENTS.md` is the only root-level router, and any `CLAUDE.md` / `.github/copilot/` file is a pointer, not content. The audit found the best architecture doc in a repo sitting at `.github/copilot/skills/homelab-k8s/SKILL.md` — a path the tools in use never read.

### 9. Commit

One commit containing every created doc. Durable knowledge that is not committed did not happen.

*Done when:* `git status --porcelain` is clean of the created paths.

## After setup

Stop. Do not pre-write stories, decisions, or changelog entries to make the tree look populated — empty folders with a README explaining their class are correct. The sibling skills fill them as real work occurs.
