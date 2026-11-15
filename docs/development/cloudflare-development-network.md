# Cloudflare development network

The two Core packages run locally through Vite and workerd. Their Wrangler
configs keep separate `local`, `development` and `test` tiers. Core source reads
the origin selected by the request's `jp`/`us` host from
`RAILS_ORIGIN_JP` / `RAILS_ORIGIN_US`, using ordinary public `fetch`. No
current Wrangler tier configures these values, so Rails-owned paths fail
closed until configured.

The repository also retains `tools/vpc-probe` as a separate diagnostic for Rails
hosts owned by the Press repository. That probe is not a fallback path for Core
requests and does not change Core bindings.

Use `scripts/check-local` for local Core health checks and
`scripts/check-rails` when a Rails development network is available. Use
`scripts/check-tunnel` only for the Access-protected Rails development URL.
None of these scripts changes Cloudflare state.
