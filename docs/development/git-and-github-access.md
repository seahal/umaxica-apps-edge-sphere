# Git and GitHub access

The authoritative repository is `git@github.com:seahal/umaxica-apps-edge-sphere.git`.

Git and `gh` use the developer's own GitHub identity. No key file or token literal exists
in this repository:

| Operation                  | Credential  | How it arrives                                             |
| -------------------------- | ----------- | ---------------------------------------------------------- |
| `git` clone / fetch / push | ssh-agent   | `${SSH_AUTH_SOCK}`; the private key never leaves the agent |
| Host key verification      | known_hosts | `~/.ssh/known_hosts`                                       |
| `gh` API calls             | `GH_TOKEN`  | exported in your shell                                     |

`gh` resolves tokens in the order `GH_TOKEN` → `GITHUB_TOKEN` → its configuration file, so
`GH_TOKEN` wins over a stale stored token.

## Prerequisites

```bash
eval "$(ssh-agent -s)"          # if no agent is running
ssh-add                          # load the GitHub key
ssh-add -l                       # must list it
ssh -T git@github.com            # "Hi <user>! You've successfully authenticated"

export GH_TOKEN="$(gh auth token)"   # persist this in the shell profile
```

Scope the token to what the work needs — `repo` and `read:org` cover normal development.
Do not grant `admin:org`, `admin:repo_hook`, `workflow`, or any secret administration
scope. Bound the agent's reach too: a dedicated agent holding only the GitHub key, and
`ssh-add -t <seconds>` for a lifetime limit.

## Verifying

```bash
scripts/github-readonly-check
```

It checks `gh auth status`, `ssh -T git@github.com`, that `origin` is an SSH remote, and
`git ls-remote`. It does not push or mutate GitHub. Run the pieces directly if one fails:

```bash
ssh-add -l                # proves the agent is reachable
ssh -T git@github.com     # exit status 1 is SUCCESS here — GitHub grants no shell
git fetch
gh auth status
gh repo view
```
