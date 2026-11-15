# Sphere development environment

The development workspace contains two deployable Core packages:
`app/core` and `org/core`. `all/busy` is a static maintenance Worker, and
`tools/vpc-probe` is a local VPC diagnostic for Rails hosts owned by Press.

The rootless Podman workspace container (`compose.workspace.yaml`) provides the local toolchain. Compose keeps a
single `core` development service with the app Core on port 5405 and the org Core
on port 5305. The local Cloudflare Tunnel sidecar remains part of the
development setup; its external configuration is owner-managed.

Use `scripts/dev-start`, `scripts/dev-stop` and `scripts/check-local` for the
local workspace lifecycle and smoke check. Core Rails requests remain
fail-closed until the matching regional origin is configured for the relevant
tier. Local hosts also need an explicit `RAILS_REGION`.
