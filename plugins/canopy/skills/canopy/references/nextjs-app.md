# Next.js app: `@canopy-io/nextjs`

A Next.js App Router app signs in on its own server as a **confidential** OAuth client through Hosted Login. `@canopy-io/nextjs` holds the session in an encrypted, HttpOnly cookie that only the server can read, refreshes it in the proxy, and answers permission checks in server components, route handlers and server actions. A page arrives already signed in, and a protected route turns a signed-out visitor away before any HTML is sent. Token verification and permission checks are `@canopy-io/node`'s (`TokenVerifier`, `LocalAuthorizer`); the package installs it.

Next.js 15.5 or 16, Node.js runtime. A Next.js app with no server of its own (a static export) is a single-page app instead: [react.md](react.md).

## Set up, once per Environment

1. Register an OAuth client (Console: Integrations → OAuth Clients) with **Client Type** **Confidential**, the redirect URI `https://app.example.com/auth/callback`, and `https://app.example.com/` as a post-logout redirect URL.
2. Set the server's environment variables. None is ever exposed to the browser: never prefix one with `NEXT_PUBLIC_`.

```bash
CANOPY_ISSUER=https://auth.canopy-io.com/environments/<environment_id>
CANOPY_CLIENT_ID=<client_id>
CANOPY_CLIENT_SECRET=<client_secret>
CANOPY_APP_URL=https://app.example.com
# Seals the session cookie: at least 32 characters, from `openssl rand -base64 32`.
CANOPY_SECRET=<random secret>
# Only for permission checks at a node: a secret API key from the same Environment.
CANOPY_API_KEY=<secret API key>
```

## The proxy

```ts
// proxy.ts at the project root (Next.js 16)
import { canopyProxy } from "@canopy-io/nextjs";

// A signed-out visitor to /reports, or anything under it, is sent to sign in
// and back to the page they asked for.
export default canopyProxy({ protect: ["/reports", "/settings"] });

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- On Next.js 15.5 the file is `middleware.ts`, and `config` adds `runtime: "nodejs"`. The package does not run on the edge runtime.
- The proxy answers `/auth/sign-in`, `/auth/callback` and `/auth/sign-out` itself; the app writes no route for them. Link to them: `<a href="/auth/sign-in?returnTo=/reports">` and `<a href="/auth/sign-out">`. `returnTo` is only ever a path on this site.
- On every other request it opens the cookie and reads the access token's expiry. That sends nothing to Canopy. Shortly before the token expires it refreshes, once for all the requests of a page that arrive together. Requests on other instances that refresh at the same moment are all answered with the same new refresh token, so none signs the person out: never add a lock or a shared store for refreshes.
- `scopes` defaults to `openid`, `profile` and `email`. Add `"permissions"` only when the OAuth client's **Scopes** include it: a client created with the defaults refuses it with `invalid_scope`, and every sign-in fails. With it, checks with no node cost no request.

## Who is signed in, and what they may do

```tsx
// app/deals/[teamId]/page.tsx, a server component
import { auth } from "@canopy-io/nextjs";

export default async function DealsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const { isSignedIn, user, can } = await auth();

  if (!isSignedIn) {
    return <a href={`/auth/sign-in?returnTo=/deals/${teamId}`}>Sign in</a>;
  }

  return (
    <>
      <p>Signed in as {user?.email}</p>
      {(await can("deals.write", { nodeId: teamId })) && (
        <button>Edit deals</button>
      )}
    </>
  );
}
```

- `auth()` works in server components, route handlers and server actions. It returns `isSignedIn`, `userId`, `user` (the ID token's claims: show them, never authorize from them), `claims` (the verified access token's), `organization` (`{ orgId, orgRoles, orgScope }`), `accessToken` and `can`. Calling it several times in one render verifies once.
- `can(permission, { nodeId })` is whether the person holds the permission at `nodeId` (walking its ancestors), or anywhere in the Environment without one. A check with no node is answered from the token's `permissions` claim, and a check at the session's organization from `org_permissions`, with no request. Any other check reads the identity's grants with `CANOPY_API_KEY` and holds them for 60 seconds, revalidating with an `ETag`; a repeated check asks nothing new.
- Take `nodeId` from your own data or the route (then authorize the write against the same node), never from a value the browser posts that the server does not check.

## Calling your own API, and actions that write

```ts
// app/deals/actions.ts
"use server";

import { auth } from "@canopy-io/nextjs";

declare function saveDeal(teamId: string, title: string): Promise<void>;

export async function createDeal(teamId: string, title: string): Promise<void> {
  const { isSignedIn, can } = await auth();

  // A server action is a public endpoint: authorize here, not only in the page.
  if (!isSignedIn || !(await can("deals.write", { nodeId: teamId }))) {
    throw new Error("Not allowed");
  }

  await saveDeal(teamId, title);
}

export async function listDeals(): Promise<unknown> {
  const { accessToken } = await auth();
  const response = await fetch("https://api.example.com/deals", {
    headers: { Authorization: `Bearer ${accessToken ?? ""}` },
  });

  return response.json();
}
```

- A separate API verifies the token with `TokenVerifier` and `audience` set to the same `client_id` ([node.md](node.md)).
- `accessToken` is for server code only. Never pass it to a client component, put it in a cookie of your own, or render it.

## Client components

```tsx
// app/layout.tsx
import { auth, clientSession } from "@canopy-io/nextjs";
import { CanopySessionProvider } from "@canopy-io/nextjs/client";
import type { ReactNode } from "react";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CanopySessionProvider session={clientSession(await auth())}>
          {children}
        </CanopySessionProvider>
      </body>
    </html>
  );
}
```

```tsx
// app/avatar.tsx
"use client";

import { useCanopySession } from "@canopy-io/nextjs/client";

export function Avatar() {
  const { isSignedIn, user } = useCanopySession();

  return isSignedIn ? (
    <span>{user?.name}</span>
  ) : (
    <a href="/auth/sign-in">Sign in</a>
  );
}
```

- `clientSession` hands a client component who is signed in and the organization, and no token. The client entry sends no request.
- A permission answer reaches a client component as a prop, decided by `can()` in the server component that renders it. Never add `@canopy-io/react` or `@canopy-io/browser` to a Next.js app that uses this package: it would start a second, browser-side sign-in.

## Mistakes specific to Next.js

- **A secret in a `NEXT_PUBLIC_` variable.** `CANOPY_CLIENT_SECRET`, `CANOPY_SECRET` and `CANOPY_API_KEY` stay server-only.
- **A protected page with no check of its own.** `protect` turns signed-out visitors away; a page or action that needs a permission still calls `can()` for it.
- **A `TokenVerifier` or `LocalAuthorizer` created per request beside `auth()`.** The package keeps one of each for the process; a new one per request reads the signing keys and the grants every time.
- **The edge runtime.** The package needs Node.js; on Next.js 15.5 set `runtime: "nodejs"` in `middleware.ts`.
- **On a serverless host, a cold instance for every page.** Each cold start reads the grants in full again; keep instances warm when pages check permissions at nodes.
