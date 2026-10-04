# Security

This plugin holds no code that runs on your computer. It is a set of instructions and the address
of SageFin's MCP server. It holds no credential: Claude Code signs you in to SageFin itself, holds
that sign-in, and sends it only to SageFin.

## Reporting a vulnerability

Report it privately through GitHub: open
[a private vulnerability report](https://github.com/bytefoo/sagefin-plugin/security/advisories/new)
(**Security → Report a vulnerability** on this repository). Please do not open a public issue or
pull request for it.

Say what you found and how to reproduce it. A problem in SageFin itself, rather than in this
plugin, can be reported the same way.

## If a sign-in or a token gets out

In SageFin, under **Settings → Integrations**, disconnect the app or revoke the token. Either stops
working at once.
