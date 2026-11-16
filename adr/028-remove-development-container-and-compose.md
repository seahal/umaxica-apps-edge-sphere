# ADR 028: Remove the development container and Podman Compose

## Status: Accepted 2026-11-16 — removal done; Tunnel connector replacement undecided

## Context

Edge development ran in a rootless Podman workspace container (`core`) defined by
`compose.yaml` and `compose.workspace.yaml`, built from `Containerfile`, and driven by
`scripts/dev-start`. The same Compose project ran the Edge-owned `cloudflare-tunnel`
connector. The owner decided that Edge no longer uses Podman Compose or a development
container.

## Decision

1. Edge has no development container and no Compose setup. Units run directly on the
   developer's machine with the Node.js and pnpm versions declared in
   `package.json#devEngines`.
2. Removed: `compose.yaml`, `compose.workspace.yaml`, `compose.override.yaml.example`,
   `Containerfile`, `.containerignore`, `.dockerignore`, `scripts/dev-start`,
   `scripts/dev-stop`, `scripts/dev-build`, `scripts/check-rails`,
   `scripts/verify-zero-state`, `scripts/verify-build-context`, and the repository tests
   that read those files (`test/compose-tunnel-invariants.test.ts`,
   `test/compose-local-override-invariants.test.ts`,
   `test/development-container-security.test.ts`).
3. The direct local Rails transport stays. It is still gated on
   `EDGE_LOCAL_RAILS_ENABLED` and `EDGE_LOCAL_NODE_RUNTIME`; the developer exports
   `EDGE_LOCAL_RAILS_ENABLED` in the shell instead of Compose exporting it.

## Consequences

- The Compose- and container-specific parts of ADR 006, ADR 008 and ADR 014 no longer
  describe a running setup. Their bodies stay as history.
- No supported way to run the Edge-owned Tunnel connector exists until a follow-up
  decision defines one.
- Guards that lived in the removed tests are gone, including the check that the fifteen
  Rails clients strip `cf-access-client-*` headers and the check that the build context
  excludes secrets.
