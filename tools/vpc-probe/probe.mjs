// The direct Workers VPC transport probe.
//
// This retained local diagnostic answers whether requests leave over the VPC
// binding and which Rails host answers them. The application packages that own
// these public content hosts moved to the Press repository; this probe remains
// here by owner decision and is not a deployed Sphere application surface.
//
// Therefore this module imports nothing from the application, reads no
// environment variables, and has no `fetch()` path. It calls the binding or it
// reports that the binding is absent. There is no third outcome.
//
// See adr/006-development-workers-vpc-transport.md and
// docs/operations/connectivity-acceptance.md.

// Fixed destinations, a module constant — one per surface that uses Workers
// VPC. Request input never selects them; the probe must not become a way to
// make the Worker fetch an arbitrary URL from inside the private network.
//
// Per Cloudflare's Workers VPC documentation the host here does NOT route the
// request; routing comes wholly from the VPC Service record. The host only
// populates the `Host` header (and SNI over https) and the port is ignored
// outright. Rails dispatches on that `Host`, which is why every surface appears
// here separately rather than one standing in for the rest: one Service is
// still one transport, but each host is a separate answer, and asking all of
// them can show that each reached its own namespace.
//
// The two Sphere Cores are absent: their code uses public fetch through the
// request region's `RAILS_ORIGIN_JP` / `RAILS_ORIGIN_US`, not Workers VPC
// (adr/018-core-rails-direct-internet.md).
//
// This fixed list belongs to the retained cross-repository probe. It does not
// define the current Sphere package or Wrangler inventory.
const RAILS_TARGETS = [
  { key: 'APP/DOCS', url: 'http://docs.app.localhost:3000/api/v0/health.json' },
  { key: 'APP/NEWS', url: 'http://news.app.localhost:3000/api/v0/health.json' },
  { key: 'APP/HELP', url: 'http://help.app.localhost:3000/api/v0/health.json' },
  { key: 'APP/INFO', url: 'http://info.app.localhost:3000/api/v0/health.json' },
  { key: 'COM/DOCS', url: 'http://docs.com.localhost:3000/api/v0/health.json' },
  { key: 'COM/NEWS', url: 'http://news.com.localhost:3000/api/v0/health.json' },
  { key: 'COM/HELP', url: 'http://help.com.localhost:3000/api/v0/health.json' },
  { key: 'COM/INFO', url: 'http://info.com.localhost:3000/api/v0/health.json' },
  { key: 'ORG/DOCS', url: 'http://docs.org.localhost:3000/api/v0/health.json' },
  { key: 'ORG/NEWS', url: 'http://news.org.localhost:3000/api/v0/health.json' },
  { key: 'ORG/HELP', url: 'http://help.org.localhost:3000/api/v0/health.json' },
  { key: 'ORG/INFO', url: 'http://info.org.localhost:3000/api/v0/health.json' },
];

const TIMEOUT_MS = 15_000;

async function probeTarget(binding, { key, url }) {
  try {
    const response = await binding.fetch(url, {
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    // The body is returned so the checker can read the `namespace` field and
    // confirm Rails answered with this frame's liveness document rather than,
    // say, another frame's or an Access login page. Parsing stays in the
    // checker; this module reports what it saw and judges nothing.
    return {
      key,
      probe: 'reached',
      url,
      status: response.status,
      contentType: response.headers.get('content-type'),
      body: (await response.text()).slice(0, 500),
    };
  } catch (error) {
    // Workers VPC throws with a documented code (connection_refused,
    // destination_unavailable, dns_error, …). Pass it through untouched; the
    // checker maps it to a layer, and inventing categories here would lose it.
    return {
      key,
      probe: 'transport-error',
      url,
      message: String(error),
      cause: String(error?.cause ?? ''),
    };
  }
}

export default {
  async fetch(request, env) {
    const binding = env.UMAXICA_APPS_EDGE_CF_WORKERS_VPC;
    if (!binding) {
      return Response.json({ probe: 'binding-missing' }, { status: 503 });
    }

    // Readiness is answered without touching the binding. The checker polls
    // until `wrangler dev` is listening, and a poll that ran the real probe
    // would send requests to every fixed Rails target per attempt.
    if (new URL(request.url).pathname === '/ready') {
      return Response.json({ probe: 'ready', targets: RAILS_TARGETS.length });
    }

    const results = [];
    for (const target of RAILS_TARGETS) {
      results.push(await probeTarget(binding, target));
    }
    return Response.json({ probe: 'multi', results });
  },
};
