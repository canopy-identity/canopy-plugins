---
name: canopy-admin
description: Administer a Canopy Account through the Canopy MCP server's tools: roles, permissions, people and their role assignments, the hierarchy, organizations, Environments, webhooks, SSO, MFA and sign-in settings. Use when the user asks to change or inspect their Canopy Account, Application or Environment rather than to write code, or when calling the canopy MCP server's tools.
license: MIT
---

# Administering a Canopy Account

The plugin connects two MCP servers:

- **`canopy`**: the account server. One tool per public API operation, named by its operation id (`Api<Area>Controller_<action>`, for example `ApiRolesController_createRole`), plus `whoami`. The first call opens a browser: the user signs in and approves one Environment and what the client may do there. Every call then acts as that person, within that approval; a tool outside it is not offered.
- **`canopy-docs`**: answers questions from Canopy's docs, with no sign-in.

Call `whoami` first when the Account, Application or Environment matters to the answer.

## Pick the tool by its level

Every tool's description starts with its level: the **Account**, the approved **Environment**, or **inside one organization**. Several operations read alike at different levels. Match the level the user means; when they do not say, ask.

| The user means                                   | Tool                                               | Not                                                        |
| ------------------------------------------------ | -------------------------------------------------- | ---------------------------------------------------------- |
| A webhook for events anywhere in the Account     | `ApiAccountWebhooksController_create`              | `ApiWebhooksController_create` (this Environment only)     |
| A webhook for events in this Environment         | `ApiWebhooksController_create`                     | `ApiAccountWebhooksController_create`                      |
| A node (team, department) inside an organization | `ApiOrganizationStructureController_createNode`    | `ApiNodesController_createNode` (the Environment's tree)   |
| A role grant inside an organization              | `ApiOrganizationAccessController_createAssignment` | `ApiAssignmentsController_assignRole`                      |
| MFA or SSO-only sign-in for one organization     | `ApiOrganizationsController_updatePolicy`          | `ApiAuthSettingsController_update` (the whole Environment) |
| An organization's own SAML or OIDC connection    | `ApiOrganizationSsoConnectionController_*`         | `ApiSsoController_*` (connections the Account owns)        |
| A machine client's role                          | `ApiOAuthClientsController_assignRole`             | `ApiAssignmentsController_assignRole` (people)             |

Use an organization's tools (`ApiOrganization*`) only when the request names an organization. A team, region or department in the Environment's hierarchy is a node, granted with `ApiAssignmentsController_assignRole`, even when the Environment also has organizations.

An organization's policy can only tighten the Environment's. Never change the Environment's settings to do something the user asked for one organization.

## Parameters people guess wrong

- Load a tool's input schema (through tool search) before its first call. Its name alone does not say which path parameters and body fields it requires, and a call made from the name is refused.
- Ids, not names. Path parameters (`{id}`, `{nodeId}`, `{identityId}`) are ids and always required. Find the id first with the area's list tool.
- A list's text filter is `q`, never `search` or `name`. Paging is `page` and `take`.
- A refused call names the parameter it wanted. Correct that one parameter and call again; do not switch tools.

## Do it in the fewest calls

- One operation often does the whole job. Removing someone from an organization (`ApiOrganizationsController_removeMember`) also removes every role they hold in it; do not remove the roles first.
- A question is answered by reading. When the user asks who holds what, or where, change nothing.
- Make only the writes the request needs. Do not tidy, rename or fix things you notice on the way; mention them instead.
- After several steps that depend on each other (create a node, create a role, grant the role there), pass each step's returned id to the next rather than looking it up again.

## Before a change that removes or replaces something

Deleting, moving a node, replacing a role's permissions, rotating a secret, disabling a connection and switching an Environment's access model take away something that exists. Before one:

1. Preview it where a preview exists: `ApiNodesController_previewMoveNode`, `ApiNodesController_previewDeleteNode`, `ApiRolesController_previewRolePermissions`, `ApiDeniesController_preview`, `ApiOrganizationsController_previewDeleteOrganization`, and the `preview*` tools inside an organization.
2. Tell the user what will change, from the preview, and wait for their yes. Skip this only when they asked for exactly that change in this conversation.

## Retries and other people's changes

- A create sent twice can create two. On a tool that accepts an `Idempotency-Key`, send a new random UUID for each request, never a readable or derived string. Reuse a key only to resend the very call that got no answer: Canopy answers a key it has seen with that first result for 24 hours and does not do the work again, so a key reused for a later request, even an identical one, silently changes nothing.
- On a tool that accepts `If-Match`, send the `version` of the record you just read. A `409` means someone changed it since: read it again and tell the user what changed before trying again.

## When the docs help

For what a setting means or how a feature works, ask `canopy-docs` rather than guessing. For writing application code against Canopy, use the `canopy` skill.
