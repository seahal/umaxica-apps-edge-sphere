import "@tanstack/react-start/server-only";
import { getEdgeEnv } from "./cloudflare-env";
import { railsOriginForHostname } from "./rails-origin";
import { getRequestId } from "./request-log";

const RAILS_FETCH_TIMEOUT_MS = 2000;

// Stripped from every outbound request, always. This is about never RELAYING a
// caller's credentials to Rails — a browser session cookie or an inbound Access
// token must not become a Rails-side identity.
const FORBIDDEN_REQUEST_HEADERS = [
  "cookie",
  "authorization",
  "cf-access-client-id",
  "cf-access-client-secret",
];

export interface RailsFetcher {
  fetch(input: string, init?: RequestInit): Promise<Response>;
}

export type RailsClientInit = Pick<RequestInit, "method" | "headers" | "body">;

export type RailsClientResult =
  | { kind: "ok"; status: number; response: Response; signal?: AbortSignal }
  | { kind: "http-error"; status: number; response: Response; signal?: AbortSignal }
  | { kind: "timeout" }
  | { kind: "unreachable"; errorMessage: string }
  | { kind: "invalid-path"; reason: string };

export interface RailsClient {
  fetch(path: string, init?: RailsClientInit): Promise<RailsClientResult>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isTimeoutError(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && Reflect.get(error, "name") === "TimeoutError"
  );
}

function hasControlCharacter(path: string): boolean {
  for (let i = 0; i < path.length; i += 1) {
    const code = path.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) {
      return true;
    }
  }
  return false;
}

function validateRelativePath(path: string): string | null {
  if (path.length === 0) {
    return "path must not be empty";
  }
  if (!path.startsWith("/")) {
    return "path must start with a single leading slash";
  }
  if (path.startsWith("//")) {
    return "path must not be protocol-relative";
  }
  if (path.includes("://")) {
    return "path must not embed a scheme";
  }
  if (path.includes("\\")) {
    return "path must not contain a backslash";
  }
  if (hasControlCharacter(path)) {
    return "path must not contain control characters";
  }
  return null;
}

function buildSanitizedHeaders(init: RailsClientInit | undefined): Headers {
  const headers = new Headers(init?.headers);
  for (const forbidden of FORBIDDEN_REQUEST_HEADERS) {
    headers.delete(forbidden);
  }
  const requestId = getRequestId();
  if (requestId !== undefined) headers.set("x-request-id", requestId);
  return headers;
}

export function createRailsClient(fetcher: RailsFetcher, origin: string): RailsClient {
  return {
    async fetch(path, init) {
      const validationError = validateRelativePath(path);
      if (validationError) {
        return { kind: "invalid-path", reason: validationError };
      }

      const url = new URL(path, `${origin}/`);
      if (url.origin !== origin) {
        return { kind: "invalid-path", reason: "path resolved outside the fixed origin" };
      }

      const signal = AbortSignal.timeout(RAILS_FETCH_TIMEOUT_MS);
      try {
        const response = await fetcher.fetch(url.toString(), {
          ...(init?.method === undefined ? {} : { method: init.method }),
          ...(init?.body === undefined ? {} : { body: init.body }),
          headers: buildSanitizedHeaders(init),
          redirect: "manual",
          cache: "no-store",
          signal,
        });

        if (!response.ok) {
          return { kind: "http-error", status: response.status, response, signal };
        }

        return { kind: "ok", status: response.status, response, signal };
      } catch (error) {
        if (isTimeoutError(error) || signal.aborted) {
          return { kind: "timeout" };
        }
        return { kind: "unreachable", errorMessage: getErrorMessage(error) };
      }
    },
  };
}

/**
 * The Rails client for this Core, or null — reported as `not-configured` — when
 * this tier names no Rails origin. Fail closed.
 *
 * The Worker's own `fetch` uses the origin selected by the request's `jp` or
 * `us` host. Local requests without a regional host can provide `RAILS_REGION`
 * explicitly; no region is guessed.
 *
 * `fetch` is wrapped rather than passed as `{ fetch }`: called as a method of
 * another object, the runtime's `fetch` receives the wrong `this`, which workerd
 * rejects as an illegal invocation.
 */
export function getRailsClient(request: Request): RailsClient | null {
  // Read untyped: no tier declares regional Rails origins yet, so wrangler types omits them.
  const origin = railsOriginForHostname(getEdgeEnv(), new URL(request.url).hostname);
  if (origin === null) {
    return null;
  }
  return createRailsClient({ fetch: (input, init) => fetch(input, init) }, origin);
}
