#!/usr/bin/env node
// agent-docs-kit — scaffold the doc tree into a repo, and check it.
//
// Skills are not installed by this CLI. They are installed by the skills
// ecosystem CLI, which handles 30-odd agent harnesses, project vs global
// scope, symlink vs copy, and update tracking:
//
//   npx skills add dafrimer/agent-docs-kit
//
// Rationale: docs/decisions/0006-package-the-kit-not-plugin-it.md
//
// Zero dependencies, ESM, plain node. Do not add npm packages here.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { main as lintMain } from "../scripts/lint-docs.mjs";

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATES = join(PKG_ROOT, "templates");

const USAGE = `Usage: agent-docs-kit <command> [options]

Commands:
  init [target]        Scaffold AGENTS.md, CONTEXT.md and the docs/ tree into
                       target (default: the current directory). Existing files
                       are reported and left alone.
  lint [path ...]      Validate docs against the frontmatter contract.
                       Defaults to docs. Exit 1 on any error.

init options:
  -f, --force          Overwrite files that already exist.
  -n, --dry-run        Print every action and write nothing at all.

Other:
  -h, --help           Show this help.
  -v, --version        Print the package version.

Skills install separately, across every supported agent harness:
  npx skills add dafrimer/agent-docs-kit

Exit status is non-zero if any file could not be written.
`;

/** Every file under root, as paths relative to it, depth-first and sorted. */
function walk(root, prefix = "", out = []) {
  for (const entry of readdirSync(join(root, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}${sep}${entry.name}` : entry.name;
    if (entry.isDirectory()) walk(root, rel, out);
    else out.push(rel);
  }
  return out.sort();
}

function init(argv) {
  const force = argv.includes("--force") || argv.includes("-f");
  const dryRun = argv.includes("--dry-run") || argv.includes("-n");
  const positional = argv.filter((a) => !a.startsWith("-"));

  if (positional.length > 1) {
    process.stderr.write(`init takes at most one target, got ${positional.length}\n`);
    return 2;
  }
  if (!existsSync(TEMPLATES)) {
    process.stderr.write(`no templates directory at ${TEMPLATES}\n`);
    return 1;
  }

  const target = resolve(process.cwd(), positional[0] ?? ".");
  if (existsSync(target) && !statSync(target).isDirectory()) {
    process.stderr.write(`${target} exists and is not a directory\n`);
    return 2;
  }

  if (dryRun) process.stdout.write("DRY RUN - no files will be written.\n");
  process.stdout.write(`Docs -> ${target}\n`);

  let created = 0;
  let skipped = 0;
  let would = 0;
  let failed = 0;

  for (const rel of walk(TEMPLATES)) {
    const label = rel.split(sep).join("/");
    const dest = join(target, rel);

    if (existsSync(dest) && !force) {
      process.stdout.write(`skip     ${label} (exists)\n`);
      skipped++;
      continue;
    }
    if (dryRun) {
      process.stdout.write(`would create ${label}\n`);
      would++;
      continue;
    }
    try {
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(join(TEMPLATES, rel), dest, { force: true });
      process.stdout.write(`created  ${label}\n`);
      created++;
    } catch (err) {
      process.stderr.write(`failed to write ${label}: ${err.message}\n`);
      failed++;
    }
  }

  process.stdout.write(
    dryRun
      ? `\nSummary: ${would} would create, ${skipped} skipped, ${failed} failed. Nothing was written.\n`
      : `\nSummary: ${created} created, ${skipped} skipped, ${failed} failed.\n`,
  );

  if (failed) return 1;
  if (created || would) {
    // Relative only while it stays inside the cwd; an absolute path is clearer
    // than a `../../` chain, and posix separators paste into any shell.
    const rel = relative(process.cwd(), target);
    const base = !rel ? "" : rel.startsWith("..") ? target : rel;
    const where = `${base ? `${base.split(sep).join("/")}/` : ""}docs`;
    process.stdout.write(
      `\nNext: fill the owner and verify fields, then run\n` +
        `  npx agent-docs-kit lint ${where}\n`,
    );
  }
  return 0;
}

function version() {
  return JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf8")).version;
}

function run(argv) {
  const [command, ...rest] = argv;

  if (!command || command === "--help" || command === "-h" || command === "help") {
    process.stdout.write(USAGE);
    return command ? 0 : 2;
  }
  if (command === "--version" || command === "-v") {
    process.stdout.write(`${version()}\n`);
    return 0;
  }
  if (command === "init") return init(rest);
  if (command === "lint") return lintMain(rest);

  process.stderr.write(`unknown command: ${command}\n\n${USAGE}`);
  return 2;
}

process.exit(run(process.argv.slice(2)));
