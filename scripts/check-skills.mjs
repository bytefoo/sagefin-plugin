#!/usr/bin/env node
// Fails when a skill names an MCP tool that tools.json does not list, or tools.json lists one no
// skill uses. A skill that tells a model to call a tool the server does not have fails in the
// user's session, where nobody who can fix it is watching.
//
// It checks names only. Whether tools.json still matches the server is checked where the server's
// source is.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "plugins", "sagefin");
const known = Object.keys(JSON.parse(readFileSync(join(root, "tools.json"), "utf8")).tools);

// A tool name is snake_case with at least one underscore, in backticks, starting with one of the
// verbs the server uses. Result fields such as `next_cursor` would not match; ours are camelCase.
const TOOL = /`((?:list|get|set|propose|create|update|assign|upload|suggest|compare)_[a-z_]+)`/g;

const skillsDir = join(root, "skills");
const problems = [];
const used = new Set();
let skills = 0;

for (const name of readdirSync(skillsDir)) {
  const file = join(skillsDir, name, "SKILL.md");
  if (!existsSync(file)) continue;
  skills++;
  const text = readFileSync(file, "utf8");

  if (!/^---\nname: [a-z0-9-]+\ndescription: .{40,}\n---\n/.test(text)) {
    problems.push(`${name}: front matter needs a kebab-case name and a description of 40+ characters`);
  }

  for (const [, tool] of text.matchAll(TOOL)) {
    used.add(tool);
    if (!known.includes(tool)) problems.push(`${name}: names \`${tool}\`, which tools.json does not list`);
  }
}

if (skills === 0) problems.push("no skills found: the check read nothing");
for (const tool of known) {
  if (!used.has(tool)) problems.push(`tools.json lists \`${tool}\`, which no skill names`);
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`${skills} skill(s), ${used.size} tool name(s), all listed in tools.json`);
