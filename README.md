# Umaxica Edge Sphere

This repository owns two regional TanStack Start Core Workers: `app/core` and
`org/core`. Each Core accepts its `jp` and `us` hostnames and forwards
Rails-owned paths through the matching `RAILS_ORIGIN_JP` or
`RAILS_ORIGIN_US` value when a tier configures it. Local requests without a
regional hostname can select a region with `RAILS_REGION`. Current Wrangler
tiers configure none of these values, so Rails-owned paths fail closed.

The repository also retains `all/busy`, a static maintenance Worker, and
`tools/vpc-probe`, a local diagnostic Worker. The two Cores deploy independently
to Cloudflare Workers. Their Worker names, routes, bindings, rate-limit
namespaces, secrets, and Wrangler environments remain owned by the operator.

## Packages

| Path              | Purpose                           | Local port | Worker name                         |
| ----------------- | --------------------------------- | ---------: | ----------------------------------- |
| `app/core`        | App Core                          |       5405 | `umaxica-apps-edge-sphere-app-core` |
| `org/core`        | Org Core                          |       5305 | `umaxica-apps-edge-sphere-org-core` |
| `all/busy`        | Static maintenance response       |          — | `umaxica-apps-edge-all-busy`        |
| `tools/vpc-probe` | Local VPC connectivity diagnostic |          — | Local use only                      |

`all/busy` is a dependency-free static Worker with no `package.json` and no
build step. `tools/vpc-probe` is not part of the production deployment list.

## Requirements

- Node.js 26.13.1
- pnpm 12.18.0 (the only package manager; `pnpm-lock.yaml` is the only lockfile)

## Quick start

```sh
pnpm install
pnpm --dir app/core run dev
```

The app Core serves at `http://127.0.0.1:5405`; the org Core serves at
`http://127.0.0.1:5305`. Run `pnpm --dir org/core run dev` to start the second
Core. Browser tests need Chromium, installed with `pnpm exec playwright install
chromium`.

There is no development container or Compose setup; see the
[development environment overview](docs/development/development-environment-overview.md).
Cloudflare credentials are obtained interactively; do not add credentials to
tracked configuration.

## Tooling and checks

Vite+ (`vp`) provides formatting, linting, and Vitest. Each Core declares its
own dependencies and tool configuration; the root only orchestrates the two
packages.

```sh
pnpm run format:check
pnpm run lint:check
pnpm run typecheck
pnpm run knip
pnpm run test
pnpm run check:architecture
pnpm run check:spelling
pnpm run check:workers
pnpm run build
```

The root `pnpm run check` runs static checks and unit tests. `pnpm run test:api`
starts each Core's development server and checks its HTTP contract with Hurl.
`pnpm run test:e2e` runs Playwright; CI deliberately skips browser tests.
Build each Core with `pnpm --dir app/core run build` or
`pnpm --dir org/core run build`.

Root-only checks include dependency catalog consistency (`check:deps`),
architecture (`check:architecture`), Worker configuration (`check:workers`),
and spelling (`check:spelling`). `pnpm run knip` checks each Core separately.

## Architecture notes

- Core host policy accepts `jp` and `us` regional hosts. Keep region explicit
  in host routing and backend configuration; do not replace the routing with a
  single hard-coded backend.
- `RAILS_ORIGIN_JP` and `RAILS_ORIGIN_US` are absent from current Wrangler
  tiers. Public `jp` and `us` hosts select their matching origin; local hosts
  need an explicit `RAILS_REGION`. An unconfigured region fails closed.
- `src/worker.ts` dispatches Rails-owned paths before TanStack Start and strips
  application `Set-Cookie` headers. Rails-owned responses remain Rails' to
  control.
- `vite build` creates the Worker bundle and hashed client assets. Production
  runs on Workers and starts no Node server.
- Each deployment package owns its own configuration. Do not centralize
  TypeScript, Vitest, and Knip configuration local.

See [AGENTS.md](AGENTS.md) for repository rules, [adr/README.md](adr/README.md)
for the retained decisions, and [docs/development](docs/development) for
operational guidance. Completed checks may be summarized in `evidence/` using
the repository's flat Markdown format.
