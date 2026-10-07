---
name: repo-architecture
description: Create or refresh the repo map at docs/architecture/overview.md. Use when onboarding to an unfamiliar repo and no map exists, when a directory, nested service, worker profile, entry point, deployment pipeline or external dependency changes, when a build or CI file references a path you cannot find, or whenever the architecture doc is suspected stale — the doc says one thing and the tree says another.
---

# Repo architecture

`docs/architecture/overview.md` is a `living` doc: **edit in place, never stale.** There is exactly one, it is rewritten whenever reality changes, and history lives in git.

**Why this skill exists — it is the anti-stale skill.** The audit (`docs/research/2026-09-11-workspace-doc-audit.md`) found maps that actively lied:

- `homelab-mcp/README.md` documented `servers/procare/` and `deploy/Dockerfile` — **neither exists** — and `.github/workflows/build.yml` referenced that missing Dockerfile. The doc was wrong *and* the build was pointed at the same ghost.
- `homelab-ops/README.md` claimed Ubuntu 16.04 and "manually sync", while `bootstrap/smarthome-applicationset.yaml` sets `syncPolicy.automated` with prune and selfHeal. An agent trusting that doc would have hand-applied changes into a controller that reverts them.
- The same README never named the repo's own top-level directories and **omitted `smarthome/` entirely**.

None of these needed judgement to catch. They needed one mechanical comparison of the tree against the table. That comparison is Step 2 and it is not optional.

## Step 1 — Discover architectural units, not just root directories

Read the tree, not your memory of it, not the README:

```sh
git ls-tree -d --name-only HEAD
git ls-files --cached --others --exclude-standard
```

The first command is orientation, **not the architecture inventory**. The second includes tracked and untracked, non-ignored files in the working tree; inspect their current contents, not only `HEAD`, and account for deleted tracked paths. Include untracked-but-real directories too (`ls -d */`), including hidden configuration directories such as `.github/`. Inspect relevant ignored source/configuration deliberately; distinguish durable architecture from generated, vendored and local-only artifacts, and record exclusions and their reasons rather than silently hiding units.

Follow the repo's conventions and references to discover:

| Kind | Evidence to inspect |
| --- | --- |
| `compute` | Nested roots under `services/`, `containers/`, `apps/`, `packages/`, `functions/`; Dockerfiles, workspace/package manifests, Compose services, worker and serverless manifests |
| `component` | Shared libraries and client contracts, including workspace packages that are not independently deployed |
| `entry` | CLI/main modules, HTTP routers/gateways, event or queue consumers, scheduled timers; registrations and trigger bindings, not just filenames |
| `delivery` | `.github/workflows/*.yml` and `*.yaml`, `pipelines/`, deployment manifests and IaC templates; build contexts, jobs and deployment targets |

These are starting points, not a universal filename filter. Trace runtime and deployment configuration to code. Multiple workers sharing one image can be distinct compute units: record each independently configured process/profile, its command and queue/timer binding, and its shared base. A profile is not automatically a standalone service; use the execution configuration to establish that distinction.

Use the template's **Architectural inventory** schema. Give each unit a stable `(Kind, Name, Path)` identity; `Path` is a repository-relative source file or service root, without line numbers. Keep configuration evidence (`file:line` or manifest key) in the descriptive cells. Multiple units may share a path or runtime but must have distinct names. Record purpose, trigger/protocol, base image/runtime and owner for every row; use `n/a` where genuinely inapplicable and explicitly flag unknown ownership.

*Complete when:* you hold evidence-backed lists of units, entry points and delivery definitions, plus the root layout and explicit discovery scope/exclusions.

## Step 2 — Diff disk against the doc — the core step

Open `overview.md` and compare both its layout table and architectural inventory against the Step 1 lists, in both directions. Compare unit identities and execution bindings, not only directory names:

| Finding | Meaning | Action |
| --- | --- | --- |
| On disk, **missing from the table** | The map has a hole (`smarthome/`) | **Defect — add the row now** |
| In the table, **not on disk** | The map cites a ghost (`servers/procare/`) | **Defect — delete or correct the row now** |
| Both, but the description contradicts the code | The map lies (`manually sync`) | **Defect — rewrite against the code** |

Every mismatch is a defect to fix in this pass. Do not record it as a follow-up, do not add a "known gaps" section, do not leave a `TODO`. The whole failure mode being prevented is a mismatch that someone noticed and deferred.

Then check the reverse direction once more: **grep the build and CI files for paths and confirm each resolves.** That is what would have caught `deploy/Dockerfile` being referenced by a workflow and existing nowhere.

