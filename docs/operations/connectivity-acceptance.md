# Connectivity diagnostics

The Core packages use public `fetch` for Rails-owned paths through the origin
selected for the request's region by `RAILS_ORIGIN_JP` or `RAILS_ORIGIN_US`.
No current Core Wrangler tier configures these values, so those paths fail
closed until an origin is supplied. `scripts/check-rails` checks the local Rails Health
API for `core.app.localhost` and `core.org.localhost` when `EDGE_RAILS_NETWORK` is
available.

`tools/vpc-probe` is a retained local diagnostic for the Rails hostnames
formerly served by the public content packages. Its fixed targets test VPC
transport and Rails host dispatch; they are not Sphere deployment units or a
Core transport contract. The probe requires its VPC binding and must not be
given a request-controlled destination.

This file documents the diagnostic boundary. It is not evidence that any
network path was exercised in the current work.
