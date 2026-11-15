import { afterEach, describe, expect, it, vi } from "vitest";

import { getRailsClient } from "../../src/lib/rails-client";
// `cloudflare:workers` is a runtime module only workerd resolves, so
// `vitest.config.ts` aliases it to this mutable stand-in. Setting a var is
// therefore an assignment rather than a mock return value — the shape the
// runtime actually has.
import { env } from "../__mocks__/cloudflare-workers";

describe("org/core rails client", () => {
  afterEach(() => {
    for (const key of Object.keys(env)) delete env[key];
    vi.unstubAllGlobals();
  });

  it.each(["https://core.rails.example", "http://core.org.localhost:3000"])(
    "fetches from the jp Rails origin %s with the runtime fetch",
    async (origin) => {
      const fetchSpy = vi.fn<typeof fetch>(() =>
        Promise.resolve(new Response("ok", { status: 200 })),
      );
      vi.stubGlobal("fetch", fetchSpy);
      env["RAILS_ORIGIN_JP"] = origin;

      const client = getRailsClient(new Request("https://jp.umaxica.org/health"));
      expect(client).not.toBeNull();

      await client?.fetch("/api/v0/health.json");

      const [requestUrl, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(requestUrl).toBe(`${origin}/api/v0/health.json`);

      const headers = new Headers(init.headers);
      expect(headers.has("cf-access-client-id")).toBe(false);
      expect(headers.has("cf-access-client-secret")).toBe(false);
    },
  );

  it("selects the request host region and does not fall back to the jp origin", async () => {
    env["RAILS_ORIGIN_JP"] = "https://rails-jp.example";
    expect(getRailsClient(new Request("https://us.umaxica.org/health"))).toBeNull();
    env["RAILS_ORIGIN_US"] = "https://rails-us.example";

    const fetchSpy = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response("ok", { status: 200 })),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const client = getRailsClient(new Request("https://us.umaxica.org/health"));
    expect(client).not.toBeNull();
    await client?.fetch("/api/v0/health.json");
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("https://rails-us.example/api/v0/health.json");
    expect(getRailsClient(new Request("https://workers.dev/health"))).toBeNull();
  });

  it("fails closed to null for plain http to a public host", () => {
    env["RAILS_ORIGIN_JP"] = "http://core.rails.example";

    expect(getRailsClient(new Request("https://jp.umaxica.org/health"))).toBeNull();
  });
});
