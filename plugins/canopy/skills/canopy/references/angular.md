# Angular single-page app: `@canopy-io/angular`

An Angular app with no backend of its own signs in exactly as [spa.md](spa.md) describes, as a **public** OAuth client through Hosted Login. `@canopy-io/angular` is a thin layer over `@canopy-io/browser`: providers, signal services, a route guard, an HTTP interceptor and structural directives that read the browser client. It holds no OAuth, request or cache code of its own, and re-exports everything `@canopy-io/browser` exports, so the app installs and imports one package. Set up the client and the Environment's **Allowed web origins** first ([spa.md](spa.md), "Set up, once per Environment").

Angular 20, 21 or 22, standalone APIs. An app with a backend does not use it: the backend exchanges the code as a confidential client ([choosing.md](choosing.md)).

## The providers

```ts
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import type { ApplicationConfig } from "@angular/core";
import { provideRouter, type Routes } from "@angular/router";
import { canopyAuthInterceptor, provideCanopy } from "@canopy-io/angular";

declare const routes: Routes;

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideCanopy({
      issuer: "https://canopy-io.com/environments/<environment_id>",
      clientId: "<public client_id>",
      redirectUri: `${location.origin}/callback`,
      postLogoutRedirectUri: `${location.origin}/`,
      // The interceptor attaches the token to these origins and no other.
      apiOrigins: ["https://api.example.com"],
    }),
    provideHttpClient(withInterceptors([canopyAuthInterceptor])),
  ],
};
```

- `provideCanopy` starts the client once, before the router's first navigation: it finishes a sign-in Canopy has just answered, or resumes the session silently (`prompt=none`), and puts the page the sign-in started on in the address bar, so the first navigation lands there. Never call `start()` yourself beside it. The router never sees the callback path, so it needs no route.
- `resume: false` on a public site: a sign-in coming back is still finished, but an anonymous visitor is never sent to Canopy.
- `scopes` defaults to `openid`, `profile` and `email`. The `permissions` scope works only on a client registered with it: a client created with the defaults refuses any other scope with `invalid_scope`, and every sign-in fails. Add `"permissions"` only when the OAuth client's **Scopes** include it; when you cannot tell, leave `scopes` out. Every check still works without it, asked from the API instead.
- `canopyAuthInterceptor` adds `Authorization: Bearer` with a current token (refreshed first when it is about to expire) to requests for `apiOrigins` only. Never add the token by hand, and never list a third party's origin. Your API verifies it with `TokenVerifier` and `audience` set to the public `client_id` ([node.md](node.md)).
- It does nothing during server rendering: the client is created without touching a browser global, and it starts only in a browser.

## Routes that need a signed-in person

```ts
import type { Routes } from "@angular/router";
import { canopyAuthGuard } from "@canopy-io/angular";

declare const ReportsPage: new () => object;
declare const HomePage: new () => object;

export const routes: Routes = [
  { path: "", component: HomePage },
  // A signed-out reader is sent to Canopy's sign-in and back to this URL.
  { path: "reports", component: ReportsPage, canActivate: [canopyAuthGuard] },
  { path: "**", redirectTo: "" },
];
```

## Signing in, and the person

```ts
import { Component, inject } from "@angular/core";
import {
  CanopyAuth,
  CanopyAuthError,
  CanopySignedInDirective,
  CanopySignedOutDirective,
} from "@canopy-io/angular";

@Component({
  selector: "app-header",
  imports: [CanopySignedInDirective, CanopySignedOutDirective],
  template: `
    <ng-container *canopySignedOut>
      <button (click)="auth.signIn()">Sign in</button>
      @if (failed()) {
        <p>Sign-in failed: {{ auth.error()?.name }}</p>
      }
    </ng-container>
    <ng-container *canopySignedIn>
      <span>{{ auth.user()?.email }}</span>
      <button (click)="auth.signOut()">Sign out</button>
    </ng-container>
  `,
})
export class HeaderComponent {
  readonly auth = inject(CanopyAuth);

  /** needsSignIn is the normal answer for someone with no session. */
  failed(): boolean {
    const error = this.auth.error();

    return (
      error !== null && !(error instanceof CanopyAuthError && error.needsSignIn)
    );
  }
}
```

