import { describe, expect, it } from "vitest";

import { CORE_ALTERNATE_HOST, CORE_PUBLIC_HOST } from "../../src/lib/core-host-policy";
import { parseRailsOrigin, railsOriginForHostname } from "../../src/lib/rails-origin";

describe("parseRailsOrigin", () => {
  it.each([
    ["https://rails.example", "https://rails.example"],
    ["https://rails.example/", "https://rails.example"],
    ["https://rails.example:8443", "https://rails.example:8443"],
    ["http://localhost:3000", "http://localhost:3000"],
    ["http://core.app.localhost:3000", "http://core.app.localhost:3000"],
  ])("accepts %s", (value, expected) => {
    expect(parseRailsOrigin(value)).toBe(expected);
  });

  it.each([
    ["undefined", undefined],
    ["a number", 3000],
    ["an empty string", ""],
    ["not a URL", "rails.example"],
    // The browser's cookies ride this hop; cleartext is for the dev container only.
    ["plain http to a public host", "http://rails.example"],
    ["plain http to a lookalike of localhost", "http://localhost.rails.example"],
    ["another scheme", "ftp://rails.example"],
    ["credentials", "https://user:secret@rails.example"],
    ["a path", "https://rails.example/api"],
    ["a query", "https://rails.example/?next=/"],
    ["a fragment", "https://rails.example/#top"],
  ])("rejects %s", (_label, value) => {
    expect(parseRailsOrigin(value)).toBeNull();
  });
});

describe("railsOriginForHostname", () => {
  const env = {
    RAILS_ORIGIN_JP: "https://rails-jp.example",
    RAILS_ORIGIN_US: "https://rails-us.example",
  };

  it("selects the configured origin for each public host region", () => {
    expect(railsOriginForHostname(env, CORE_PUBLIC_HOST)).toBe("https://rails-jp.example");
    expect(railsOriginForHostname(env, CORE_ALTERNATE_HOST)).toBe("https://rails-us.example");
  });

  it("uses an explicit region only for hosts without a public region label", () => {
    expect(railsOriginForHostname({ ...env, RAILS_REGION: "us" }, "localhost")).toBe(
      "https://rails-us.example",
    );
    expect(railsOriginForHostname({ ...env, RAILS_REGION: "us" }, CORE_PUBLIC_HOST)).toBe(
      "https://rails-jp.example",
    );
    expect(railsOriginForHostname(env, "unknown.example")).toBeNull();
    expect(railsOriginForHostname({ ...env, RAILS_REGION: "us" }, "unknown.example")).toBeNull();
    expect(railsOriginForHostname(env, undefined)).toBeNull();
  });

  it("fails closed when the selected region has no origin", () => {
    expect(
      railsOriginForHostname({ RAILS_ORIGIN_JP: env.RAILS_ORIGIN_JP }, CORE_ALTERNATE_HOST),
    ).toBe(null);
  });
});
