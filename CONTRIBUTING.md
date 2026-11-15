# Contributing

This repository contains the `app/core` and `org/core` Cloudflare Workers,
plus the static `all/busy` Worker and the local `tools/vpc-probe` diagnostic.
Keep changes within that scope and preserve each Core's independent deployment
configuration.

Use Node.js 26.13.1 and pnpm 12.18.0. pnpm is the only package manager. After
changing dependencies, update `pnpm-lock.yaml` with `pnpm install`.

Before a substantial change, load a matching skill from the repository's
installed Intent package as described in [AGENTS.md](AGENTS.md). Follow the
local code patterns and keep helpers side-effect-light. Do not change Worker
names, routes, bindings, rate-limit namespaces, secrets, or Wrangler
Environments as part of cleanup.

Run the relevant package checks, then the root checks when the environment
allows:

```sh
pnpm run format:check
pnpm run lint:check
pnpm run typecheck
pnpm run knip
pnpm run test
pnpm run check:architecture
pnpm run check:spelling
pnpm run check:workers
```

For browser-visible changes, run the affected package's HTTP contract suite
with `pnpm --dir <unit> run test:api`. For a browser behavior change, run
`pnpm --dir <unit> run test:e2e` after installing Chromium. CI deliberately
skips Playwright.

Do not commit generated `cloudflare-env.d.ts` files. Add concise Markdown
evidence only for checks actually performed; never add raw logs or secrets.
