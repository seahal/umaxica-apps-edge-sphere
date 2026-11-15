# Static analysis and repository hygiene

This document describes the checks for Sphere after the package split. The two
workspace packages are `app/core` and `org/core`; `all/busy` and
`tools/vpc-probe` are outside the pnpm workspace.

| Check                  | Command                       | Scope                                              |
| ---------------------- | ----------------------------- | -------------------------------------------------- |
| Formatting             | `pnpm run format:check`       | Root and both Core packages, using Vite+           |
| Lint                   | `pnpm run lint:check`         | Root and both Core packages, type-aware, read-only |
| Type checking          | `pnpm run typecheck`          | Both Core packages, after local type generation    |
| Tests                  | `pnpm run test`               | Core unit tests and root `test/` invariants        |
| Knip                   | `pnpm run knip`               | Each Core package using its own config             |
| Architecture           | `pnpm run check:architecture` | `tools/` and the two API test runners              |
| Dependency versions    | `pnpm run check:deps`         | Root and both Core manifests                       |
| Spelling               | `pnpm run check:spelling`     | Repository prose and code                          |
| Wrangler configuration | `pnpm run check:workers`      | Both Core configs and the retained probe config    |
| Bundle size            | `pnpm run check:size`         | Core browser bundles; requires a build first       |

`pnpm run check` runs the static gates and tests. `pnpm run build` builds both
Core packages. HTTP and browser checks remain separate.

Each deployment package owns its own Vite, TypeScript, Vitest and Knip
configuration. Keep checks close to the code they validate.

Before adding a suppression or ignore to a static-analysis tool, document why
the check cannot express the intended rule and why a narrower code change is
not practical. Keep the exception in the smallest applicable package
configuration and record its owner and scope.
