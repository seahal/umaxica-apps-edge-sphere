/** Static guardrails for the Vite-built Worker runtime in both Core packages. */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = join(import.meta.dirname, "..");
const cores = ["app/core", "org/core"] as const;
const read = (path: string) => readFileSync(join(repoRoot, path), "utf8");

describe("Core Workers build for workerd through Vite", () => {
  it.each(cores)("%s owns no Next.js or OpenNext configuration", (workspace) => {
    for (const leftover of [
      "next.config.ts",
      "open-next.config.ts",
      "next-env.d.ts",
      "postcss.config.mjs",
      ".open-next",
    ]) {
      expect(existsSync(join(repoRoot, workspace, leftover)), `${workspace}/${leftover}`).toBe(
        false,
      );
    }

    const manifest = JSON.parse(read(`${workspace}/package.json`)) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const declared = { ...manifest.dependencies, ...manifest.devDependencies };
    expect(Object.keys(declared)).not.toContain("next");
    expect(Object.keys(declared)).not.toContain("@opennextjs/cloudflare");
    expect(declared["@cloudflare/vite-plugin"]).toBe("catalog:");
    expect(declared.vite).toBe("catalog:");
  });
});
