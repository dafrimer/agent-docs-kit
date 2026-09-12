#!/usr/bin/env bash
#
# install.sh — install agent-docs-kit skills, and optionally scaffold docs
# templates into a target repo.
#
# Portable to Git Bash on Windows: no GNU-only flags, no readlink -f,
# no cp --parents, no sed -i.
#
# See install.ps1 for the PowerShell equivalent. The two must stay in step.

set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SKILLS_SRC="$SCRIPT_DIR/skills"
TEMPLATES_SRC="$SCRIPT_DIR/templates"

DEFAULT_SKILL_ROOT="$HOME/.claude/skills"

SKILL_ROOTS=()
DOCS_TARGET=""
FORCE=0
DRY_RUN=0
INSTALL_SKILLS=1

CREATED=0
SKIPPED=0
WOULD=0
FAILED=0

usage() {
  cat <<'EOF'
Usage: ./install.sh [options]

Installs every skill in skills/ into one or more skill roots, and can
scaffold templates/ into a target repository.

Options:
  --skills-root <path>   Install skills here. Repeatable, for multi-harness
                         setups (e.g. --skills-root ~/.claude/skills
                         --skills-root ~/.config/opencode/skills).
                         Default: ~/.claude/skills
  --no-skills            Do not install skills. Use with --docs.
  --docs <path>          Scaffold templates/ (AGENTS.md, CONTEXT.md and the
                         docs/ tree) into this repository.
  --force                Overwrite existing skill dirs and doc files.
                         Without it, anything already present is skipped.
  --dry-run              Print every action and write nothing at all.
  -h, --help             Show this help.

Exit status is non-zero if any copy fails.
EOF
}

say() { printf '%s\n' "$*"; }
fail() { printf 'error: %s\n' "$*" >&2; }

# Parse --flag value and --flag=value.
while [ $# -gt 0 ]; do
  arg="$1"
  val=""
  case "$arg" in
    *=*)
      val="${arg#*=}"
      arg="${arg%%=*}"
      ;;
  esac

  case "$arg" in
    --skills-root)
      if [ -z "$val" ]; then
        [ $# -ge 2 ] || { fail "--skills-root requires a path"; exit 2; }
        val="$2"; shift
      fi
      SKILL_ROOTS[${#SKILL_ROOTS[@]}]="$val"
      ;;
    --docs)
      if [ -z "$val" ]; then
        [ $# -ge 2 ] || { fail "--docs requires a path"; exit 2; }
        val="$2"; shift
      fi
      DOCS_TARGET="$val"
      ;;
    --no-skills) INSTALL_SKILLS=0 ;;
    --force) FORCE=1 ;;
    --dry-run) DRY_RUN=1 ;;
    -h|--help) usage; exit 0 ;;
    *)
      fail "unknown option: $1"
      usage >&2
      exit 2
      ;;
  esac
  shift
done

if [ "${#SKILL_ROOTS[@]}" -eq 0 ]; then
  SKILL_ROOTS[0]="$DEFAULT_SKILL_ROOT"
fi

if [ "$INSTALL_SKILLS" -eq 0 ] && [ -z "$DOCS_TARGET" ]; then
  fail "--no-skills with no --docs leaves nothing to do"
  exit 2
fi

[ "$DRY_RUN" -eq 1 ] && say "DRY RUN — no files will be written."

ensure_dir() {
  # $1 = directory to create unless dry running
  [ -d "$1" ] && return 0
  if [ "$DRY_RUN" -eq 1 ]; then
    return 0
  fi
  mkdir -p "$1"
}

# copy_tree <src-dir> <dest-dir> <label>
copy_tree() {
  src="$1"; dest="$2"; label="$3"
  if [ "$DRY_RUN" -eq 1 ]; then
    say "would install $label -> $dest"
    WOULD=$((WOULD + 1))
    return 0
  fi
  if [ -e "$dest" ]; then
    rm -rf "$dest"
  fi
  ensure_dir "$(dirname -- "$dest")"
  if cp -R "$src" "$dest"; then
    say "installed $label -> $dest"
    CREATED=$((CREATED + 1))
  else
    fail "failed to install $label -> $dest"
    FAILED=$((FAILED + 1))
  fi
}

# copy_file <src-file> <dest-file> <label>
copy_file() {
  src="$1"; dest="$2"; label="$3"
  if [ -e "$dest" ] && [ "$FORCE" -eq 0 ]; then
    say "skip     $label (exists)"
    SKIPPED=$((SKIPPED + 1))
    return 0
  fi
  if [ "$DRY_RUN" -eq 1 ]; then
    say "would create $label"
    WOULD=$((WOULD + 1))
    return 0
  fi
  ensure_dir "$(dirname -- "$dest")"
  if cp "$src" "$dest"; then
    say "created  $label"
    CREATED=$((CREATED + 1))
  else
    fail "failed to write $label"
    FAILED=$((FAILED + 1))
  fi
}

install_skills() {
  if [ ! -d "$SKILLS_SRC" ]; then
    fail "no skills directory at $SKILLS_SRC"
    FAILED=$((FAILED + 1))
    return 0
  fi

  for root in "${SKILL_ROOTS[@]}"; do
    say ""
    say "Skills -> $root"
    ensure_dir "$root"

    found=0
    for skill_dir in "$SKILLS_SRC"/*/; do
      [ -d "$skill_dir" ] || continue
      name=$(basename -- "${skill_dir%/}")
      if [ ! -f "$skill_dir/SKILL.md" ]; then
        say "skip     $name (no SKILL.md)"
        SKIPPED=$((SKIPPED + 1))
        continue
      fi
      found=$((found + 1))
      target="$root/$name"
      if [ -d "$target" ] && [ "$FORCE" -eq 0 ]; then
        say "skip     $name (already installed; use --force to replace)"
        SKIPPED=$((SKIPPED + 1))
        continue
      fi
      copy_tree "${skill_dir%/}" "$target" "$name"
    done

    if [ "$found" -eq 0 ]; then
      fail "no skills found under $SKILLS_SRC"
      FAILED=$((FAILED + 1))
    fi
  done
}

scaffold_docs() {
  if [ ! -d "$TEMPLATES_SRC" ]; then
    fail "no templates directory at $TEMPLATES_SRC"
    FAILED=$((FAILED + 1))
    return 0
  fi

  say ""
  say "Docs -> $DOCS_TARGET"
  ensure_dir "$DOCS_TARGET"

  # Mirror templates/ into the target. templates/ holds AGENTS.md, CONTEXT.md
  # and the docs/ tree, so a plain mirror is exactly the scaffold.
  # Process substitution keeps the loop in this shell so the counters survive,
  # and avoids a scratch file — --dry-run must write nothing anywhere.
  while IFS= read -r src; do
    [ -n "$src" ] || continue
    rel="${src#"$TEMPLATES_SRC"/}"
    copy_file "$TEMPLATES_SRC/$rel" "$DOCS_TARGET/$rel" "$rel"
  done < <(find "$TEMPLATES_SRC" -type f -print | LC_ALL=C sort)
}



[ "$INSTALL_SKILLS" -eq 1 ] && install_skills
[ -n "$DOCS_TARGET" ] && scaffold_docs

say ""
if [ "$DRY_RUN" -eq 1 ]; then
  say "Summary: $WOULD would create, $SKIPPED skipped, $FAILED failed. Nothing was written."
else
  say "Summary: $CREATED created, $SKIPPED skipped, $FAILED failed."
fi

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
exit 0
