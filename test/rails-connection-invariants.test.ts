/** Static guardrails for the two Core Workers' Rails transport boundary. */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseJsonc } from "../tools/lib/wrangler-config.mjs";

const repoRoot = join(import.meta.dirname, "..");
const cores = ["app/core", "org/core"] as const;
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");
const code = (path: string) =>
  read(path)
    .replace(/\/\*[\s\S]*?\*\//gu, "")
    .replace(/\/\/.*$/gmu, "");

describe("Core Rails transport", () => {
  it.each(cores)("%s keeps the current Wrangler tiers fail-closed", (workspace) => {
    const config = parseJsonc(read(`${workspace}/wrangler.jsonc`)) as {
      vars?: Record<string, unknown>;
      env?: Record<string, { vars?: Record<string, unknown>; vpc_services?: unknown[] }>;
      vpc_services?: unknown[];
    };
    expect(config.vars?.RAILS_ORIGIN).toBeUndefined();
    expect(config.vars?.RAILS_ORIGIN_JP).toBeUndefined();
    expect(config.vars?.RAILS_ORIGIN_US).toBeUndefined();
    expect(config.vpc_services ?? []).toEqual([]);
    expect(config.env?.local?.vars?.RAILS_ORIGIN).toBeUndefined();
    expect(config.env?.local?.vars?.RAILS_ORIGIN_JP).toBeUndefined();
    expect(config.env?.local?.vars?.RAILS_ORIGIN_US).toBeUndefined();
    expect(config.env?.development?.vars?.RAILS_ORIGIN).toBeUndefined();
    expect(config.env?.development?.vars?.RAILS_ORIGIN_JP).toBeUndefined();
    expect(config.env?.development?.vars?.RAILS_ORIGIN_US).toBeUndefined();
    expect(config.env?.test?.vars?.RAILS_ORIGIN).toBeUndefined();
    expect(config.env?.test?.vars?.RAILS_ORIGIN_JP).toBeUndefined();
    expect(config.env?.test?.vars?.RAILS_ORIGIN_US).toBeUndefined();
    expect(Object.keys(config.env ?? {})).not.toContain("vpc");
  });

  it.each(cores)(
    "%s selects the region-keyed origin through the validated public fetch client",
    (workspace) => {
      const client = code(`${workspace}/src/lib/rails-client.ts`);
      const origin = code(`${workspace}/src/lib/rails-origin.ts`);
      expect(client).toContain("railsOriginForHostname");
      expect(origin).toContain("RAILS_ORIGIN_JP");
      expect(origin).toContain("RAILS_ORIGIN_US");
      expect(origin).toContain("parseRailsOrigin");
      expect(client).toContain("fetch(input, init)");
      expect(origin).toContain("url.protocol !== 'https:'");
      expect(origin).toContain("localhost");
    },
  );

  it("keeps the two Core transport copies aligned", () => {
    for (const file of [
      "src/lib/rails-client.ts",
      "src/lib/rails-origin.ts",
      "src/lib/rails-health.ts",
      "src/lib/core-dispatch.ts",
      "src/worker.ts",
    ]) {
      const copies = cores.map((workspace) =>
        read(`${workspace}/${file}`).replace(/umaxica\.(app|org)/gu, "umaxica.HOST"),
      );
      expect(new Set(copies).size, file).toBe(1);
    }
  });

  it("keeps the region hosts explicit without baking a regional backend into source", () => {
    for (const workspace of cores) {
      const hostPolicy = read(`${workspace}/src/lib/core-host-policy.ts`);
      const vite = read(`${workspace}/vite.config.ts`);
      expect(hostPolicy).toContain("replace(/^jp\\./u, 'us.')");
      expect(vite).toContain("jp.umaxica.");
      expect(vite).toContain("us.umaxica.");
    }
  });

  it("keeps the VPC probe separate from Core request dispatch", () => {
    for (const workspace of cores) {
      expect(read(`${workspace}/wrangler.jsonc`)).not.toContain("UMAXICA_APPS_EDGE_CF_WORKERS_VPC");
    }
    expect(read("tools/vpc-probe/probe.mjs")).toContain("UMAXICA_APPS_EDGE_CF_WORKERS_VPC");
  });
});
