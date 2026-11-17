# Contributing

## Setup

```bash
npm install
npm run verify
```

`verify` checks formatting, that the plugin's version has a changelog entry, that every TypeScript block in the skills compiles against the published SDK packages pinned in `package.json`, and that every account MCP tool the administration skill names is an operation in Canopy's published API spec.

## Branches and releases

- Work branches come off `development` and merge back into it by pull request.
- A release is a pull request from `development` into `main`, merged with a merge commit, never a squash.
- Merging to `main` releases the version in `plugins/canopy/.claude-plugin/plugin.json`: the release workflow tags `v<version>` and creates a GitHub release from its `CHANGELOG.md` entry, then asks Canopy to run its skill harness against it.
- Every change to a plugin raises its version (`0.2.1` for wording, `0.3.0` for a new skill or command; the plugin stays below 1.0 until Canopy launches) and adds the matching `## <version>` entry to `CHANGELOG.md`.

## When the SDK releases

When `@canopy-io/node`, `@canopy-io/nestjs` or `@canopy-io/browser` releases a version the skill should use, raise its pin in `package.json` in the same pull request as the skill change, so `check:skill` compiles against it.
