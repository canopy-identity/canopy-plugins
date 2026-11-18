// The branding skill's CSS reference matches what Canopy publishes. Every
// `--hp-*` token, `hp-*` class and page name the skill names must be on the
// branding docs page, which lists the published surface; and every token and
// class the page lists must be in the reference, so a name Canopy adds
// reaches the skill.
//
// Usage:
//   node scripts/check-hosted-css.mjs
//   node scripts/check-hosted-css.mjs --docs <file or URL>

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skill = join(root, "plugins/canopy/skills/canopy-branding");
const reference = join(skill, "references/hosted-css.md");
const args = process.argv.slice(2);
const docsIndex = args.indexOf("--docs");
const source =
  docsIndex >= 0
    ? args[docsIndex + 1]
    : "https://canopy-io.com/docs/authentication/branding.md";

const docs = source.startsWith("https://")
  ? await (await fetch(source)).text()
  : readFileSync(source, "utf8");

/** The published names a text mentions: tokens, classes and page names. */
function names(text) {
  const tokens = new Set(text.match(/--hp-[a-z0-9-]+/g) ?? []);
  const classes = new Set(
    (text.match(/\.hp-[a-z0-9_-]+/g) ?? []).map((name) => name.slice(1)),
  );
  const pages = new Set(
    [...text.matchAll(/data-page="([a-z-]+)"/g)].map((match) => match[1]),
  );

  return { tokens, classes, pages };
}

const published = names(docs);

if (published.tokens.size === 0 || published.classes.size === 0) {
  console.error(`no published tokens or classes read from ${source}`);
  process.exit(1);
}

const skillText = readdirSync(skill, { recursive: true })
  .filter((file) => file.endsWith(".md"))
  .map((file) => readFileSync(join(skill, file), "utf8"))
  .join("\n");
const named = names(skillText);
const listed = names(readFileSync(reference, "utf8"));
const docsPages = new Set(
  [...docs.matchAll(/`([a-z]+(?:-[a-z]+)*)`/g)].map((match) => match[1]),
);
const problems = [];

for (const token of named.tokens) {
  if (!published.tokens.has(token)) {
    problems.push(`${token} is not a published token`);
  }
}

for (const name of named.classes) {
  if (!published.classes.has(name)) {
    problems.push(`.${name} is not a published class`);
  }
}

for (const page of named.pages) {
  if (!docsPages.has(page)) {
    problems.push(`data-page="${page}" is not a published page name`);
  }
}

for (const token of published.tokens) {
  if (!listed.tokens.has(token)) {
    problems.push(`${token} is published but missing from the reference`);
  }
}

for (const name of published.classes) {
  if (!listed.classes.has(name)) {
    problems.push(`.${name} is published but missing from the reference`);
  }
}

if (problems.length > 0) {
  console.error(
    `The branding skill and Canopy's published CSS surface (${source}) differ:`,
  );

  for (const problem of problems) {
    console.error(`  ${problem}`);
  }

  process.exit(1);
}

console.log(
  `confirmed: the branding skill names ${named.tokens.size} tokens and ${named.classes.size} classes, all published, and lists every one ${source} publishes`,
);
