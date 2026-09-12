---
id: workspace-doc-audit-2026-09-11
class: ledger
status: accepted
owner: "@dafrimer"
updated: 2026-09-11
date: 2026-09-11
---

# Workspace Documentation Audit — H:/Projects

**Date:** 2026-09-11
**Method:** 7 parallel read-only scouts across 22 top-level project folders.
**Purpose:** Ground the `agent-docs-kit` template design in observed failures, not best-practice theory.

Every claim below carries a path and a metric. No files were modified during the audit.

---

## Coverage

| Metric | Count | % of 22 folders |
| --- | --- | --- |
| Have a `README.md` | 6 | 27% |
| Have `CLAUDE.md` or `AGENTS.md` | 2 | 9% |
| Have a `docs/` directory | 2 | 9% |
| Have any decision record (ADR) | 0 | **0%** |

The 0% is the headline. Across two years and 22 projects, not one architectural decision has a recorded rationale.

---

## Failure taxonomy

### 1. NO-MAP — the agent rediscovers structure every session

- `street-roam/` — 8 top-level dirs (`src`, `server`, `shared`, `scripts`, `data`, `public`, …), **zero markdown files**. The entire client/server contract lives in `shared/contracts.ts`, documented nowhere.
- `seattle-world/` — 8 top-level dirs, **zero markdown files**.
- `homelab-ops/` — no `CLAUDE.md` or `AGENTS.md` anywhere, yet `.claude/settings.local.json` still carries a `mv CLAUDE.md` permission. The contract was deleted and never replaced.
- `homelab-ops/README.md` never names the repo's own top-level directories and omits `smarthome/` entirely.

### 2. MONOLITH — docs too large to load usefully

| File | Size | Problem |
| --- | --- | --- |
| `HomeLab/HLOS/CLAUDE.md` | 46.4KB / 803 lines | ~540 lines are a bug log; two competing "current" date markers |
| `hedgefunder/docs/SIGNALS.md` | 45.6KB / 803 lines | Actively maintained, far past loadable size |
| `shire-homeassistant/plan.md` | 30.8KB / 707 lines | Mixes **12 distinct concerns** |
| `hedgefunder/README.md` | 20KB / 395 lines | Pitch + results + changelog + architecture + 3 runbooks + config ref + layout map |

`shire-homeassistant` has a 784B README against a 30.8KB plan — a **1:39 ratio**. The entry point cannot route a reader.

### 3. ORPHAN-PLAN — plans abandoned mid-flight, never closed

- `shire-homeassistant/plan.md` — **5 of 98 checkboxes done (5.1%)**. Only Phase 0 (DNS, unrelated to the migration the file is named for) ever ran.
- `homelab-mcp/specs/001-python-mcp-framework/tasks.md` — **24 of 46 tasks unchecked**, frozen 3 months.
- `procare-ingest/plan.md` — 20 unchecked boxes, 3 months old.
- `homelab-ops/.local/working-plan.md` — **0 bytes**.
- Status headers lie: the HA migration spec reads `Status: Proposed (PR for review)` months after `learned-fixes.md` records the PRs merged 2026-06-21. `homelab-mcp/spec.md` reads `Status: Draft` though M0 shipped.

### 4. STALE — docs contradict the code

- `homelab-ops/README.md` claims Ubuntu 16.04 and "manually sync"; `bootstrap/smarthome-applicationset.yaml` sets `syncPolicy.automated` with prune + selfHeal.
- `homelab-mcp/README.md` documents `servers/procare/` and `deploy/Dockerfile` — **neither exists**. `.github/workflows/build.yml` references the missing Dockerfile.
- `shire-homeassistant/charts/homeassistant/` is a default `helm create` scaffold contradicting the plan's own StatefulSet decision. 0 of 5 prescribed supporting charts exist.
- `infiniteHorizon/CLAUDE.md` says `/Content/AI_Generated`; the code uses `/Game/AI_Generated`.

### 5. DUP — one meaning, many copies

- `homelab-ops/migration.txt` and `migration.yaml` are **byte-identical 646B twins**, and both are a *third* copy of a manifest already embedded in `specs/ha-stack-migration.md` §6.
- `hedgefunder/docs/SIGNALS.md` restates README numbers at **different precision** (0.168 vs 0.17) — the duplicate already disagrees with its source.
- The helm-lint / kubeconform / kube-linter chain is restated in **three** files.

### 6. NO-WHY — zero recorded rationale

- ArgoCD, Longhorn, MetalLB, Traefik, external-secrets all chosen with no rationale anywhere.
- `seattle-world` pins **two mutually incompatible torch stacks** (`2.4.0+cu124` vs `1.13.1+cu117`) and states the rule *"Do not loosen a constraint to resolve an installation failure"* — with no recorded why. A future agent cannot honour a rule whose reason is missing.
- The one genuine Decision/Rationale/Alternatives doc in the workspace — `homelab-mcp/research.md` — is buried in a shipped feature directory, linked from nothing.
- `infiniteHorizon/ue5_scripts/asset_importer.py` holds the project's **critical game-thread invariant in a source docstring** — and cites `CLAUDE.md` while contradicting its asset folder. An invariant that lives only in a comment is one refactor from gone.

