#!/usr/bin/env node
// lint-docs.mjs — validate docs against the frontmatter contract.
//
// Contract: docs/architecture/doc-classes.md
// Zero dependencies, ESM, plain node. Do not add npm packages to this script.
//
// Usage:
//   node scripts/lint-docs.mjs [path ...]     # default: docs
//   node scripts/lint-docs.mjs --help
//
// Exit 1 if any error. Warnings alone never fail.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

const SKIP_DIRS = new Set(["node_modules", ".git"]);

// Skipped when walking into a tree, but lintable when named explicitly.
// templates/ carries unfilled <slots> by design; skills/ uses the skill
// frontmatter schema (name/description), not the doc contract.
const NESTED_SKIP_DIRS = new Set(["templates", "skills"]);

const REQUIRED = ["id", "class", "status", "owner", "updated"];

const STATUS_BY_CLASS = {
  living: ["current"],
  ledger: ["accepted", "superseded", "reverted"],
  flow: ["backlog", "active", "blocked", "done", "dropped"],
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Values that mean "nobody filled this in".
const OWNER_PLACEHOLDERS = new Set([
  "@handle",
  "@owner",
  "@you",
  "@your-handle",
  "@yourname",
  "@username",
  "@team",
  "handle",
  "owner",
  "tbd",
  "todo",
  "unknown",
  "none",
  "n/a",
]);

// Tags that are real markup, not an unfilled <placeholder>.
const HTML_TAGS = new Set([
  "a", "b", "br", "code", "details", "div", "em", "hr", "i", "img", "kbd",
  "li", "ol", "p", "pre", "span", "strong", "sub", "summary", "sup", "table",
  "tbody", "td", "th", "thead", "tr", "ul",
]);

const PLACEHOLDER_RE = /<([A-Za-z][A-Za-z0-9 ._/-]{0,48})>/g;
const LITERAL_DATE_RE = /YYYY-MM-DD/;

/** Recursively collect .md files. `skipNested` applies to nested dirs only. */
function collect(target, out, skipNested = true) {
  let st;
  try {
    st = statSync(target);
  } catch {
    return { missing: target };
  }
  if (st.isFile()) {
    if (target.toLowerCase().endsWith(".md")) out.push(target);
    return null;
  }
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (skipNested && NESTED_SKIP_DIRS.has(entry.name)) continue;
      collect(resolve(target, entry.name), out, skipNested);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      out.push(resolve(target, entry.name));
    }
  }
  return null;
}

/**
 * Minimal frontmatter reader. Handles `key: value`, quoted values, `#`
 * comment lines, and `|` / `>` block scalars. Nested mappings and sequences
 * are recorded as present-but-unscalar rather than parsed.
 */
function parseFrontmatter(text) {
  const body = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const lines = body.split(/\r?\n/);
  if (lines[0].trim() !== "---") return { ok: false, reason: "no frontmatter block" };

  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === "---" || t === "...") {
      end = i;
      break;
    }
  }
  if (end === -1) return { ok: false, reason: "frontmatter block is never closed by `---`" };

  const fields = {};
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (/^\s/.test(line)) continue; // continuation / nested; owned by previous key

    const m = /^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) return { ok: false, reason: `unparseable frontmatter line ${i + 1}: ${line.trim()}` };

    const key = m[1];
    let value = m[2].trim();

    if (value === "|" || value === ">" || value === "|-" || value === ">-") {
      const parts = [];
      let j = i + 1;
      for (; j < end && (/^\s+\S/.test(lines[j]) || !lines[j].trim()); j++) {
        parts.push(lines[j].trim());
      }
      i = j - 1;
      value = parts.join(" ").trim();
    } else {
      value = unquote(value);
    }
    fields[key] = value;
  }
  return { ok: true, fields, bodyStart: end + 1, lines };
}

function unquote(v) {
  if (v.length >= 2 && ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'")))) {
    return v.slice(1, -1).trim();
  }
  return v;
}

