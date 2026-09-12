---
name: repo-architecture
description: Create or refresh the repo map at docs/architecture/overview.md. Use when onboarding to an unfamiliar repo and no map exists, when a top-level directory is added, removed or renamed, when a new external dependency or service is introduced, when a build or CI file references a path you cannot find, or whenever the architecture doc is suspected stale — the doc says one thing and the tree says another.
---

# Repo architecture

`docs/architecture/overview.md` is a `living` doc: **edit in place, never stale.** There is exactly one, it is rewritten whenever reality changes, and history lives in git.

**Why this skill exists — it is the anti-stale skill.** The audit (`docs/research/2026-09-11-workspace-doc-audit.md`) found maps that actively lied:

- `homelab-mcp/README.md` documented `servers/procare/` and `deploy/Dockerfile` — **neither exists** — and `.github/workflows/build.yml` referenced that missing Dockerfile. The doc was wrong *and* the build was pointed at the same ghost.
- `homelab-ops/README.md` claimed Ubuntu 16.04 and "manually sync", while `bootstrap/smarthome-applicationset.yaml` sets `syncPolicy.automated` with prune and selfHeal. An agent trusting that doc would have hand-applied changes into a controller that reverts them.
- The same README never named the repo's own top-level directories and **omitted `smarthome/` entirely**.

None of these needed judgement to catch. They needed one mechanical comparison of the tree against the table. That comparison is Step 2 and it is not optional.

## Step 1 — Enumerate the actual top-level directories

Read the tree, not your memory of it, not the README:

```sh
git ls-tree -d --name-only HEAD
```

Include untracked-but-real directories too (`ls -d */`), and note any that are gitignored — a durable directory hidden behind `.gitignore` is itself a defect to report. The audit found a 3-line `.gitignore` hiding every piece of agent memory in a repo, and an 11-byte one excluding the repo's only planning artifact.

*Complete when:* you hold a literal list of directory names taken from disk.

## Step 2 — Diff disk against the doc — the core step

Open `overview.md` and compare its layout table row-for-row against the Step 1 list, in both directions:

| Finding | Meaning | Action |
| --- | --- | --- |
| On disk, **missing from the table** | The map has a hole (`smarthome/`) | **Defect — add the row now** |
| In the table, **not on disk** | The map cites a ghost (`servers/procare/`) | **Defect — delete or correct the row now** |
| Both, but the description contradicts the code | The map lies (`manually sync`) | **Defect — rewrite against the code** |

Every mismatch is a defect to fix in this pass. Do not record it as a follow-up, do not add a "known gaps" section, do not leave a `TODO`. The whole failure mode being prevented is a mismatch that someone noticed and deferred.

Then check the reverse direction once more: **grep the build and CI files for paths and confirm each resolves.** That is what would have caught `deploy/Dockerfile` being referenced by a workflow and existing nowhere.

*Complete when:* the table and the tree agree in both directions, and every path named in CI resolves on disk.

## Step 3 — Run the doc's own `verify:` and reconcile

Every `living` doc carries a `verify:` — a command or concrete check proving it is still true. Run it.

```yaml
verify: "Every directory from `git ls-tree -d --name-only HEAD` appears in the layout table below"
```

If it fails, the doc is wrong — fix the doc. If it passes while you can see the doc is wrong, the **check** is too weak; strengthen `verify:` until it would have failed. A `verify` of `grep syncPolicy bootstrap/*.yaml` would have caught the manual-sync claim in one command.

*Complete when:* the `verify:` command runs, passes, and is specific enough to fail when this doc next drifts.

## Step 4 — Update in place

Rewrite the affected lines. **Never append a dated entry to a living doc** — that turns it into a ledger, and the audit found the result: a 46.4KB / 803-line file, roughly 540 lines of bug log, carrying two competing "current" date markers. Dated entries belong in `docs/changelog/`; rationale belongs in `docs/decisions/`.

Bump `updated:` to today. Keep `status: current` and `id:` unchanged.

**Reference config by path and line; never copy it.** Write ``ArgoCD auto-syncs `smarthome/` (`bootstrap/smarthome-applicationset.yaml:12`)`` rather than pasting the manifest. The audit found a manifest stored in **three** places — two byte-identical 646B twins plus a copy embedded in a spec — and a duplicated metrics table that already disagreed with its source at different precision (0.168 vs 0.17). Every copy is a thing that drifts independently; a path and a line cannot.

Keep the doc loadable. Long reference material goes in a sibling file under `docs/architecture/` that the overview links to.

*Complete when:* changed lines are edited in place, `updated:` is today, and no config content is duplicated into the doc.

## Step 5 — External dependencies, each linked to its ADR

Maintain a dependency table: what it is, where it is configured (path and line), and **a link to the ADR that chose it**.

| Dependency | Configured at | Why |
| --- | --- | --- |
| \<name\> | \<path:line\> | `docs/decisions/NNNN-<slug>.md` |

A dependency with **no ADR is a gap to surface, not to silently accept.** Name it explicitly in your report — "ArgoCD, Longhorn, MetalLB, Traefik and external-secrets have no recorded rationale" is precisely what the audit had to conclude across 22 folders with 0 decision records. Do not invent the rationale to fill the cell; you were not there. Flag it, and let the `decision-record` skill write it with the person who made the call.

*Complete when:* every external dependency has a config path, and every missing ADR is listed in your report rather than papered over.

## Step 6 — Reachability

The map must live where the tools actually look: canonical at `docs/architecture/overview.md`, with thin pointer files per harness — never copies. The best architecture doc in the audited workspace sat at `.github/copilot/skills/homelab-k8s/SKILL.md`, a path Claude Code and OMP never load, which made the repo's best doc invisible to the tools in use.

*Complete when:* the overview is at the canonical path and each harness file points at it rather than restating it.
