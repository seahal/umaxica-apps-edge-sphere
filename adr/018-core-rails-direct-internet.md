# ADR 018: Core Rails requests use public fetch

> Current Sphere scope is `app/core` and `org/core`. The original decision also
> covered `com/core` and Press-owned content packages; those scopes were removed
> in the split. Public `jp` and `us` hosts select separate regional origins.

## Status

Accepted — 2026-09-11. For the retained Core packages, this decision supersedes
the Workers VPC transport described in ADR 005 and ADR 006. Their remaining
Workers VPC background applies to `tools/vpc-probe` only.

## Context

Before the repository split, the TanStack Start Cores (`app/core`, `com/core`,
and `org/core`) and public content surfaces used the Workers VPC binding
`UMAXICA_APPS_EDGE_CF_WORKERS_VPC` to reach Rails. The Core Rails API is
published on the public internet, so the private hop was not needed for those
requests.

## Decision

1. Core code selects `RAILS_ORIGIN_JP` or `RAILS_ORIGIN_US` from the public
   request hostname and uses ordinary `fetch`. It does not use a Workers VPC
   binding.
2. A local request without a public regional hostname may select a region with
   `RAILS_REGION`. Core does not guess a region for an unrecognized hostname.
3. Each regional origin accepts a bare `https` origin, or plain `http` for a
   `*.localhost` host. Without a valid origin for the selected region,
   Rails-owned paths fail closed and `/health` reports Rails as not configured.
4. No authentication header is added to requests to Rails. Client-supplied
   `Forwarded`, `X-Forwarded-*`, and `X-Real-IP` headers are dropped.

No current Wrangler tier configures `RAILS_ORIGIN_JP` or `RAILS_ORIGIN_US`.
Consequently, Rails-owned requests on the current tiers fail closed until the
selected region has an origin configured.

## Consequences

- Rails receives the host from the selected regional origin. Rails Host
  Authorization and any absolute URLs it generates must accept that host.
- Rails sees Cloudflare's egress address rather than the browser's address.
- Core dispatch logs use `upstream_unreachable` and
  `origin_not_configured`; the former VPC-specific outcomes and proxy error
  field are not part of the current Core logging contract.
- The standalone `tools/vpc-probe` remains a local diagnostic for Rails hosts
  owned by Press; it is not a Core transport or a deployment unit.
