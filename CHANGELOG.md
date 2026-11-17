# Changelog

## 1.0.1

The custom claims overflow fallback no longer leads an app to need an API key to start. `references/mistakes.md` and `references/node.md` say the read from the API is for an app that already holds a key: create the client only when `CANOPY_API_KEY` is set, never require it at startup, and without one treat an overflowed claim as not set.

## 1.0.0

The Canopy plugin moves to its own repository, `canopy-identity/canopy-plugins`, and its marketplace is named `canopy`. Install it with:

```
/plugin marketplace add canopy-identity/canopy-plugins
/plugin install canopy@canopy
```

The plugin holds the integration skill it held before: choosing a sign-in shape, verifying tokens, authorizing with `@canopy-io/nestjs`, `@canopy-io/node` or `@canopy-io/browser`, the access models, webhooks, and the mistakes to avoid. Its code compiles against `@canopy-io/node` 0.25.1, `@canopy-io/nestjs` 0.9.4 and `@canopy-io/browser` 0.3.0.
