# Sphere split-prune work record

- Checkout HEAD: `6ca7a178c77daba28ac99f8e1d5da3d01d715b72` (branch `feature`).
- Work-order source SHA: `b7dd13135eea2c06c69e20881f68b927e3ece009`.
- Baseline checks were not run at the source SHA; this checkout was already on a different commit.

## Scope changes

- Kept the `app/core` and `org/core` workspace packages, plus `all/busy` and `tools/vpc-probe` outside the workspace.
- Removed 18 unit trees and their tracked files: `app/{apex,docs,help,info,news}`, `com/{apex,core,docs,help,info,news}`, `dev/apex`, `net/apex`, and `org/{apex,docs,help,info,news}`. The worktree shows 2,313 tracked deletions overall; 2,259 are inside those unit trees.
- Updated the Sphere package identity, workspace, CI and local development references, package-boundary checks, docs, and ADR status. Added a root ignore for generated `cloudflare-env.d.ts` files so declarations from deleted units remain ignored and preserved.
- Added region-keyed Rails-origin selection: public `jp` and `us` hosts select their corresponding configured origin; local and Workers.dev hosts require an explicit region. No backend origin is hard-coded.
- Parsed Wrangler configuration for both retained Cores and found it semantically unchanged from HEAD; `all/busy/wrangler.jsonc` is byte-identical. Existing Worker names, routes, bindings, rate-limit namespaces, and environment configuration were not changed. Regional Rails variables are not configured in Wrangler; requests remain fail-closed until the owner configures them separately.

## Checks

