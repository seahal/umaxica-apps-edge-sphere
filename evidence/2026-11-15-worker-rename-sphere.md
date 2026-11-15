# Sphere Worker rename (repository side)

Date: 2026-11-15

The Core Workers were renamed in the repository only. No Cloudflare API call, deploy, or Workers Builds change was made.

| Old                          | New                                 |
| ---------------------------- | ----------------------------------- |
| `umaxica-apps-edge-app-core` | `umaxica-apps-edge-sphere-app-core` |
| `umaxica-apps-edge-org-core` | `umaxica-apps-edge-sphere-org-core` |

There is no `com` Core: `com/core` is retired in this repository. `all/busy` (`umaxica-apps-edge-all-busy`) was not renamed.

Changed: `wrangler.jsonc` and `package.json` names; `CORE_WORKER_NAME` in each `src/lib/core-host-policy.ts`, which sets the accepted workers.dev host; `scripts/check-browser`; README; and the commands in ADR 006 and ADR 009. Sentry MCP project URLs in `*/core/.mcp.json` still use the old names, because the Sentry project names are separate.

After the change, `pnpm run test` (582 / 594 / 141), `check:workers`, `typecheck` and `build` passed.

## Cloudflare rename

The owner ran the API calls from their own shell: account `c90999d8a4039c63d02b7a7b1545d211`, `PATCH /accounts/{account}/workers/workers/{id}`. Both calls returned `success: true` with the new name. No Worker was created.

| Worker ID                          | Old                          | New                                 |
| ---------------------------------- | ---------------------------- | ----------------------------------- |
| `5acaaaa3264e47d789b8443b8925c4ef` | `umaxica-apps-edge-app-core` | `umaxica-apps-edge-sphere-app-core` |
| `12df970e8b604ad2959d2089c4ff44fd` | `umaxica-apps-edge-org-core` | `umaxica-apps-edge-sphere-org-core` |

Read-back: `wrangler deployments status --name <new>` with `CLOUDFLARE_ACCOUNT_ID` set to the account above. The deployment created on 2026-09-10 is still active: App version `291b1701-e636-4638-a0fa-d7d17d93d9ce` at 100%, Org version `ab0c64eb-845e-4066-9412-e1e27d2ce66e` at 100%. Run from `app/core` without that variable, Wrangler resolved account `a08f07332434bd877b6dd83952b973c9` and got authentication error 10000.

`umaxica-apps-edge-com-core` (`392d8e438e71487083c1cd59ca953b70`) still exists in Cloudflare. It was not renamed; removing it is for the owner to decide.

Not done: switching the Workers Builds repository connection.
