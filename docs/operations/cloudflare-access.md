# Cloudflare Access development check

`scripts/check-tunnel` verifies the Access-protected development Rails URL provided
through `EDGE_TUNNEL_RAILS_URL`. It uses `cloudflared access` to obtain a short-lived
browser-login token when needed, then checks reachability.

The check does not configure Access, change a Tunnel, or exercise a production
Core Worker. Do not place token contents in command output or evidence. External
Access applications, hostnames and policies remain owner-managed.
