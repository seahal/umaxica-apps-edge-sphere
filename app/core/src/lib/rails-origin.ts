import { coreRegionForHostname, type CoreRegion } from "./core-host-policy";

/**
 * The Rails origin for a region, read from its `RAILS_ORIGIN_<REGION>` var.
 *
 * Rails is reached over the public internet with the Worker's ordinary `fetch` —
 * there is no Workers VPC binding (`adr/018-core-rails-direct-internet.md`). Each
 * region has a separate value, configured per tier, never hard-coded in code.
 *
 * Anything that is not a bare origin counts as not configured, so a typo fails
 * closed instead of sending a request somewhere unintended. Plain `http` is
 * accepted only for a `*.localhost` host: the browser's own Cookie and
 * Authorization headers travel on this hop, and outside the development
 * container they must not cross the internet in cleartext.
 */
export function parseRailsOrigin(value: unknown): string | null {
  if (typeof value !== "string" || value === "") {
    return null;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const isLocalHost = url.hostname === "localhost" || url.hostname.endsWith(".localhost");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalHost)) {
    return null;
  }
  if (url.username !== "" || url.password !== "") {
    return null;
  }
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "") {
    return null;
  }

  return url.origin;
}

export function railsOriginForHostname(env: unknown, hostname: string | undefined): string | null {
  if (typeof env !== "object" || env === null) return null;
  const region = coreRegionForHostname(hostname, Reflect.get(env, "RAILS_REGION"));
  if (region === null) return null;

  const key: `RAILS_ORIGIN_${Uppercase<CoreRegion>}` =
    region === "jp" ? "RAILS_ORIGIN_JP" : "RAILS_ORIGIN_US";
  return parseRailsOrigin(Reflect.get(env, key));
}
