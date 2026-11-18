// Every account MCP tool a skill or command names is a tool the server
// offers. The server offers one tool per public API operation, named by its
// operationId, so each `Api…Controller_…` name in the plugin must be an
// operationId in Canopy's published API spec; a name ending in `_*` must match
// at least one. A renamed or removed operation fails here instead of sending
// an assistant after a tool that does not exist.
//
// Usage:
//   node scripts/check-account-tools.mjs
//   node scripts/check-account-tools.mjs --spec <file or URL>

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const plugin = join(root, "plugins/canopy");
const args = process.argv.slice(2);
const specIndex = args.indexOf("--spec");
const source =
  specIndex >= 0
    ? args[specIndex + 1]
    : "https://canopy-io.com/openapi/api.json";

const spec = source.startsWith("https://")
  ? await (await fetch(source)).json()
  : JSON.parse(readFileSync(source, "utf8"));

const operations = new Set();

for (const item of Object.values(spec.paths ?? {})) {
  for (const operation of Object.values(item)) {
    if (operation && typeof operation === "object" && operation.operationId) {
      operations.add(operation.operationId);
    }
  }
}

const files = readdirSync(plugin, { recursive: true })
  .filter((file) => file.endsWith(".md"))
  .map((file) => join(plugin, file));
const missing = [];

let named = 0;

for (const file of files) {
  const text = readFileSync(file, "utf8");

  for (const [name] of text.matchAll(/\bApi\w+Controller_(?:\w+|\*)/g)) {
    named += 1;

    const found = name.endsWith("_*")
      ? [...operations].some((id) => id.startsWith(name.slice(0, -1)))
      : operations.has(name);

    if (!found) {
      missing.push(`${name} (${file.slice(root.length + 1)})`);
    }
  }
}

if (operations.size === 0) {
  console.error(`no operations read from ${source}`);
  process.exit(1);
}

if (missing.length > 0) {
  console.error(
    `The plugin names tools the account MCP server does not offer (${source}):`,
  );

  for (const name of missing) {
    console.error(`  ${name}`);
  }

  process.exit(1);
}

console.log(
  `confirmed: the ${named} account tool names in the plugin are operations in ${source}`,
);
