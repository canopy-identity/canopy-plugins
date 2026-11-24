# Canopy plugins for Claude Code

Canopy's plugins for [Claude Code](https://claude.com/claude-code). Canopy handles sign-in, an organizational hierarchy and role-based access control as a service; these plugins teach Claude how to work with it.

## Install

```
/plugin marketplace add canopy-identity/canopy-plugins
/plugin install canopy@canopy
```

## What is in it

**`canopy`**: the agent skill for integrating Canopy into an application. It covers choosing a sign-in shape, verifying tokens, authorizing in-process with `@canopy-io/nestjs`, `@canopy-io/node`, `@canopy-io/browser`, `@canopy-io/react`, `@canopy-io/angular` or `@canopy-io/nextjs`, the access models, webhooks, and the mistakes to avoid. Claude loads it when a project imports `@canopy-io/*`, calls the Canopy API, or the task names Canopy.

**`canopy-admin`**: the agent skill for administering a Canopy Account through the account MCP server: which tool does which job, telling apart the operations that read alike at the Account, Environment and organization levels, the parameters to get right, and previewing a change before it removes or replaces something.

**`canopy-branding`** and the **`/canopy:brand-from-site`** command: make Canopy's hosted sign-in pages look like your website or a design. Claude reads the design, maps it onto the branding settings (and the published `--hp-*` tokens where no setting reaches), uploads its logo, favicon and pictures to Canopy, previews the sign-in page for you, and saves only when you agree:

```
/canopy:brand-from-site https://example.com
```

It also takes a folder holding a design's HTML and CSS, or screenshots.

**MCP servers**: installing the plugin connects two.

- `canopy`, the account server at `https://auth.canopy-io.com/mcp/v1`: one tool per public API operation. On its first use Claude Code opens your browser; you sign in and approve one Environment and what Claude may do there, and every call acts as you within that approval.
- `canopy-docs`, at `https://canopy-io.com/mcp`: answers questions from Canopy's docs, with no sign-in.

## Documentation

- [AI integration](https://canopy-io.com/docs/ai-integration)
- [The SDKs](https://github.com/canopy-identity/canopy-javascript)

## License

MIT
