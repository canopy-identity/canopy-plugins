# React single-page app: `@canopy-io/react`

A React app with no backend of its own signs in exactly as [spa.md](spa.md) describes, as a **public** OAuth client through Hosted Login. `@canopy-io/react` is a thin layer over `@canopy-io/browser`: a provider, hooks and components that read the browser client. It holds no OAuth, request or cache code of its own, and re-exports everything `@canopy-io/browser` exports, so the app installs and imports one package. Set up the client and the Environment's **Allowed web origins** first ([spa.md](spa.md), "Set up, once per Environment").

React 18 or 19. An app with a backend does not use it: the backend exchanges the code as a confidential client ([choosing.md](choosing.md)).

## The provider

```tsx
import { CanopyProvider } from "@canopy-io/react";
import type { ReactNode } from "react";

declare function navigate(to: string, options: { replace: boolean }): void;

// Wrap the app once, inside the router so the callback can navigate.
export function Root({ children }: { children: ReactNode }) {
  return (
    <CanopyProvider
      issuer="https://canopy-io.com/environments/<environment_id>"
      clientId="<public client_id>"
      redirectUri={`${location.origin}/callback`}
      postLogoutRedirectUri={`${location.origin}/`}
      // `permissions` lets the token answer the common checks with no request.
      scopes={["openid", "profile", "email", "permissions"]}
      onRedirectCallback={(returnTo) => navigate(returnTo, { replace: true })}
    >
      {children}
    </CanopyProvider>
  );
}
```

- The provider creates one client and starts it once: it finishes a sign-in Canopy has just answered, or resumes the session silently (`prompt=none`) and comes back to the page. StrictMode's double effect is safe; the runs are shared. Never call `start()` yourself beside it.
- `onRedirectCallback` gets the page the sign-in started on; hand it to the app's router (React Router's `navigate`, Next.js's `router.replace`). Without it the provider replaces the address through `history`, which a router does not see.
- `resume={false}` on a public site: a sign-in coming back is still finished, but an anonymous visitor is never sent to Canopy.
- To use the same client outside React (a fetch wrapper, a router loader), create it with `createCanopyBrowserClient` and pass `client={canopy}` instead of the options.
- It renders on the server and does nothing there. Next.js App Router: put the provider in a `"use client"` component; the package's modules are already marked.

## Signing in, and the person

```tsx
import {
  CanopyAuthError,
  SignedIn,
  SignedOut,
  useAuth,
  useUser,
} from "@canopy-io/react";

export function Header() {
  const { signIn, signOut, error } = useAuth();
  const user = useUser<{ plan?: string }>();

  return (
    <header>
      <SignedOut>
        <button onClick={() => void signIn()}>Sign in</button>
        {/* needsSignIn is the normal answer for someone with no session. */}
        {error && !(error instanceof CanopyAuthError && error.needsSignIn) ? (
          <p>Sign-in failed: {error.name}</p>
        ) : null}
      </SignedOut>
      <SignedIn>
        <span>
          {user?.email} ({user?.plan ?? "free"})
        </span>
        <button onClick={() => void signOut()}>Sign out</button>
      </SignedIn>
    </header>
  );
}
```

- `useAuth()`: `{ status, isLoading, isSignedIn, userId, orgId, getAccessToken, signIn, signOut, error }`. `status` is `loading` until the provider knows, then `signed-in` or `signed-out`.
- `<SignedIn>` and `<SignedOut>` render nothing while loading, so a sign-in button does not flash. `<RequireAuth fallback={…}>` sends a signed-out reader to Canopy's sign-in and back to the same page: wrap private routes in it.
- `useUser<TCustom>()` returns the ID token's claims (`sub`, `email`, `name`, and the Environment's custom claims marked for the ID token, each optional). Show them; never authorize from them.
- `useAuth().error` is `CanopyAuthError` (Canopy answered; `needsSignIn` means just show the button) or `CanopyConnectionError` (no answer could be read: on a page that never signed in, check **Allowed web origins**).

## Calling your API

```tsx
import { useAccessToken } from "@canopy-io/react";
import { useEffect, useState } from "react";

interface Deal {
  id: string;
  name: string;
}

export function Deals() {
  const getAccessToken = useAccessToken();
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    void (async () => {
      // Refreshed first when it is about to expire; null once signed out.
      const token = await getAccessToken();

      if (!token) {
        return;
      }

      const res = await fetch("/api/deals", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDeals((await res.json()) as Deal[]);
    })();
  }, [getAccessToken]);

  return (
    <ul>
      {deals.map((deal) => (
        <li key={deal.id}>{deal.name}</li>
      ))}
    </ul>
  );
}
```

Ask for the token on every call; never keep it in state, a ref or storage. `getAccessToken` is the same function for the provider's lifetime, so it is safe in effect dependencies. Your API verifies the token with `TokenVerifier` and `audience` set to the public `client_id` ([node.md](node.md)).

## Show only what the person may do

```tsx
import { Can, usePermission } from "@canopy-io/react";

export function DealActions({ teamId }: { teamId: string }) {
  const exporting = usePermission("deals.export");

  return (
    <div>
      <Can permission="deals.update" nodeId={teamId}>
        <button>Edit</button>
      </Can>
      {exporting.allowed ? <button>Export</button> : null}
      {exporting.isLoading ? <span>Checking…</span> : null}
    </div>
  );
}
```

- `<Can permission nodeId fallback>` and `usePermission(permission, { nodeId })` answer whether the person holds the permission at `nodeId` (walking its ancestors), or anywhere in the Environment without one. `usePermissions(checks)` asks several and answers in their order.
- `allowed` is `false` while loading and on an error: nothing appears that the person cannot use.
- The browser client answers: an Environment-wide check from the token's `permissions` claim and a check at the session's organization from `org_permissions`, with no request; other checks go in one request per render, and answers are held until the token changes. A re-render asks nothing new. Never add a cache, a timer, a `useEffect` that re-checks, or a hand-written `fetch` to the evaluate route beside it: each multiplies the requests every visitor's browser makes.
- These checks decide what renders. They never replace the API's own check: the backend authorizes every request ([node.md](node.md), [nestjs.md](nestjs.md)).

## Organizations

```tsx
import { useOrganization, useOrganizationList } from "@canopy-io/react";

export function OrganizationSwitcher() {
  const { orgId, switchOrganization } = useOrganization();
  const { organizations, isLoading } = useOrganizationList();

  if (isLoading) {
    return null;
  }

  return (
    <select
      value={orgId ?? ""}
      onChange={(event) => void switchOrganization(event.target.value)}
    >
      {organizations.map((organization) => (
        <option key={organization.id} value={organization.id}>
          {organization.name}
        </option>
      ))}
    </select>
  );
}
```

- `useOrganization()`: `{ orgId, orgRoles, orgScope, switchOrganization }`, read from the access token. `switchOrganization(id)` is a sign-in round trip into that organization that comes back to the current page.
- `useOrganizationList()`: `{ organizations, isLoading, error }`, the organizations the person belongs to, by name, each with `id`, `name`, `slug`, `roles`, `administers` and `portal_access`. Read once and held until the token changes.
- Only for an Environment with organizations on ([access-models.md](access-models.md)).

## Mistakes specific to React

- Calling `createCanopyBrowserClient` inside a component body makes a client per render: let the provider create it, or create it once at module level and pass `client`.
- Rendering a private page's content and redirecting in an effect when `isSignedIn` is false: the content shows while loading. Use `<RequireAuth>`, or render on `status`.
- Treating `isLoading` as signed out sends a signed-in person to Canopy on every reload.
