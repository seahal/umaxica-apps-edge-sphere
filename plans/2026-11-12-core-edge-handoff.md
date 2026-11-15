# Core Edge Workers Handoff (2026-11-12)

The Core Edge Workers `app/core` and `org/core` are owned by
`umaxica-apps-edge-sphere`. Keep both deployment units and preserve their
region-aware host routing.

## Outstanding owner work

The intended browser-facing bindings use the `www-jp.umaxica.<brand>` hosts.
The production route/tunnel ownership and current environment must be reviewed
read-only before any external change.

1. Confirm which Cloudflare environments the two Core Workers use and which
   Rails hosts each configured region selects. The current code keeps `jp`
   explicit and allows `us` as a separate region value.
2. If Cloudflare routes need adjustment, bind the
   `www-jp.umaxica.app/*` and `www-jp.umaxica.org/*` paths to the existing Workers,
   preserving the Worker-owned dispatch exceptions for Rails paths.
3. Cloudflare routes and tunnel rules are external changes. They remain owner
   work and require separate authorization.

Core configuration selects a Rails origin by region with
`RAILS_ORIGIN_JP` / `RAILS_ORIGIN_US`; local hosts use an explicit
`RAILS_REGION`. No current Wrangler tier configures these values, so
Rails-owned requests fail closed until the corresponding origin is configured.

## Program context

The broader Cosmos work spans Access, Governance, Sphere, Press, Mock OIDC,
Edge Sphere, Edge Jump and Edge Away. The Core Edge implementation and its
local code now live in this Sphere repository.

## Standing rules

- Do not commit unless the owner asks. Never print secrets or environment values.
- Never edit `config/credentials/*.yml.enc` from a Codex task.
- Ask before dropping databases or volumes, or before any external change
  involving Cloudflare, AWS, GitHub or a provider.
- Read `AGENTS.md` and the rules it requires before editing. Record completed
  work in `evidence/`.
