/**
 * Static guardrails for the Edge-owned Tunnel connector and secret boundary.
 * Edge and Global use different Tunnel IDs and tokens and share no Podman network.
 * Everything reads files directly, so the checks require no container engine.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = join(import.meta.dirname, '..');
const read = (relativePath: string) => readFileSync(join(repoRoot, relativePath), 'utf8');

const composeBase = read('compose.yaml');
const composeWorkspace = read('compose.workspace.yaml');
// `compose.override.yaml` is the OPTIONAL developer-local override: gitignored,
// absent on a fresh clone, never created automatically, and carrying arbitrary
// host-specific edits where it exists. Only the tracked example can be asserted
// on, and it is documentation rather than a required input.
const composeOverrideExample = read('compose.override.yaml.example');

/**
 * Every compose file that can define a service, checked as one set.
 *
 * Enumerated rather than globbed so that adding a compose file is a deliberate
 * act: a new override that nobody adds here would sit outside these assertions
 * while looking covered. The repository is meant to have exactly these two —
 * the complete standard environment, and the documented example override — so
 * the count is asserted, not just the names.
 */
const composeFiles = [
  ['compose.yaml', composeBase],
  ['compose.override.yaml.example', composeOverrideExample],
] as const;

/**
 * Source files worth scanning for leaked secrets.
 *
 * Enumerated via `git ls-files` rather than a directory walk: it is exactly the
 * set of files that can reach another machine, and it skips build output,
 * node_modules, and untracked tool caches for free.
 */
function collectSourceFiles(): string[] {
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.jsonc'];

  return (
    trackedFiles()
      .filter((path) => extensions.some((extension) => path.endsWith(extension)))
      .map((path) => join(repoRoot, path))
      // `git ls-files` still lists files deleted in the working tree but not yet
      // staged. They cannot reach another machine, so skip them.
      .filter((path) => existsSync(path))
  );
}

