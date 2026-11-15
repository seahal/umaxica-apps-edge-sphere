/** Static guardrails for the two retained Core self-health APIs. */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..");
const cores = ["app/core", "org/core"] as const;
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");
const code = (path: string) =>
  read(path)
    .replace(/\/\*[\s\S]*?\*\//gu, "")
    .replace(/\/\/.*$/gmu, "");

describe("Core self-health API", () => {
  it.each(cores)("%s owns a TanStack Server Route for the literal JSON path", (workspace) => {
    const file = `${workspace}/src/routes/api.v0.health[.]json.ts`;
    expect(existsSync(join(repoRoot, file)), file).toBe(true);
    const source = code(file);
    expect(source).toContain("createFileRoute('/api/v0/health.json')");
    expect(source).toContain("renderHealthApi");
    expect(source).not.toContain("checkRailsHealth");
    expect(source).not.toContain("getRailsClient");
  });

  it("keeps the two Core Hurl contracts identical", () => {
    const contracts = cores.map((workspace) => read(`${workspace}/api/health-api.hurl`));
    expect(new Set(contracts).size).toBe(1);
    for (const source of contracts) {
      expect(source).toContain("GET {{base}}/api/v0/health.json");
      expect(source).toContain('header "cache-control" contains "no-store"');
      expect(source).toContain('jsonpath "$.rails" not exists');
      expect(source).toContain('jsonpath "$.revision" not exists');
    }
  });

  it.each(cores)("%s dispatch keeps self-health on Edge, not Rails", (workspace) => {
    const source = code(`${workspace}/src/lib/core-dispatch.ts`);
    expect(source).toContain("const EDGE_SELF_HEALTH_API = '/api/v0/health.json'");
    expect(source).toContain("const EDGE_REVISION_API = '/api/v0/revision.json'");
    expect(source).toContain("pathname === EDGE_SELF_HEALTH_API || pathname === EDGE_REVISION_API");
  });
});
