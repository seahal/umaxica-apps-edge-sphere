# Development Tunnel boundary

> **2026-11-16 — development container and Podman Compose removed.** Every reference below to
> `compose.yaml`, `core`, `scripts/dev-start`, Podman networks or the containerised connector
> describes the removed setup. No replacement way to run the Edge-owned Tunnel connector is defined yet.

The development Compose setup retains a `cloudflare-tunnel` service for the
development network. Its presence is local tooling; it does not declare the
production routes or Worker inventory.

`scripts/check-tunnel` is the local entry point for checking the
Access-protected Rails development URL. It requires `EDGE_TUNNEL_RAILS_URL`
from the developer's environment and may open the Access browser login flow.
The script reports reachability without printing an access token.

This repository does not own the external Tunnel configuration. Changes to
Tunnel IDs, connector credentials, routes, DNS or Access policy require owner
action outside this work order. The former all-unit ingress matrix was removed
when Apex and public content packages moved to their own repositories.
