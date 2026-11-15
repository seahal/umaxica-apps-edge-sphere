/** Static guardrails for the two retained Core revision representations. */
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

describe("Core revision representations", () => {
  it.each(cores)("%s owns TanStack Server Routes for both representations", (workspace) => {
    const textFile = `${workspace}/src/routes/revision.ts`;
    const jsonFile = `${workspace}/src/routes/api.v0.revision[.]json.ts`;
    expect(existsSync(join(repoRoot, textFile)), textFile).toBe(true);
    expect(existsSync(join(repoRoot, jsonFile)), jsonFile).toBe(true);
    expect(code(textFile)).toContain("createFileRoute('/revision')");
    expect(code(textFile)).toContain("revisionTextResponse");
    expect(code(jsonFile)).toContain("createFileRoute('/api/v0/revision.json')");
    expect(code(jsonFile)).toContain("revisionJsonResponse");
  });

  it.each(cores)("%s ships the Hurl contract for both representations", (workspace) => {
    const hurl = `${workspace}/api/revision-api.hurl`;
    expect(existsSync(join(repoRoot, hurl)), hurl).toBe(true);
    const source = read(hurl);
    expect(source).toContain("GET {{base}}/api/v0/revision.json");
    expect(source).toContain('jsonpath "$.*" count == 3');
    expect(source).toContain("GET {{base}}/revision\n");
    expect(source).toContain('header "content-type" matches /^text\\/plain/');
  });

  it("keeps the two Core Hurl contracts identical", () => {
    expect(new Set(cores.map((workspace) => read(`${workspace}/api/revision-api.hurl`))).size).toBe(
      1,
    );
  });

  it("keeps the shared revision implementation identical", () => {
    for (const file of ["src/lib/version-metadata.ts", "src/routes/api.v0.revision[.]json.ts"]) {
      expect(new Set(cores.map((workspace) => read(`${workspace}/${file}`))).size, file).toBe(1);
    }
  });
});
