# AI development tools

Claude Code and Codex are installed by the developer; this repository does not pin or
install them. No API key is committed and no permission bypass is enabled.

Both authenticate through their own browser login.

## Claude Code

```bash
claude      # then /login
```

## Codex

```bash
codex login
```

Run `scripts/check-ai-tools` to check tool versions, Bubblewrap availability, Codex sandbox
startup, and non-billable authentication resolution. The sandbox check runs
`codex sandbox /usr/bin/true` and does not send a model request. A credential does not
authorize a paid model request; obtain explicit approval before one.