Check shared runtime/profile relationships, entry point registrations and delivery targets against their definitions too. Resolve repository-local paths using the configuration's working directory/build context; distinguish external references and generated artifacts from missing source paths.

*Complete when:* layout, units, triggers and delivery definitions agree with disk in both directions, and referenced repository-local source paths resolve.

## Step 3 — Run the doc's own `verify:` and reconcile

Every `living` doc carries a `verify:` — a command or concrete check proving it is still true. Run it from the repository root. The frontmatter linter checks presence, **not execution or architectural coverage**.

Choose repository-specific discovery rules and mechanically compare their output with the inventory's exact identities. Discover from source/configuration independently of the doc: do not derive the expected set from documented paths or grep the entire overview (which can match the check's own text). Compare in both directions and exit nonzero for unmapped units, removed paths, changed bindings or discovery/parsing errors. Do not merely print `MISSING` and return success.

For a repository whose compute units each have one Dockerfile and whose delivery definitions are YAML workflows/pipelines, this is a starting check. It expects the template's exact column order and one manifest path per `compute`/`delivery` row:

```sh
set -eu
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT HUP INT TERM
git ls-files --cached --others --exclude-standard > "$tmp/files"
awk '/(^|\/)Dockerfile(\.[^/]+)?$/ || /^\.github\/workflows\/[^/]+\.ya?ml$/ || /(^|\/)pipelines\/.*\.ya?ml$/' "$tmp/files" > "$tmp/discovered"
while IFS= read -r path; do test -f "$path" || exit 1; done < "$tmp/discovered"
awk -F '|' '$2 ~ /^ (compute|delivery) $/ { path=$4; gsub(/^ +`|` +$/, "", path); print path }' docs/architecture/overview.md > "$tmp/documented"
LC_ALL=C sort -u "$tmp/discovered" > "$tmp/expected"
LC_ALL=C sort -u "$tmp/documented" > "$tmp/actual"
diff -u "$tmp/expected" "$tmp/actual"
```

Adapt discovery and extraction together to the actual repo; this example does **not** cover manifest-less services, multiple profiles in one manifest, shared contracts or entry point bindings. For those, parse the relevant workspace/Compose/IaC/router configuration using existing repo tooling and compare `(Kind, Name, Path)` plus commands, protocols and queue/timer bindings. Validate inventory columns and duplicate identities as well. Keep the check in an existing validation script or a reproducible concrete check and point `verify:` at it; no new dependency is required by this skill.

If it fails, the doc is wrong — fix the doc. If it passes while you can see the doc is wrong, the **check** is too weak; strengthen `verify:` until it would have failed. A `verify` of `grep syncPolicy bootstrap/*.yaml` would have caught the manual-sync claim in one command.

Prove sensitivity in a disposable working tree: add a nested service without changing any root directories, remove a documented manifest, and change a worker binding or entry registration. Each relevant check must fail; restore the fixture and confirm it passes.

*Complete when:* the `verify:` runs, passes, and demonstrably fails on architectural drift within the stated scope.

## Step 4 — Update in place

Rewrite the affected lines. **Never append a dated entry to a living doc** — that turns it into a ledger, and the audit found the result: a 46.4KB / 803-line file, roughly 540 lines of bug log, carrying two competing "current" date markers. Dated entries belong in `docs/changelog/`; rationale belongs in `docs/decisions/`.

Bump `updated:` to today. Keep `status: current` and `id:` unchanged.

**Reference config by path and line; never copy it.** Write ``ArgoCD auto-syncs `smarthome/` (`bootstrap/smarthome-applicationset.yaml:12`)`` rather than pasting the manifest. The audit found a manifest stored in **three** places — two byte-identical 646B twins plus a copy embedded in a spec — and a duplicated metrics table that already disagreed with its source at different precision (0.168 vs 0.17). Every copy is a thing that drifts independently; a path and a line cannot.

Keep the doc loadable. Long reference material goes in a sibling file under `docs/architecture/` that the overview links to.

**Reconciliation sweep (manual, scheduled or PR replay):** rerun Step 1 discovery against the current working tree, compare all inventory categories in Step 2, update added/removed/renamed units and changed execution relationships in place, then rerun Step 3 and the existing doc linter. A PR's changed paths can prioritize inspection but must not replace the full discovery pass: a new unit under an existing parent still changes architecture. Report the added/removed/changed identities, exclusions and verification result; if evidence or parsing is ambiguous, fail the sweep rather than declare the map current. Do not generate dated architecture snapshots.

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
