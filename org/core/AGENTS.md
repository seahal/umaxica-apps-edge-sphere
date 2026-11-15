# Org Core: TanStack Start on Vite

`org/core` is one of the two regional Core Workers in this repository. It builds
with Vite and `@cloudflare/vite-plugin` and runs on workerd. The other Core is
`app/core`; the packages deploy independently and must not import each other.

The Core accepts its canonical `jp` hostname and the corresponding `us`
hostname. `src/lib/core-host-policy.ts` derives the alternate host from
`src/lib/canonical.ts`; `vite.config.ts` separately allowlists both hosts for
the development server. Keep the region dimension explicit when changing host
routing or backend configuration. Do not bake one regional backend into source.

Read the current TanStack and Cloudflare documentation when changing framework
integration:

- <https://tanstack.com/start/latest/docs/framework/react/overview>
- <https://tanstack.com/router/latest/docs/framework/react/guide/document-head-management>
- <https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/>

## Load-bearing behavior

- Health is served by four `text/plain` server routes: `/health`,
  `/health/startups`, `/health/livenesses`, and `/health/readinesses`. They skip
  the generic rate limiter. Rails JSON under `/health/*.json` stays blocked in
  `core-dispatch.ts`.
- `src/worker.ts` is Wrangler's entrypoint. It rate-limits once, routes
  Rails-owned paths to the origin selected for the public host's region, blocks
  private Rails health paths, and strips `Cookie` from requests and `Set-Cookie`
  from application responses.
  Rails-owned passthrough may preserve Rails' `Set-Cookie`.
- `src/lib/app-handler.ts` applies security headers only to documents rendered
  by this application. Do not move those headers onto Rails-owned responses.
- `src/lib/app-handler.ts` uses `defaultRenderHandler`, not
  `defaultStreamHandler`, so loader failures can return a real 500 document
  before the shell is sent.
- `src/routes/__root.tsx` declares no title. Each route owns its title, and
  `src/lib/title.ts` composes the suffix. The HTTP title contract asserts one
  title element.
- A leaf route whose sibling extends its path uses `.index.tsx`; otherwise
  TanStack's flat route naming can make the leaf a parent without an `<Outlet>`.
- `typescript/only-throw-error` is disabled in exactly two files named in
  `.oxlintrc.json`, because TanStack's `notFound()` and `redirect()` return
  objects callers throw. Do not widen the scope or add inline directives.
- `RAILS_ORIGIN_JP` and `RAILS_ORIGIN_US` are intentionally absent from current
  Wrangler tiers. Public `jp` and `us` hosts select matching origins; a local
  host needs an explicit `RAILS_REGION`. Missing or invalid regional origins
  fail closed. `.dev.vars.example` documents the optional local setup.
- Do not set `assets.directory` in `wrangler.jsonc`. `vite build` writes the
  asset directory into its output config. See
  `adr/013-frames-tanstack-start.md` and
  `adr/026-tanstack-start-stable-caret-range.md`.

The org Core's canonical origin is `https://jp.umaxica.org`.