/** Strip fenced code blocks so intentional examples do not generate noise. */
function stripFences(lines) {
  const kept = [];
  let fence = null;
  for (const line of lines) {
    const m = /^\s*(`{3,}|~{3,})/.exec(line);
    if (m) {
      if (fence === null) fence = m[1][0];
      else if (m[1][0] === fence) fence = null;
      continue;
    }
    if (fence === null) kept.push(line);
  }
  return kept;
}

function lintFile(absPath, root, allowPlaceholders = false) {
  const rel = relative(root, absPath).split(sep).join("/") || absPath;
  const errors = [];
  const warnings = [];
  const err = (field, message) => errors.push(`${rel}:${field}: ${message}`);
  const warn = (field, message) => warnings.push(`${rel}:${field}: warning: ${message}`);

  let text;
  try {
    text = readFileSync(absPath, "utf8");
  } catch (e) {
    err("file", `cannot read: ${e.message}`);
    return { errors, warnings };
  }

  const parsed = parseFrontmatter(text);
  if (!parsed.ok) {
    // The contract governs docs/. Markdown outside it — a repo front-door
    // README, a skill body — may legitimately carry no frontmatter.
    if (/(^|\/)docs\//.test(rel)) err("frontmatter", parsed.reason);
    return { errors, warnings };
  }

  const f = parsed.fields;

  for (const key of REQUIRED) {
    if (!(key in f)) err(key, "required field is missing");
    else if (!f[key]) err(key, "required field is empty");
  }

  const cls = f.class;
  if (cls && !(cls in STATUS_BY_CLASS)) {
    err("class", `must be one of living|ledger|flow (got "${cls}")`);
  } else if (cls) {
    const allowed = STATUS_BY_CLASS[cls];
    if (f.status && !allowed.includes(f.status)) {
      err("status", `"${f.status}" is not valid for class ${cls}; expected one of ${allowed.join("|")}`);
    }
    if (cls === "living" && !(f.verify || "").trim()) {
      err("verify", "living docs require a non-empty verify: a command or concrete check proving the doc is still true");
    }
    if (cls === "ledger" && !(f.date || "").trim()) {
      err("date", "ledger docs require date:");
    }
  }

  if (f.updated && !DATE_RE.test(f.updated)) {
    const msg = `must match YYYY-MM-DD (got "${f.updated}")`;
    if (allowPlaceholders) warn("updated", msg);
    else err("updated", msg);
  }

  if (f.owner) {
    const bare = f.owner.trim().toLowerCase();
    if (OWNER_PLACEHOLDERS.has(bare) || /^<.*>$/.test(bare)) {
      const msg = `is a placeholder ("${f.owner}"); name an accountable handle`;
      if (allowPlaceholders) warn("owner", msg);
      else err("owner", msg);
    }
  }

  // Placeholder residue — warnings only.
  const bodyLines = stripFences(parsed.lines.slice(parsed.bodyStart));
  const seen = new Set();
  const once = (key, field, message) => {
    if (seen.has(key)) return;
    seen.add(key);
    warn(field, message);
  };

  for (const line of bodyLines) {
    if (/\bTODO\b/.test(line)) once("todo", "body", "contains TODO");
    if (/\bTBD\b/.test(line)) once("tbd", "body", "contains TBD");
    if (line.includes("_No entries yet._")) {
      once("empty", "body", "still says `_No entries yet._` — delete the stub once real entries exist");
    }
    if (LITERAL_DATE_RE.test(line)) {
      once("literal-date", "body", "contains a literal YYYY-MM-DD — substitute the real date");
    }
    for (const m of line.matchAll(PLACEHOLDER_RE)) {
      const inner = m[1];
      if (inner.includes("://") || inner.includes("@")) continue;
      if (HTML_TAGS.has(inner.toLowerCase())) continue;
      once(`ph:${inner}`, "body", `unfilled placeholder <${inner}>`);
    }
  }

  return { errors, warnings };
}

function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(
      [
        "Usage: node scripts/lint-docs.mjs [--allow-placeholders] [path ...]",
        "",
        "Validates every .md under each path against the frontmatter contract",
        "in docs/architecture/doc-classes.md. Defaults to `docs`.",
        "",
        "  --allow-placeholders  Treat placeholder owner/updated values as",
        "                        warnings rather than errors. Implied when a",
        "                        target path names templates/.",
        "",
        "templates/ is skipped while walking a tree; name it explicitly to lint it.",
        "Exit 1 if any error; warnings alone do not fail.",
        "",
      ].join("\n"),
    );
    return 0;
  }

  const targets = argv.filter((a) => !a.startsWith("-"));
  const roots = targets.length ? targets : ["docs"];
  const cwd = process.cwd();

  // Linting templates/ explicitly implies tolerating its unfilled slots.
  const namesTemplates = roots.some((r) => /(^|[\\/])templates([\\/]|$)/.test(r));
  const allowPlaceholders = argv.includes("--allow-placeholders") || namesTemplates;

  const files = [];
  let fatal = 0;
  for (const r of roots) {
    const res = collect(resolve(cwd, r), files, !namesTemplates);
    if (res && res.missing) {
      process.stdout.write(`${r}:path: no such file or directory\n`);
      fatal++;
    }
  }

  files.sort();
  const allErrors = [];
  const allWarnings = [];
  for (const file of files) {
    const { errors, warnings } = lintFile(file, cwd, allowPlaceholders);
    allErrors.push(...errors);
    allWarnings.push(...warnings);
  }

  for (const line of allErrors) process.stdout.write(`${line}\n`);
  for (const line of allWarnings) process.stdout.write(`${line}\n`);

  process.stdout.write(
    `\n${files.length} file(s) checked, ${allErrors.length} error(s), ${allWarnings.length} warning(s)\n`,
  );

  return allErrors.length || fatal ? 1 : 0;
}

process.exit(main(process.argv.slice(2)));
