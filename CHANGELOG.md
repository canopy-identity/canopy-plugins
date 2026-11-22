# Changelog

## 0.5.0

The skill follows `@canopy-io/node` 0.26.0, whose `LocalAuthorizer` revalidates a subject's grants with their `ETag` instead of re-reading them. `references/node.md` and `references/nestjs.md` say a refresh Canopy answers `304` costs one small request, so the 60-second default stays and the cache time is never raised to save calls.

## 0.4.0

The branding skill and `/canopy:brand-from-site` now set the logo, favicon and pictures. Canopy's image fields take only an image uploaded to Canopy, so the skill uploads each one from its public address with `ApiBrandingController_uploadImage`, puts the address Canopy answers in the field, and previews it before saving. It knows each kind's limits and says a refusal's reason. An image with no public address (an inline SVG logo, a local file, a screenshot) is left for the user to upload in the Console.

## 0.3.0

A new skill, `canopy-branding`, and a command, `/canopy:brand-from-site <url, folder or screenshots>`, make Canopy's hosted pages look like a website or a design: Claude reads the design, maps it to the branding settings first and to the published `--hp-*` tokens only where no setting reaches, previews the sign-in page and opens it for you, and saves only on your word. `references/hosted-css.md` lists every published token, class and page name.

`check:account-tools` (formerly `check:admin-tools`) now checks every account MCP tool any skill or command names, and `check:hosted-css` keeps the branding skill's CSS reference in step with the tokens and classes Canopy publishes, both ways.

## 0.2.0

Installing the plugin connects Canopy's two MCP servers: the account server (`canopy`, `https://auth.canopy-io.com/mcp/v1`), which signs you in through your browser on first use and acts as you in the Environment you approve, and the docs server (`canopy-docs`, `https://canopy-io.com/mcp`).

A new skill, `canopy-admin`, teaches Claude to administer an Account through the account server: picking the tool at the level the request means (Account, Environment or organization), the parameters to get right, doing a job in the fewest calls, and previewing a change before it removes or replaces something.

## 0.1.1

The custom claims overflow fallback no longer leads an app to need an API key to start. `references/mistakes.md` and `references/node.md` say the read from the API is for an app that already holds a key: create the client only when `CANOPY_API_KEY` is set, never require it at startup, and without one treat an overflowed claim as not set.

## 0.1.0

The Canopy plugin moves to its own repository, `canopy-identity/canopy-plugins`, and its marketplace is named `canopy`. Install it with:

```
/plugin marketplace add canopy-identity/canopy-plugins
/plugin install canopy@canopy
```

The plugin holds the integration skill it held before: choosing a sign-in shape, verifying tokens, authorizing with `@canopy-io/nestjs`, `@canopy-io/node` or `@canopy-io/browser`, the access models, webhooks, and the mistakes to avoid. Its code compiles against `@canopy-io/node` 0.25.1, `@canopy-io/nestjs` 0.9.4 and `@canopy-io/browser` 0.3.0.
