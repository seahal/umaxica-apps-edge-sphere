# Sphere development environment

The development workspace contains two deployable Core packages:
`app/core` and `org/core`. `all/busy` is a static maintenance Worker, and
`tools/vpc-probe` is a local VPC diagnostic for Rails hosts owned by Press.
Core Rails requests remain fail-closed until the matching regional origin is
configured for the relevant tier. Local hosts also need an explicit `RAILS_REGION`.
`scripts/check-local` is the local smoke check.

Edge has no development container and no Podman Compose setup. Both were removed on
2026-11-16. Work runs directly on the developer's machine.

## Toolchain

Node.js 26.13.1 and pnpm 12.18.0 are declared in `package.json#devEngines`. Install them
with any version manager; pnpm downloads the declared version itself when it differs
(`onFail: download`). Use `pnpm` directly; npm, npx, yarn and Bun are not used.

```bash
pnpm install
pnpm run check
```

Each deployment unit starts on its own with `pnpm --dir <unit> run dev`.

## What has no replacement yet

- **Cloudflare Tunnel connector.** It ran as a Compose service. No supported way to run
  the Edge-owned connector is defined now; the former setup is described in
  [cloudflare-tunnel-development.md](../operations/cloudflare-tunnel-development.md).
- **Local Rails transport.** The direct transport to a local Rails is still selected by
  `EDGE_LOCAL_RAILS_ENABLED` together with `EDGE_LOCAL_NODE_RUNTIME`. Nothing exports
  `EDGE_LOCAL_RAILS_ENABLED` for you any more; export it in your shell when a local Rails
  is reachable.

Credentials are covered in
[credential-and-secret-management.md](credential-and-secret-management.md), GitHub access
in [git-and-github-access.md](git-and-github-access.md), and Wrangler login in
[wrangler-authentication.md](wrangler-authentication.md). The runtime and network
architecture is in [cloudflare-development-network.md](cloudflare-development-network.md).
