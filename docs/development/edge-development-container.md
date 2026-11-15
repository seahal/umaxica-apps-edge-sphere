# Sphere development container

`Containerfile` builds the rootless Podman development image. Its project
toolchain pins Node.js 26.13.1 and pnpm 12.18.0, matching the repository's
`package.json` configuration. The image also provides GitHub CLI, Chromium
prerequisites and project-installed Wrangler tooling.

pnpm is installed from the standalone installer into `PNPM_HOME`; Corepack is
removed from the image. The effective container user is `edge` with the
rootless keep-id mapping. Host credential directories, private keys and
container-engine sockets are not mounted into the development workspace.

See [development environment overview](development-environment-overview.md)
for the current package and port list, and
[container security policy](container-security-policy.md) for the credential
boundary.
