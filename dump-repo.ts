#!/usr/bin/env ts-node
/**
 * Recursively dump all source‑code texts in a repo to one JSON file.
 *
 * Usage:
 *   ts-node dump-repo.ts [rootDir] [outputFile]
 * Example:
 *   ts-node dump-repo.ts . repo_dump.json
 */

import { promises as fs } from "fs";
import path from "path";

const ROOT   = path.resolve(process.argv[2] ?? ".");
const OUT    = path.resolve(process.argv[3] ?? "repo_dump.json");

// Adjust these as you like
const INCLUDE = /\.(tsx?|jsx?|json|ya?ml|vue|html?|md|css|scss|tsup|vitest?)$/i;
const EXCLUDE_DIRS = new Set([
  ".git", "node_modules", ".pnpm", ".idea",
  "dist", "build", ".cache", ".next"
]);

async function walk(dir: string, base: string, acc: Record<string, string>) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel  = path.relative(base, full);
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) await walk(full, base, acc);
    } else if (INCLUDE.test(entry.name)) {
      acc[rel] = await fs.readFile(full, "utf8");
    }
  }
}

(async () => {
  const files: Record<string, string> = {};
  await walk(ROOT, ROOT, files);
  await fs.writeFile(OUT, JSON.stringify(files, null, 2), "utf8");
  console.log(`✅ Dumped ${Object.keys(files).length} files → ${OUT}`);
})().catch(err => {
  console.error("❌ Dump failed:", err);
  process.exit(1);
});

