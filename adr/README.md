# Architecture Decision Records

This index separates decisions that still apply to Sphere from historical
records whose implementation moved with its packages.

## Current Sphere decisions

| ADR                                                            | Decision                                                       |
| -------------------------------------------------------------- | -------------------------------------------------------------- |
| [005](005-rails-edge-workers-vpc-connection.md)                | Workers VPC background retained for the standalone probe       |
| [006](006-development-workers-vpc-transport.md)                | Development VPC transport history used by the probe            |
| [007](007-shared-fqdn-core-dispatch.md)                        | Shared-FQDN dispatch in `app/core` and `org/core`              |
| [009](009-rails-health-entrypoint-and-dispatch-operability.md) | Core health and Rails dispatch operability                     |
| [010](010-first-touch-rate-limiting.md)                        | First-touch rate limiting                                      |
| [013](013-frames-tanstack-start.md)                            | TanStack Start on Vite for both retained Cores                 |
| [014](014-edge-owned-development-tunnel.md)                    | Development Tunnel ownership boundary                          |
| [016](016-rails-machine-health-api.md)                         | Rails machine-health contract used by the diagnostic           |
| [017](017-edge-self-health-api.md)                             | Core self-health API                                           |
| [018](018-core-rails-direct-internet.md)                       | Core public-fetch transport with unconfigured regional origins |
| [019](019-edge-parallel-contract-boundaries.md)                | Core transport and request boundaries                          |
| [020](020-wrangler-device-login.md)                            | Wrangler device login background for VPC diagnostics           |
| [021](021-hsts-preload.md)                                     | HSTS policy for the retained Core Workers                      |
| [022](022-rate-limit-namespace-allocation.md)                  | Rate-limit namespace allocation                                |
| [023](023-rails-proxy-trust-boundary.md)                       | Core to Rails proxy trust boundary                             |
| [025](025-csp-report-ownership.md)                             | CSP report ownership contract                                  |
| [026](026-tanstack-start-stable-caret-range.md)                | TanStack Start version range                                   |

Current deployment scope is `app/core` and `org/core`. `all/busy` and
`tools/vpc-probe` are retained outside the pnpm workspace. The VPC probe is a
separate diagnostic, not a Core transport.

## Historical records moved to other repositories

- Apex decisions moved to Zenith: [002](002-dev-apex-vercel.md),
  [003](003-apex-direct-composition.md), [011](011-apex-workers-stay-hono.md),
  [012](012-apex-vite-build-and-static-assets.md),
  [024](024-retire-app-com-org-apex-units.md), and
  [027](027-reintroduce-app-com-org-apex-units.md).
- Public content decisions moved to Press: [004](004-public-information-surfaces-astro.md)
  and [015](015-public-content-surfaces-astro.md).

[ADR 001](001-rails-health-check.md) is superseded by ADR 005. ADR 008 is
superseded by ADR 014. Historical details in these records describe earlier
repository scopes and do not define current package inventory.