function trackedFiles(): string[] {
  const injected = process.env['EDGE_TRACKED_FILES'];
  if (injected !== undefined) {
    return injected.split('\n').filter(Boolean);
  }
  return execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

describe('Edge-owned tunnel connector', () => {
  it('pins the supported cloudflared release in the shared file only', () => {
    // The connector is shared infrastructure, so it is defined once, centrally.
    // Only its token is per-developer, and that comes from the gitignored `.env`
    // rather than from the developer-local overlay.
    expect(composeBase).toContain('docker.io/cloudflare/cloudflared:2026.8.2');
    expect(composeOverrideExample).not.toContain('cloudflared');
  });

  it('keeps exactly three compose files, each with a distinct role', () => {
    // The assertions above are only as complete as this list: the shared
    // services and the per-unit dev servers are in `compose.yaml`, `core` is in
    // `compose.workspace.yaml`, and everything machine-specific goes in the
    // optional `compose.override.yaml` that `compose.override.yaml.example`
    // documents. A new file must be added here to be covered, so make the
    // omission fail.
    for (const [name] of composeFiles) {
      expect(existsSync(join(repoRoot, name)), `${name} is asserted on but missing`).toBe(true);
    }

    const trackedCompose = trackedFiles()
      .filter((path) => /(?:^|\/)compose\..*ya?ml(?:\.example)?$/u.test(path))
      .sort();
    expect(trackedCompose).toEqual([
      'compose.override.yaml.example',
      'compose.workspace.yaml',
      'compose.yaml',
    ]);

    // Invariant E: the override itself must stay untracked. Committing it would
    // put one developer's host in everyone's checkout, and it would silently
    // outrank the example these invariants read. The retired `compose.custom.*`
    // names must not come back either.
    expect(trackedCompose).not.toContain('compose.override.yaml');
    expect(trackedCompose).not.toContain('compose.custom.yaml');
    expect(trackedCompose).not.toContain('compose.custom.yaml.example');
  });

  it('defines one hardened connector without a cross-project network', () => {
    // `core` is the only service in the workspace file, and the connector is
    // the only service in `compose.yaml` without a profile -- the two Core dev
    // servers all sit behind `profiles: [app]`, so a bare `podman compose up`
    // starts the connector and nothing else.
    const namesIn = (text: string): string[] => {
      const block = /^services:\n((?: .*\n|\n)*)/mu.exec(text)?.[1] ?? '';
      return [...block.matchAll(/^ {2}([a-z0-9][\w-]*):/gmu)].map((match) => match[1] as string);
    };
    expect(namesIn(composeWorkspace)).toEqual(['core']);

    const alwaysStarted = namesIn(composeBase).filter((name) => {
      const body =
        new RegExp(`^ {2}${name}:\n((?: {4}.*\n|\n)*)`, 'mu').exec(composeBase)?.[1] ?? '';
      return !body.includes('<<: *unit') && !body.includes('profiles:');
    });
    expect(alwaysStarted).toEqual(['cloudflare-tunnel']);

    const connector = /^ {2}cloudflare-tunnel:\n((?: {4}.*\n|\n)*)/mu.exec(composeBase)?.[1] ?? '';
    expect(connector).not.toBe('');
    expect(connector).not.toContain('umaxica-edge-tunnel');
    expect(connector).not.toContain('host.docker.internal');
    expect(connector).toContain('read_only: true');
    expect(connector).toContain('no-new-privileges:true');
    expect(connector).toContain('cap_drop:');
    expect(connector).toContain('restart: on-failure:3');
  });
});

describe('secret hygiene', () => {
  it('keeps .env untracked and ignored', () => {
    const tracked = trackedFiles();

    expect(tracked).not.toContain('.env');
    expect(tracked.filter((path) => path.startsWith('.env') && path !== '.env.example')).toEqual(
      [],
    );
    expect(read('.gitignore')).toMatch(/^\.env$/mu);
  });

  it('ships value-free .env examples everywhere', () => {
    /*
     * Name-agnostic on purpose: rather than listing the variables that happen to
     * exist today, assert that no tracked `.env.example` assigns a value to
     * anything. A new secret added to an example is then caught without anyone
     * remembering to extend this test.
     *
     * Local Rails connectivity needs no environment credential or public
     * fallback origin, so every tracked example must remain value-free.
     */
    const allowedWithValue = new Set<string>();
    const offenders: string[] = [];

    for (const path of trackedFiles().filter(
      (file) => file.endsWith('.env.example') && existsSync(join(repoRoot, file)),
    )) {
      for (const line of read(path).split('\n')) {
        const match = /^([A-Z0-9_]+)=(.+)$/u.exec(line.trim());
        if (match && !allowedWithValue.has(match[1] as string)) {
          offenders.push(`${path}: ${match[1]}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('never exposes a credential through a client-visible variable prefix', () => {
    // NEXT_PUBLIC_* and VITE_* are inlined into the browser bundle at build
    // time. A name matching /token|secret|credential/ under those prefixes is
    // a leak regardless of the value.
    const forbidden =
      /\b(?:NEXT_PUBLIC|VITE)_[A-Z0-9_]*(?:TOKEN|SECRET|CREDENTIAL|PRIVATE_KEY)[A-Z0-9_]*\b/u;
    const offenders: string[] = [];

    for (const file of collectSourceFiles()) {
      if (relative(repoRoot, file) === relative(repoRoot, import.meta.filename)) continue;
      if (forbidden.test(readFileSync(file, 'utf8'))) {
        offenders.push(relative(repoRoot, file));
      }
    }

    expect(offenders).toEqual([]);
  });

  it('never relays an inbound caller credential onward to Rails', () => {
    /*
     * The direction of trust. A credential arriving on an inbound request — a
     * browser session cookie, an `Authorization` header, an Access token
     * belonging to the end user — must never be forwarded to Rails. Every copy
     * strips those before dispatch, and applies its own transport credentials
     * only afterwards, so `init.headers` cannot smuggle one through.
     *
     * `test/rails-connection-invariants.test.ts` covers the other half: no
     * credential may be committed to source or to `wrangler.jsonc`.
     */
    const clients = ['app/core', 'org/core'].map((core) => `${core}/src/lib/rails-client.ts`);

    for (const client of clients) {
      const source = read(client);

      /*
       * Server-only, so nothing here can be bundled for the browser — and it has
       * to be the marker the unit's own bundler enforces. The `server-only`
       * package makes a Next build fail; `@tanstack/react-start/server-only` is
       * the equivalent for a Vite frame, denied in the client environment by the
       * Start plugin. Either satisfies the invariant; neither is optional.
       */
      expect(source, `${client} must be server-only`).toMatch(
        /import (['"])(?:server-only|@tanstack\/react-start\/server-only)\1/u,
      );

      for (const header of [
        'cookie',
        'authorization',
        'cf-access-client-id',
        'cf-access-client-secret',
      ]) {
        expect(source, `${client} must strip ${header}`).toMatch(new RegExp(`['"]${header}['"]`, 'u'));
      }

      const stripIndex = source.indexOf('FORBIDDEN_REQUEST_HEADERS) {');
      expect(stripIndex, `${client} lost the header strip`).toBeGreaterThan(-1);

      // No frame applies a transport credential after the strip: the Cores reach
      // Rails over the public internet with none at all
      // (adr/018-core-rails-direct-internet.md) and the public cells through the
      // Workers VPC binding, which carries none either — so nothing may be added
      // back.
      expect(source, `${client} must apply no transport credentials`).not.toContain('authHeaders');
    }
  });
});

describe('environment separation', () => {
  it('keeps the application environment at development, never aliased to staging', () => {
    // If staging returns, it arrives as new wrangler env blocks and new
    // Cloudflare config — not as a branch in application code.
    const offenders: string[] = [];

    for (const file of collectSourceFiles()) {
      const path = relative(repoRoot, file);
      if (path.includes('test/') || path.endsWith('.test.ts') || path.endsWith('.test.tsx'))
        continue;
      if (path === 'plans' || path.startsWith('plans/')) continue;
      if (
        /(?:ENV|environment|NODE_ENV)\b[^\n]{0,40}===?\s*['"]staging['"]/u.test(
          readFileSync(file, 'utf8'),
        )
      ) {
        offenders.push(path);
      }
    }

    expect(offenders).toEqual([]);
    expect(composeBase).toMatch(/CLOUDFLARE_ENV:\s*development/u);
    expect(composeBase).not.toMatch(/CLOUDFLARE_ENV:\s*staging/u);
  });
});