### 7. INVISIBLE — durable knowledge excluded from version control

- `homelab-ops/.gitignore` is 3 lines: `.claude/`, `.local/`, `node_modules/`. Every piece of agent memory (learning log, changelog, both working plans) is invisible to CI, teammates, worktrees, and fresh clones.
- `shire-homeassistant/.gitignore` is **11 bytes**: a blank line and `plan.md`. The repo's only planning artifact is excluded from git.

### 8. WRONG-HARNESS — the good doc is on a path nothing loads

`homelab-ops/.github/copilot/skills/homelab-k8s/SKILL.md` is the repo's *de facto* architecture and conventions doc. Claude Code and OMP never read that path. The best doc in the repo is invisible to the tools actually used.

### 9. DRIFT — worktree copies diverged

- `agents-ci-pipeline-testing-improvements/` carries **8 of main's 26** markdown files (69% absent) and contains **zero CI documentation** despite its branch name.
- `.githooks/README.md`: 3.5KB on main vs 2.1KB in worktree; the worktree teaches a symlink install that main explicitly calls broken on Windows.
- Both homelab worktrees carry `bootstrap/` docs **larger** than main's — unmerged content stranded.
- The procare worktree README describes a MySQL/Postgres architecture; main is SQLite.

### 10. AD-HOC-WORK — work tracked outside any system

- Branch intent is encoded **only in worktree directory names**.
- `procare-ingest.worktrees/…/` holds 63.5KB across 8 `.txt` status files, none merged.
- The real cross-project backlog lives in an **unversioned Obsidian vault**: `Obsidian/Project Landscape/Home Lab K3S.md`, `Hardware/Baby Cam Project.md`, `App Builds/BabyCam-ML.md` — checkboxes untouched for 7 months. `BabyCam-ML.md` has **no corresponding repo anywhere**.

### 11. UNDATED / SEDIMENT

- `learned-fixes.md` still prints `_No entries yet._` above 6 real entries.
- `HomeLab/homeassistant-changelog.md` is one entry misnamed as a changelog, with literal `YYYY-MM-DD` placeholders left in backup paths.
- 6 abandoned `.claude/worktrees/`, each a full repo copy.
- `HomeLab/NUL` — 1.6KB Windows `> NUL` redirect accident containing an `omp models` table.
- `MilkyWay/` and `New folder/` are empty; 3 zero-byte dated Obsidian daily notes.

### 12. CONFIG-DRIFT — five allow-lists, two grammars

Five `.claude/settings.local.json` files drifted independently, using **incompatible matcher grammars** — `Bash(git *)` (space-star) vs `Bash(uv run:*)` (colon-star). `HomeLab`'s pins `"*"`, making its other 14 entries dead sediment.

---

## Credential exposure (act on this independently)

The audit found **six instances of live secret material across four repositories**, spanning four classes:

- a model-hosting API token in an undocumented scratch folder
- a Kubernetes cluster join token, duplicated **three times**, including once inside an archive directory
- a home-automation radio network key written into an agent memory file
- a real financial account identifier committed in a README

Compounding factor: one agent harness config allows `"*"` — every command without prompting — alongside a shell command that reads a cluster token.

**Exact paths and line numbers are deliberately omitted from this document.** They were reported to the owner out of band on 2026-09-11.

Recording a precise map to un-rotated credentials inside a git repository creates a durable shopping list: it outlives the exposure, survives in history after the file is edited, and propagates to every clone and every future change of repository visibility. Once the material is rotated the map is worthless; until then it is the most dangerous paragraph a documentation repo could carry.

The structural lesson is what matters here. Agent memory files and `.env`-style scratch files accumulate secrets because nothing ever says they may not, and no document ever records that they did. That is why the `change-ledger` and `user-story` skills both carry a hard rule against writing a credential value into a document — name the setting and its configuration path, never the value, and never a line-precise pointer to live material.

---

## The one exemplar

`HomeLab/homeassistant-changelog.md` is the best artifact found in the workspace: dated, attributed, with explicit `### Why` sections. It is the shape to templatize — the single positive model this audit produced.

---

## Failure → artifact mapping

| Failure | Artifact that prevents it |
| --- | --- |
| NO-MAP | `AGENTS.md` — tiny router, committed, names every top-level dir |
| MONOLITH | Split by mutability; a doc that mixes concerns has no single update rule |
| ORPHAN-PLAN | `docs/stories/` with explicit states + a `done/` archive; status in frontmatter, not prose |
| STALE | Living docs carry an owner and a re-verify trigger |
| DUP | Single source of truth; docs point at config rather than copying it |
| NO-WHY | `docs/decisions/NNNN-slug.md` — Status / Context / Decision / Consequences |
| INVISIBLE | Templates live on committed paths; `.gitignore` never covers durable memory |
| WRONG-HARNESS | One canonical path plus thin per-harness pointers |
| DRIFT | Branch intent recorded in a story file, not a directory name |
| UNDATED | Changelog entries require date + author + Why |
| SEDIMENT | A prune pass with explicit retirement rules |