- `CanopyAuth` signals: `status()` (`loading` until the session is known, then `signed-in` or `signed-out`), `isLoading()`, `isSignedIn()`, `user()` (the ID token's claims; show them, never authorize from them), `organization()`, `accessTokenClaims()` and `error()`. Methods: `signIn()`, `signOut()`, `getAccessToken()`, `switchOrganization(id)`.
- `*canopySignedIn` (with an optional `else`) and `*canopySignedOut` render nothing while the session loads, so a sign-in button does not flash.
- `error()` is `CanopyAuthError` (Canopy answered; `needsSignIn` means just show the button) or `CanopyConnectionError` (no answer could be read: on a page that never signed in, check **Allowed web origins**).

## Show only what the person may do

```ts
import { Component, computed, inject, input } from "@angular/core";
import { CanopyCanDirective, CanopyPermissions } from "@canopy-io/angular";

@Component({
  selector: "app-deal-actions",
  imports: [CanopyCanDirective],
  template: `
    <button *canopyCan="'deals.update'; nodeId: teamId(); else: readOnly">
      Edit
    </button>
    <ng-template #readOnly><span>Read only</span></ng-template>
    @if (exporting().allowed) {
      <button>Export</button>
    }
  `,
})
export class DealActionsComponent {
  readonly teamId = input.required<string>();
  readonly #permissions = inject(CanopyPermissions);
  /** Anywhere in the Environment: the token may answer it with no request. */
  readonly exporting = this.#permissions.can("deals.export");
  /** At a node from an input: read the signal inside a computed. */
  readonly editing = computed(
    () =>
      this.#permissions.can("deals.update", { nodeId: this.teamId() })()
        .allowed,
  );
}
```

- `*canopyCan="'perm'; nodeId: id; else other"` and `CanopyPermissions.can(permission, { nodeId })` answer whether the person holds the permission at `nodeId` (walking its ancestors), or anywhere in the Environment without one. `can()` returns a signal of `{ allowed, isLoading, error }`; the same check returns the same signal.
- `allowed` is `false` while loading and on an error: nothing appears that the person cannot use.
- The browser client answers: an Environment-wide check from the token's `permissions` claim and a check at the session's organization from `org_permissions`, with no request; the other checks made together go in one request, and answers are held until the token changes. Change detection and reading a signal again ask nothing new. Never add a cache, a timer, an `effect` that re-checks, or an `HttpClient` call to the evaluate route beside it: each multiplies the requests every visitor's browser makes.
- These checks decide what renders. They never replace the API's own check: the backend authorizes every request ([node.md](node.md), [nestjs.md](nestjs.md)).

## Organizations

```ts
import { Component, inject } from "@angular/core";
import { CanopyAuth } from "@canopy-io/angular";

@Component({
  selector: "app-organization-switcher",
  template: `
    @if (!list().isLoading) {
      <select (change)="switchTo($event)">
        @for (org of list().organizations; track org.id) {
          <option
            [value]="org.id"
            [selected]="org.id === auth.organization().orgId"
          >
            {{ org.name }}
          </option>
        }
      </select>
    }
  `,
})
export class OrganizationSwitcherComponent {
  readonly auth = inject(CanopyAuth);
  readonly list = this.auth.organizationList();

  switchTo(event: Event): void {
    void this.auth.switchOrganization(
      (event.target as HTMLSelectElement).value,
    );
  }
}
```

- `organization()`: `{ orgId, orgRoles, orgScope }`, read from the access token. `switchOrganization(id)` is a sign-in round trip into that organization that comes back to the current page.
- `organizationList()`: a signal of `{ organizations, isLoading, error }`, the organizations the person belongs to, by name, each with `id`, `name`, `slug`, `roles`, `administers` and `portal_access`. Read once and held until the token changes.
- Only for an Environment with organizations on ([access-models.md](access-models.md)).

## Mistakes specific to Angular

- Creating a `CanopyBrowserClient` in a component or service beside `provideCanopy` makes a second client with its own session: inject `CANOPY_CLIENT` instead, or pass your one client as `provideCanopy({ client })`.
- A hand-written `HttpInterceptor` that adds the token to every request sends it to third parties: use `canopyAuthInterceptor` with `apiOrigins`.
- Treating `isLoading()` as signed out sends a signed-in person to Canopy on every reload; the guard already waits for `provideCanopy`'s start.