| Check                | Result                                                                                                                                                                                                                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`       | Blocked. Offline install and offline lockfile-only retry both failed with `ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK` because the pnpm store operation lock is read-only. No alternate store or download was used. The lockfile has 18 retired workspace importers and no Vite+ package record, so lock regeneration is incomplete. |
| `format:check`       | The pnpm script stopped at missing `vp`. Direct Oxfmt check passed for the 126 changed tracked files and the new root Vite config. A whole-tree Oxfmt scan also reports the untracked work-order input as unformatted; that input was left unchanged.                                                                            |
| `lint:check`         | The pnpm script stopped at missing `vp`. Direct Oxlint reported only the root config’s unresolved `vite-plus` type, which is not installed in this checkout.                                                                                                                                                                     |
| `typecheck`          | Passed for `app/core` and `org/core` using `pnpm run typecheck`.                                                                                                                                                                                                                                                                 |
| `knip`               | Blocked by the unavailable Vite+ install; it reports `vp` unlisted and `vite-plus` unused.                                                                                                                                                                                                                                       |
| Core tests           | Passed with the installed Vitest 5.1.0: App 34 files / 582 tests; Org 37 files / 594 tests. The pnpm test scripts themselves stop at missing `vp`.                                                                                                                                                                               |
| Root invariant tests | 15 files / 139 tests passed using Vitest with a temporary empty config, removed afterward. The remaining architecture-invariant suite could not start because Node `spawnSync` of the local `depcruise` binary returned `EPERM`.                                                                                                 |
| `check:architecture` | Passed: 11 modules, 12 dependencies cruised, no violations.                                                                                                                                                                                                                                                                      |
| `check:spelling`     | Passed: `pnpm run check:spelling` checked 515 files; the final full CSpell rerun, including this record, checked 516 files with no issues.                                                                                                                                                                                       |
| `syncpack lint`      | Passed: no issues.                                                                                                                                                                                                                                                                                                               |
| `check:workers`      | Blocked: Node could not spawn `git` (`EPERM`) while collecting tracked public assets. Retained Wrangler configs were checked separately as above.                                                                                                                                                                                |
| Local Core builds    | Not run. Vite+ is unavailable; the work-order says to stop a package when it cannot build with `vp`, without substituting another build tool. `all/busy` has no build script; `tools/vpc-probe` is a script utility.                                                                                                             |
| Syntax / whitespace  | `node --check` passed for the Worker checker and VPC probe; `git diff --check` passed.                                                                                                                                                                                                                                           |

The required Node version is 26.13.1 and the required pnpm version is 12.18.0; this environment has Node 26.12.0 and pnpm 12.15.0. The requested baseline comparison cannot classify other check failures as pre-existing or new.

## Local side effect

The successful typecheck ran local Wrangler type generation, which emitted diagnostic log files outside the checkout under the user's config directory. The logs were not inspected or modified. No remote Wrangler command, Cloudflare change, deploy, push, or commit was performed.

## Owner follow-up: remove these Workers in Cloudflare

No remote Worker was removed. The owner-directed cleanup list is:

- `umaxica-apps-edge-app-apex`
- `umaxica-apps-edge-app-docs`
- `umaxica-apps-edge-app-help`
- `umaxica-apps-edge-app-info`
- `umaxica-apps-edge-app-news`
- `umaxica-apps-edge-com-apex`
- `umaxica-apps-edge-com-core`
- `umaxica-apps-edge-com-docs`
- `umaxica-apps-edge-com-help`
- `umaxica-apps-edge-com-info`
- `umaxica-apps-edge-com-news`
- `umaxica-apps-edge-dev-apex`
- `umaxica-apps-edge-net-apex`
- `umaxica-apps-edge-org-apex`
- `umaxica-apps-edge-org-docs`
- `umaxica-apps-edge-org-help`
- `umaxica-apps-edge-org-info`
- `umaxica-apps-edge-org-news`

## Completion run (2026-11-15, later the same day)

The pnpm store was writable in this run. Node was 26.12.0 (required 26.13.1); pnpm was 12.18.0.

- `pnpm install` passed. The lockfile now lists only the root, `app/core` and `org/core` importers and records `vite-plus` 1.6.0. Within the declared ranges, resolution moved `wrangler` 4.156.2 to 4.160.0, `knip` 6.44.1 to 6.45.0 and `cspell` 10.4.0 to 10.4.1.
- Format scripts pass `--config .oxfmtrc.json` to `vp fmt`, as in press. Without the flag, `vp fmt` reports "No config found" and checks against defaults. `all/busy/public/**` was added to the root format ignore list: the Oxfmt bundled with Vite+ 1.6.0 formats HTML, which would rewrite the maintenance pages' served bytes.
- Core `test`, `test:cov` and `test:stress` stay on `vitest run`. Under `vp test run`, `await expect(Promise.reject(new Error('x'))).rejects.toThrow('x')` fails with the received message `''`, while the synchronous `toThrow` passes. That broke 8 tests per Core, all of which pass under `vitest run` 5.1.0. AGENTS.md requires importing test utilities from `vitest`, so the tests were not rewritten. The root `test:repo` still uses `vp test run` and passes.
- `check:workers` failed at HEAD, before this run: the checker's observability policy still had logs at 1 and traces at 0.2, while commit `4a23d6e8` changed both Core `wrangler.jsonc` files to logs at 0.1 and traces at 0.02. The checker policy now matches the Wrangler files; the Wrangler files were not changed.

| Check                         | Result                                                                   |
| ----------------------------- | ------------------------------------------------------------------------ |
| `pnpm run format:check`       | Passed                                                                   |
| `pnpm run lint:check`         | Passed (two existing `no-useless-spread` warnings in `core-dispatch.ts`) |
| `pnpm run typecheck`          | Passed                                                                   |
| `pnpm run knip`               | Passed                                                                   |
| `pnpm run test`               | Passed: App 582, Org 594, root 141                                       |
| `pnpm run check:workers`      | Passed: 2 workspace Workers, plus `tools/vpc-probe`                      |
| `pnpm run check:architecture` | Passed                                                                   |
| `pnpm run check:deps`         | Passed                                                                   |
| `pnpm run check:spelling`     | Passed                                                                   |
| `pnpm run build`              | Passed for both Cores                                                    |
| `git diff --check`            | Passed                                                                   |

`test:api` and `test:e2e` were not run.
