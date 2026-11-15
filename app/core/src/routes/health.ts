import { createFileRoute } from "@tanstack/react-router";

import { getRailsClient } from "../lib/rails-client";
import { checkRailsHealth, edgeReadinessFromRails } from "../lib/rails-health";
import { renderAggregateHealth, runtimeProbes } from "../lib/runtime-health";

/*
 * Human-readable aggregate of the three Kubernetes probes. Server route only:
 * no component, no HTML, no JSON. Rails availability is read at request time
 * from the origin configured for this request's region and mapped onto Edge's
 * text/plain contract.
 */
export const Route = createFileRoute("/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const isolate = runtimeProbes.checkReadiness();
        const readiness =
          isolate === "ok"
            ? edgeReadinessFromRails(await checkRailsHealth(getRailsClient(request)))
            : isolate;
        return renderAggregateHealth(readiness);
      },
    },
  },
});
