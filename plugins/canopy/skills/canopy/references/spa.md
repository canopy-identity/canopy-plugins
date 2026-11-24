# Single-page app with no backend: `@canopy-io/browser`

A single-page app with no server of its own signs in through Hosted Login as a **public** OAuth client: it has a `client_id` and no secret, and PKCE binds the code to the browser that started the sign-in. `@canopy-io/browser` runs that flow. An app that has a backend uses it instead, as a confidential client or a backend proxy ([choosing.md](choosing.md)): the browser then never holds a token.

## Set up, once per Environment

1. Register the OAuth client with **Client Type** set to **Public** (Console: Integrations → OAuth Clients, or `POST /api/v1/oauth-clients` with `"client_type": "public"`). The type cannot change later. Register the app's callback URL exactly, and the page `signOut()` lands on as a post-logout redirect URL.
2. Add the app's origin, scheme and host only (`https://app.example.com`), to that Environment's **Allowed web origins** (Console: Tenant → Authentication → Sign-in methods, the Environment's row). The list is each Environment's own: a site listed on another Environment does not count, so list the local dev origin on the development Environment and the production origin on the production one. Without it every sign-in fails: with `CanopyConnectionError` when no Environment lists the site (the browser cannot read the answer), or with `CanopyAuthError` code `access_denied` (status `403` from the token endpoint) when another Environment does.

## The whole integration

```ts
import { createCanopyBrowserClient } from "@canopy-io/browser";

declare const signInButton: HTMLButtonElement;
declare const signOutButton: HTMLButtonElement;
declare function showSignedIn(name: string | undefined): void;
declare function showSignedOut(): void;

// The issuer is the Environment's (Console: Authentication → Signing keys).
const canopy = createCanopyBrowserClient({
  issuer: "https://canopy-io.com/environments/<environment_id>",
  clientId: "<public client_id>",
  redirectUri: `${location.origin}/callback`,
  postLogoutRedirectUri: `${location.origin}/`,
  onSessionEnd: () => showSignedOut(),
});

// Once per page load: finishes a sign-in Canopy just answered, or resumes
// Canopy's session without a page (prompt=none) when memory is empty and
// comes back to this page. A second call shares the first one's run.
const result = await canopy.start();

if (result.status === "signed-in") {
  showSignedIn(canopy.getClaims()?.name);
} else if (result.status === "signed-out" || result.status === "error") {
  // `error.needsSignIn` (login_required, interaction_required) is the normal
  // answer for someone with no Canopy session: show the button, never retry.
  showSignedOut();
}

signInButton.onclick = () => void canopy.signIn();
signOutButton.onclick = () => void canopy.signOut();

// Every call to your API: a current token, refreshed first when it is close
// to expiring; null once the session has ended.
export async function callApi(path: string): Promise<Response> {
  const token = await canopy.getAccessToken();

  if (!token) {
    throw new Error("Signed out");
  }

  return fetch(path, { headers: { Authorization: `Bearer ${token}` } });
}
```

Pass your app's language to `signIn({ uiLocales: "es" })` so the hosted pages match it; it is sent as `ui_locales`. Left out, the pages follow the person's stored language, then the browser's.

On a public page whose anonymous visitors should not be sent through Canopy, call `start({ resume: false })`: it still finishes a sign-in that has just come back, but never redirects.

`getClaims<TCustom>()` also reads the Environment's custom claims marked for the ID token, typed and each optional (`canopy.getClaims<{ plan?: string }>()?.plan`): a value that is not stored, or did not fit (`custom_claims_overflow`), is absent. Show them; never authorize from them in the browser.

Your API verifies that access token like any Hosted Login token: `TokenVerifier` with `audience` set to the public `client_id` ([node.md](node.md)). The browser package never verifies signatures; it checks the ID token's issuer, audience and nonce, which is what OpenID Connect asks of a token received straight from the token endpoint.

## Show only what the person may do

```ts
import { createCanopyBrowserClient } from "@canopy-io/browser";

declare const editButton: HTMLButtonElement;
declare const exportButton: HTMLButtonElement;
declare const teamId: string;

const canopy = createCanopyBrowserClient({
  issuer: "https://canopy-io.com/environments/<environment_id>",
  clientId: "<public client_id>",
  redirectUri: `${location.origin}/callback`,
  // Only when this client is registered with the `permissions` scope; see
  // below. A client with the default scopes refuses it.
  scopes: ["openid", "profile", "email", "permissions"],
});

// Checks made in the same tick go in one request; answers are held until
// the token is refreshed, the organization changes or the person signs out.
const [canEdit, canExport] = await Promise.all([
  canopy.checkPermission("deals.update", { nodeId: teamId }),
  canopy.checkPermission("deals.export"),
]);

editButton.hidden = !canEdit;
exportButton.hidden = !canExport;
```

- The `permissions` scope works only on a client registered with it: a client created with the defaults may request `openid`, `profile` and `email` alone, and refuses any other scope with `invalid_scope`, so every sign-in fails. Add `"permissions"` to `scopes` only when the OAuth client's **Scopes** (Console: Integrations → OAuth Clients, or `scopes` on the API) include it; when you cannot tell, leave `scopes` out. Every check still works without it, asked from the API instead of answered by the token.
- A check with no `nodeId` asks whether the person holds the permission anywhere in the Environment; with one, at that node, walking its ancestors. The token's `permissions` claim answers the first and `org_permissions` a check at the session's organization (`org_id`), with no request; other checks go to `POST /v1/identity/auth/me/permissions/evaluate`.
- `getPermissionState(permission, { nodeId })` reads an answer without asking: `loading`, `allowed`, `denied` or `error`. Show a gated control only on `allowed`. `listPermissions()` returns every key the person holds.
- Never re-check on a timer or wrap the client in a cache of your own: it already holds each answer as long as it may. Holding answers for less multiplies the requests every visitor's browser makes.
- These checks decide what a page shows. A permission removed meanwhile can leave a control showing until the next refresh, about 15 minutes; your API authorizes every request it receives.
- `listOrganizations()` returns the organizations the person belongs to, by name (`id`, `name`, `slug`, `roles`), for an organization switcher; `signIn({ organization: id })` moves the session into one. Read once and held like a permission answer; `getOrganizationsState()` reads it without asking.
- `getAccessTokenClaims()` reads the access token's claims (`permissions`, `org_id`, `org_roles`, `org_permissions`, custom claims), for display only.

## Rendering from a framework

In React, use `@canopy-io/react` ([react.md](react.md)) rather than wiring this by hand. Elsewhere:

`subscribe(listener)` calls `listener` when the session changes or a permission answer arrives, and returns the function that stops it. `getSnapshot()` returns `{ status, claims, error }`, the same object until something changes: `status` is `loading` until `start()` settles, then `signed-in` or `signed-out`. That is the shape `useSyncExternalStore` and Angular signals read. The client touches no browser global until it is used, so it can be created during server rendering; call `start()` only in the browser.

## What the package does, so the app does not

- Keeps the tokens in memory only. A reload empties memory; `start()` gets new tokens with `prompt=none` while the person's Canopy session lasts, so nothing goes in `localStorage` or `sessionStorage`. `sessionStorage` holds only the PKCE verifier and `nonce` for the round trip, removed when it returns.
- Checks `state` against the sign-in this browser started, and removes `code` and `state` from the address bar.
- Sends one refresh at a time, so the rotated refresh token is never presented twice from the page.
- Runs `start()` once however often it is called, so a framework that runs its effects twice exchanges the code once.
- Batches permission checks and holds their answers, and the organizations list, until the token changes, so a page asks once, not once per control or per render.
- Signs out of both halves: revokes the refresh token, then sends the browser to the end-session endpoint with the ID token as the hint. Without the second half the next `start()` signs the person straight back in.

## How long a session lasts

A public client's session ends a fixed time after sign-in, however often it refreshes: 30 days by default, 1 to 90 per Environment (**Public app session lifetime**, Console: Tenant → Authentication → Tokens). Then a refresh is refused, `getAccessToken()` answers `null` and `onSessionEnd` fires: show the sign-in button. A refresh replayed from another browser ends that sign-in's session; the person's other sessions keep working.

## Errors

- `CanopyAuthError`: Canopy answered with an error. Branch on `code`. A permission check refused for coming too often has `code` `rate_limited` and `retryAfterSeconds`; the client holds the failure and asks again only after that wait. `access_denied` from the token endpoint (`status` 403) means this Environment does not list the page's site under **Allowed web origins**. `needsSignIn` is true for `login_required` and `interaction_required`, the answers to a silent attempt that found no session or needs the person (a second factor, a policy). `state_mismatch` means the URL answered a sign-in this browser did not start: show the sign-in button.
- `CanopyConnectionError`: no response could be read. A browser reports a cross-origin refusal exactly like a network failure, so on a page that has never signed in, check **Allowed web origins** first.

A mobile or desktop app is a public client too, but it opens the authorize URL in the system browser (`ASWebAuthenticationSession`, Custom Tabs) and registers a custom scheme (`com.example.app:/callback`) or a loopback redirect URI; this package is for browsers only.
