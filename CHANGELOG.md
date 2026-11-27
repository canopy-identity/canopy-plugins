# Changelog

## 0.9.1

The skill follows the Developer Console's new layout. Token lifetimes, custom claims and the issuer and signing keys are on **Tokens & Keys**, beside **Authentication**, and an Environment's **Allowed web origins** are on **Authentication → Allowed URLs**. `references/spa.md`, `node.md`, `nestjs.md` and `choosing.md` send a developer there. The skill's code compiles against `@canopy-io/node` 0.26.2.

## 0.9.0

The skill follows `@canopy-io/nextjs` 0.1.0. A new reference, `references/nextjs-app.md`, teaches a Next.js App Router app with a server to sign in there as a confidential client: the server-only environment variables, `canopyProxy` in `proxy.ts` (or `middleware.ts` with `runtime: "nodejs"` on 15.5) with `protect`, `auth()` and `can()` in server components and server actions (authorizing every action, not only the page), `accessToken` for the app's own API, and `clientSession` with `CanopySessionProvider` for client components. `SKILL.md` routes a Next.js app there and lists the package, `choosing.md` and `react.md` point a Next.js app with a server to it, and `mistakes.md` names signing in from the browser in such an app. Rule 7 and `mistakes.md` now say a confidential client's requests that refresh together within 30 seconds are all answered with the same refresh token, so a backend needs no lock for them. The skill's code compiles against `@canopy-io/nextjs` 0.1.0 and Next.js 16.

## 0.8.0

The skill follows `@canopy-io/angular` 0.1.0. A new reference, `references/angular.md`, teaches an Angular single-page app `provideCanopy` with `apiOrigins` and `canopyAuthInterceptor`, `canopyAuthGuard` on private routes, the `CanopyAuth` signals with `*canopySignedIn` and `*canopySignedOut`, `*canopyCan` and `CanopyPermissions.can()` for what renders, and `organizationList()` with `switchOrganization()` for a switcher. `SKILL.md`, `spa.md`, `choosing.md` and `mistakes.md` name the Angular package beside the React one. The skill's code compiles against `@canopy-io/angular` 0.1.0 and Angular 21.

## 0.7.0

The skill follows `@canopy-io/react` 0.1.0 and `@canopy-io/browser` 0.5.0. A new reference, `references/react.md`, teaches a React single-page app the provider, the hooks and the components: `<CanopyProvider>` with the router's navigate as `onRedirectCallback`, `useAuth`, `useUser`, `useAccessToken` on every call to the API, `<Can>` and `usePermission` for what renders, and `useOrganization` with `useOrganizationList` for an organization switcher. `references/spa.md` adds `listOrganizations()`. `SKILL.md` gains a rule and `choosing.md` a section: front-end permission checks decide what renders and never replace the backend's check, and `mistakes.md` names the two ways to get that wrong. Both references now say the `permissions` scope works only on a client registered with it (a client with the default scopes refuses it with `invalid_scope`, and every sign-in fails), and `mistakes.md` names it. `check:skill` now compiles ```tsx blocks too, and the skill's code compiles against `@canopy-io/react` 0.1.0.

## 0.6.0

The skill follows `@canopy-io/browser` 0.4.0. `references/spa.md` teaches the permission checks a single-page app makes to decide what a page shows: ask for the `permissions` scope, `checkPermission` and `checkPermissions` (answered from the token where it can say, one request per tick otherwise, held until the token changes), `getPermissionState` and `listPermissions`, and never to re-check on a timer or add a cache of its own. It also covers `start({ resume: false })` for public pages, a resume coming back to the page it left, and `subscribe` with `getSnapshot` for a framework to render from. Its code compiles against `@canopy-io/browser` 0.4.0.

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
