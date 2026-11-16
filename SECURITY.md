# Security Policy

This repository contains the `app/core` and `org/core` Cloudflare Workers,
the static `all/busy` maintenance Worker, and local diagnostic tooling. The
Rails application is maintained elsewhere and is not covered by this policy.

## Reporting a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/seahal/umaxica-apps-edge-sphere/security/advisories/new).
For hardening suggestions and questions, open a public
[issue](https://github.com/seahal/umaxica-apps-edge-sphere/issues). Do not post
reproduction details for an unfixed vulnerability in a public issue.

Include the affected package or hostname, the commit SHA tested, what happened,
and the impact. Do not include another person's data or credentials.

## Supported versions

This repository publishes no versioned releases. The `main` branch is the
supported source; there are no maintenance branches or backports.

## Scope

In scope are `app/core`, `org/core`, `all/busy`, their production hostnames
under `umaxica.app` and `umaxica.org`, and the repository's build and deployment
configuration.

Out of scope:

- The Rails application and its repository.
- Cloudflare's platform, including Workers, Tunnel, and Access.
- Development tunnel hostnames and non-production environments.
- Test fixtures and clearly fake data.
- Denial of service, load testing, and rate-limit probing against production.
- Social engineering, physical attacks, and attacks aimed at the maintainer.

Research in good faith against your own data and accounts. Stop once impact is
confirmed and report it privately.

## Existing safeguards

- Each Core owns response headers and a CSP. Check its `public/_headers` and
  the current Core Wrangler configuration for the enforced policy.
- The Core Worker strips `Set-Cookie` from application responses. Rails-owned
  passthrough may preserve Rails cookies. Browser code accesses cookies only
  through the Cookie Store API.
- Request and Rails dispatch logs use closed fields and do not accept secrets,
  cookies, tokens, request bodies, user identifiers, or free text.
- Credentials are not stored in the repository. See
  [credential and secret management](docs/development/credential-and-secret-management.md).
- CI runs dependency and secret scanning. See
  `.github/workflows/integration.yaml`.
