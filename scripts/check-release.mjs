// Every plugin version is released with a changelog entry: the version in
// plugins/canopy/.claude-plugin/plugin.json must have its own `## <version>`
// heading in CHANGELOG.md. Claude Code updates an installed plugin by its
// version, so a change that ships without a new one never reaches anyone.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(join(root, "plugins/canopy/.claude-plugin/plugin.json"), "utf8"),
);
const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");

if (typeof manifest.version !== "string" || manifest.version.length === 0) {
  console.error("plugins/canopy/.claude-plugin/plugin.json has no version");
  process.exit(1);
}

if (!changelog.split("\n").includes(`## ${manifest.version}`)) {
  console.error(
    `CHANGELOG.md has no "## ${manifest.version}" entry for the plugin's version`,
  );
  process.exit(1);
}

console.log(`confirmed: plugin ${manifest.version} has a changelog entry`);
