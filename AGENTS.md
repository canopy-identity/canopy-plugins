# AGENTS.md

Guidance for AI coding agents working in this repository.

- The marketplace is `.claude-plugin/marketplace.json`; each plugin is a folder under `plugins/`. Today there is one, `plugins/canopy`.
- A skill is `plugins/<plugin>/skills/<skill>/SKILL.md` and the reference files it links. Keep `SKILL.md` short: it is read whenever the skill is chosen, the references only when a task needs them.
- Every TypeScript block in a skill must compile against the published SDK packages pinned in `package.json` (`npm run check:skill`). A block is complete on its own: its imports, and a `declare` for anything it uses but does not define.
- The administration skill (`plugins/canopy/skills/canopy-admin`) names account MCP tools by their operation ids. Each must be an operation in Canopy's published API spec (`npm run check:admin-tools`). Prove a change to it with the account tasks: `npm run eval -- --account-only --skill <this checkout>` in `apps/_sandbox-eval`.
- A change to a plugin raises its `version` in `plugin.json` and adds a `## <version>` entry to `CHANGELOG.md` (`npm run check:release`). Claude Code updates an installed plugin by its version.
- Canopy runs the integration skill's blocks against a live Canopy (`apps/_sandbox-skill` in `canopy-identity/canopy`) and grades assistants that use it (`apps/_sandbox-eval`). A skill change is proven there before it is released: `npm run eval -- --skill <this checkout>`.
