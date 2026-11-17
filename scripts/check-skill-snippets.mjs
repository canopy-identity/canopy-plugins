// Type-checks every TypeScript block in the plugin's skills against the
// published Canopy SDK packages pinned in package.json, so the code an
// assistant copies from a skill compiles against the SDK a customer installs.
// A block that stops compiling fails CI.
//
// Each ```ts block is written out as its own module and compiled with
// strict settings. A block must therefore be complete: its imports, and a
// `declare` for anything it uses but does not define.
//
// When a new SDK version changes what the skill may use, raise the pins in
// package.json in the same pull request as the skill change.

import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(root, "plugins/canopy/skills");
const outDir = join(root, ".skill-snippets");

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);

    if (statSync(path).isDirectory()) {
      return markdownFiles(path);
    }

    return name.endsWith(".md") ? [path] : [];
  });
}

const fence = /^```(ts|typescript)\s*$/;
const snippets = [];

for (const file of markdownFiles(skillsDir)) {
  const lines = readFileSync(file, "utf8").split("\n");

  for (let i = 0; i < lines.length; i += 1) {
    if (!fence.test(lines[i])) {
      continue;
    }

    const start = i + 1;
    let end = start;

    while (end < lines.length && lines[end] !== "```") {
      end += 1;
    }

    snippets.push({
      file,
      line: start + 1,
      code: lines.slice(start, end).join("\n"),
    });
    i = end;
  }
}

if (snippets.length === 0) {
  console.error(
    `no TypeScript blocks found under ${relative(root, skillsDir)}`,
  );
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const origins = new Map();

snippets.forEach((snippet, index) => {
  const name = `snippet-${String(index).padStart(3, "0")}.ts`;

  writeFileSync(join(outDir, name), `${snippet.code}\n`);
  origins.set(name, snippet);
});

/** The settings the SDK packages are built with, which a customer's project shares. */
const base = {
  compilerOptions: {
    target: "ES2022",
    module: "ESNext",
    moduleResolution: "bundler",
    types: ["node"],
    strict: true,
    noImplicitOverride: true,
    noFallthroughCasesInSwitch: true,
    verbatimModuleSyntax: true,
    isolatedModules: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    noEmit: true,
    skipLibCheck: true,
    esModuleInterop: true,
    forceConsistentCasingInFileNames: true,
  },
};

writeFileSync(
  join(outDir, "tsconfig.json"),
  JSON.stringify(
    {
      compilerOptions: {
        ...base.compilerOptions,
        // A consumer's project: `strict`, without the two extra flags the
        // packages hold themselves to, which application code rarely
        // enables. A snippet that needed them would not compile in the
        // projects it is copied into.
        exactOptionalPropertyTypes: false,
        noUncheckedIndexedAccess: false,
        lib: ["ES2022", "DOM"],
        declaration: false,
      },
      include: ["*.ts"],
    },
    null,
    2,
  ),
);

try {
  execFileSync(
    join(root, "node_modules/.bin/tsc"),
    ["-p", join(outDir, "tsconfig.json"), "--pretty", "false"],
    { encoding: "utf8", stdio: "pipe" },
  );
} catch (error) {
  const output = `${error.stdout ?? ""}${error.stderr ?? ""}`;

  // Point each error at the markdown line it came from, not the temp file.
  const mapped = output.replace(
    /(?:[^\s(]*\/)?(snippet-\d{3}\.ts)\((\d+),(\d+)\)/g,
    (match, name, line, column) => {
      const origin = origins.get(name);

      if (!origin) {
        return match;
      }

      return `${relative(root, origin.file)}:${origin.line + Number(line) - 1}:${column}`;
    },
  );

  console.error(mapped.trim());
  console.error(
    `\n${snippets.length} skill snippets checked; see errors above.`,
  );
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
console.log(`confirmed: ${snippets.length} skill snippets compile`);
