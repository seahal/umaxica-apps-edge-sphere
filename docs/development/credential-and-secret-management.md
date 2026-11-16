# Credential and secret management

Every credential is obtained through an interactive login on the developer's machine and
is never committed. Long-lived API tokens are not used: an API token cannot open a
Wrangler remote-binding session, and a token that outlives its use is the failure this
policy avoids.

No credential may be written into this repository. `.dev.vars`, `.env`, `.env.local`,
`.env.*.local` and `.secrets/` are gitignored and must stay untracked.

## Obtaining credentials

| Need                | Command                                                           | Flow                 |
| ------------------- | ----------------------------------------------------------------- | -------------------- |
| GitHub (git + gh)   | an ssh-agent holding your GitHub key, and `GH_TOKEN`              | your own identity    |
| Cloudflare Wrangler | `pnpm run login` (`pnpm run login:device` over SSH)               | OAuth                |
| Cloudflare Access   | `cloudflared access login <url>` (`scripts/check-tunnel` prompts) | Access browser login |
| Claude Code         | `claude`, then `/login`                                           | OAuth                |
| Codex               | `codex login`                                                     | OAuth                |

`pnpm run login` runs `scripts/wrangler-login`; see
[Wrangler authentication](wrangler-authentication.md). Git remotes must be SSH — see
[Git and GitHub access](git-and-github-access.md).

## Rotation, revocation, and incidents

Credentials expire on their own and are reissued by the next browser login. For a
suspected exposure, revoke the session at the issuer (GitHub `Settings → Applications`,
the Cloudflare dashboard, the Anthropic or OpenAI console) and log out locally
(`pnpm exec wrangler logout`, `gh auth logout` where used).
