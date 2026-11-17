# Canopy plugins for Claude Code

Canopy's plugins for [Claude Code](https://claude.com/claude-code). Canopy handles sign-in, an organizational hierarchy and role-based access control as a service; these plugins teach Claude how to work with it.

## Install

```
/plugin marketplace add canopy-identity/canopy-plugins
/plugin install canopy@canopy
```

## What is in it

**`canopy`**: the agent skill for integrating Canopy into an application. It covers choosing a sign-in shape, verifying tokens, authorizing in-process with `@canopy-io/nestjs`, `@canopy-io/node` or `@canopy-io/browser`, the access models, webhooks, and the mistakes to avoid. Claude loads it when a project imports `@canopy-io/*`, calls the Canopy API, or the task names Canopy.

## Documentation

- [AI integration](https://canopy-io.com/docs/ai-integration)
- [The SDKs](https://github.com/canopy-identity/canopy-javascript)

## License

MIT
