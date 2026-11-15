<!-- intent-skills:start -->

## Skill Loading

Use the repository’s installed Intent. If it is unavailable, report the missing dependency instead of downloading a replacement.
Before editing files for a substantial task:

- Run `pnpm exec intent list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm exec intent load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

# AGENTS.md

This repository owns two regional TanStack Start Core Workers: `app/core` and
`org/core`. It also retains the standalone maintenance Worker at `all/busy`
and the local Workers VPC probe at `tools/vpc-probe`. Core accepts its `jp`
and `us` public hosts; keep region explicit in host routing and configuration.
Each Core is built with Vite and deployed to Cloudflare Workers.

## Setup and commands

pnpm is the ONLY package manager. Never use npm, npx, yarn, or bun.
`pnpm-lock.yaml` is the only lockfile (`test/package-manager-invariants.test.ts`
enforces this).

- Runtime: Node.js 26.13.1; pnpm 12.18.0.
- Install: `pnpm install`.
- Static checks and unit tests: `pnpm run check`.
- Format: `pnpm run format` / `pnpm run format:check` (Vite+ `vp fmt`).
- Lint: `pnpm run lint` fixes; `pnpm run lint:check` checks without rewriting
  (Vite+ `vp lint`).
- Type check: `pnpm run typecheck` (`tsc --noEmit`, after local generation).
- Unit tests: `pnpm run test` (Vite+ Vitest). Coverage is per Core package
  (`pnpm --dir <unit> run test:cov`).
- HTTP tests: `pnpm run test:api` (Hurl).
- Browser tests: `pnpm run test:e2e` (Playwright; install Chromium with
  `pnpm exec playwright install chromium` when needed; CI deliberately skips
  browser tests).
- Build: `pnpm run build` builds both Core Workers with Vite.
- Dead code: `pnpm run knip`; architecture: `pnpm run check:architecture`;
  dependency versions: `pnpm run check:deps`; spelling:
  `pnpm run check:spelling`.
- Per package: `pnpm --filter <workspace> run <script>` or
  `pnpm --dir <unit> run <script>`.

The root fans out over the two Core packages. Repository-only checks run once
from the root: `check:architecture`, `check:deps`, `check:spelling`,
`check:workers`, and the root invariant suite in `test/`.

Root `pnpm run test:repo` runs only `test/`; it does not use a root Vitest
configuration. Package tests live in `<unit>/test/` and use that package's
Vitest configuration. Import test utilities from `vitest` directly.

Before adding a suppression or ignore to a static-analysis tool, read
`docs/development/static-analysis-and-hygiene.md`.

## Per-package configuration

Each Core owns its own `.oxlintrc.json`, `.oxfmtrc.json`, `tsconfig.json`,
`vitest.config.ts`, `vitest.setup.ts`, and `knip.jsonc`. Do not replace a
package's copy with a root `extends` or shared package. Root configs apply only
to repository-level files.

## Build and deploy

`vite build` produces each deployed Worker bundle and hashed assets. Vite is a
devDependency; production starts no Node process or server. The deployment
contract is recorded in `adr/013-frames-tanstack-start.md` and
`adr/026-tanstack-start-stable-caret-range.md`.

Do not rename a kept Worker's name, routes, bindings, rate-limit namespace,
secrets, or Wrangler environments as part of repository maintenance.

## Test layers

| Layer           | Tool       | Lives in       | Answers                      |
| --------------- | ---------- | -------------- | ---------------------------- |
| `pnpm test`     | Vitest     | `<unit>/test/` | Did internal logic break?    |
| `pnpm test:api` | Hurl       | `<unit>/api/`  | Did the HTTP contract break? |
| `pnpm test:e2e` | Playwright | `<unit>/e2e/`  | Did the browser path break?  |

- Assertions on responses (status, headers, body, cookies, redirects) belong in
  `.hurl` files against a real server. Do not import `src/` or call
  `app.request()` from those tests.
- Assertions no HTTP client can produce (a thrown route, injected binding, or
  `console` line) belong in Vitest. `app.request()` may be the driver when a
  comment explains why.
- Assertions needing a real browser engine belong in Playwright. Status codes
  and content types do not belong in browser specs.
- `test:api` starts each package's dev server through `api/run.mjs`, runs Hurl,
  then stops the server; it reuses an already-listening server. `EDGE_API_BASE`
  targets a deployment.

## Evidence

Completed checks leave a short record in `evidence/` when retaining the result
is useful. Records describe work actually performed, never plans or unverified
claims. Record checks that could not complete with their reason and observed
result.

- `evidence/` is flat and contains only `.md` files.
- Name records `YYYY-MM-DD-<topic>.md` with lowercase hyphenated topics.
- Do not add raw logs, screenshots, binaries, archives, dumps, or generated
  reports. Summarize commands, identifiers, hashes, measurements, and excerpts.

## Logging

`no-console` is an error in both Core packages. Do not call `console` directly
or add a new disable comment. The sanctioned emitters are:

- `*/core/src/lib/request-log.ts` for the TanStack request boundary.
- `*/core/src/lib/rails-dispatch-log.ts` for the Edge-to-Rails hop.

Each emits one JSON line `{ level, msg, data }`, collected by
`observability.logs.enabled` in each `wrangler.jsonc`. Keep log values numeric
or fixed unions; never add free text, secrets, cookies, tokens, bodies, user
identifiers, or hostnames.

## Cookies

Browser code touches cookies only through the Cookie Store API (`cookieStore`).
Do not add a cookie library, `document.cookie`, or a wrapper before a feature
needs one. Server-side Hono cookie handling is outside this repository's kept
runtime surface.

At the Core boundary, `src/worker.ts` strips every `Set-Cookie` from application
responses. Rails-owned passthrough may preserve a Rails `Set-Cookie`; the Core
application does not issue, refresh, or delete preference cookies. Read
`docs/development/browser-cookie-access.md` before writing browser cookie code.

## Styling

Tailwind CSS v4 is the only styling layer. Do not add CSS Modules, CSS-in-JS,
`tailwind.config.*`, or static `style=` attributes.
`docs/design/ui-shell-contract.md` is normative.

- Each Core owns its stylesheet and `@theme`; do not add a shared preset.
- The engine runs through `@tailwindcss/vite`; do not add PostCSS or
  `@tailwindcss/postcss`.
- Visual rules belong in utility classes. A new CSS rule needs a written reason
  utilities cannot express it; `@apply` is not that reason.
- Design constants are `@theme` tokens; `--color-brand` is the one color
  pinned by literal value.

## Generated files

`cloudflare-env.d.ts` is generated by `wrangler types`, gitignored, and must not
be committed. `typecheck` generates it before invoking TypeScript.
`src/routeTree.gen.ts` is committed in each Core and regenerated by the
TanStack Router plugin on `vite dev` or `vite build`; see ADR 013.

## Module composition

Mixin-style modules, shared helpers, and composition utilities stay
side-effect-light: mutations, registration, persistence, and I/O are wired
explicitly by the caller. Export the smallest practical surface.

## Design principle

YAGNI. Build only what is needed now. If documentation and existing code
conflict, follow the code and report every discrepancy found.
