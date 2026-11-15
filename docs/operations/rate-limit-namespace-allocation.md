# Rate-limit namespace allocation

This is the current Sphere allocation for the two Core Workers and the
account-wide Jump reservation. The scheme is recorded in
[ADR 022](../../adr/022-rate-limit-namespace-allocation.md).

Cloudflare Rate Limiting counters are scoped to the account. Two bindings with
the same `namespace_id` share a counter, even across Workers or repositories.
Every active id must therefore be unique.

## General `RATE_LIMITER`

Production ids use `<development-port><region-suffix>`. Non-production tiers
prefix that value: `2` for development, `3` for test, and `5` for local. The
Cores use Japan suffix `81`.

| Package    | Port | Production | Development |      Test |     Local |
| ---------- | ---: | ---------: | ----------: | --------: | --------: |
| `app/core` | 5405 |   `540581` |   `2540581` | `3540581` | `5540581` |
| `org/core` | 5305 |   `530581` |   `2530581` | `3530581` | `5530581` |

The USA suffix `01` remains reserved, not configured:

| Package    | Reserved USA id |
| ---------- | --------------: |
| `app/core` |        `540501` |
| `org/core` |        `530501` |

Do not add a USA id until that regional deployment is configured. Region is
the final two digits; do not replace it with a single global value.

## Authentication limiter

`AUTH_RATE_LIMITER` stays on the separate X10N series, with a budget of 60
requests per 60 seconds. It is consulted in addition to `RATE_LIMITER` for
`/oidc/*` and `/sign/out`.

| Package    | Production | Development |   Test |  Local |
| ---------- | ---------: | ----------: | -----: | -----: |
| `app/core` |     `1101` |      `2101` | `3101` | `5101` |
| `org/core` |     `1103` |      `2103` | `3103` | `5103` |

## Account-wide reservations

Jump is maintained by `umaxica-apps-edge-jump`; its production namespace is
`520900`. The Core ids must not use it. Historical Jump ids `999` and `1006`
are retired and must not be reused.

`all/busy` has no limiter. `tools/vpc-probe` is a local diagnostic and has no
production rate-limit namespace.

## Enforcement

`pnpm run check:workers` validates each Core's tier-specific limiter id and
budget. `tools/lib/rate-limit-namespaces.mjs` derives the expected value from
the package port and region suffix. Keep the Wrangler bindings unchanged during
repository pruning.
