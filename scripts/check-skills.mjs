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

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
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

// One plugin, three manifests: Claude's, the shared Agent Plugins one that Codex and Cursor read,
// and Gemini's. A version bumped in one and not the others ships different things under one name.
const manifests = {
  ".claude-plugin/plugin.json": JSON.parse(readFileSync(join(root, ".claude-plugin", "plugin.json"), "utf8")),
  "plugin.json": JSON.parse(readFileSync(join(root, "plugin.json"), "utf8")),
  "gemini-extension.json": JSON.parse(readFileSync(join(root, "gemini-extension.json"), "utf8")),
};
const [first, ...rest] = Object.entries(manifests);
for (const [file, manifest] of rest) {
  for (const key of ["name", "version"]) {
    if (manifest[key] !== first[1][key]) {
      problems.push(`${file}: ${key} is "${manifest[key]}", but ${first[0]} says "${first[1][key]}"`);
    }
  }
}

// Only Claude's manifest may register the MCP server. The others have no way to carry the
// member's token, and a server entry without one answers every call with a 401.
for (const file of ["plugin.json", "gemini-extension.json"]) {
  if ("mcpServers" in manifests[file]) problems.push(`${file}: must not declare mcpServers`);
}
if (existsSync(join(root, "mcp.json"))) {
  problems.push("mcp.json: the shared manifest must not register the MCP server; see the README");
}
for (const tool of known) {
  if (!used.has(tool)) problems.push(`tools.json lists \`${tool}\`, which no skill names`);
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(
  `${skills} skill(s), ${used.size} tool name(s), all listed in tools.json; ` +
    `${Object.keys(manifests).length} manifests agree on ${first[1].name} ${first[1].version}`,
);
