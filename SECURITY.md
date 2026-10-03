# Security

This plugin holds no code that runs on your computer. It is a set of instructions and the address
of SageFin's MCP server. The token you give it is stored by Claude Code in your system's secure
credential store and sent only to `https://api.sagefin.app`.

## Reporting a vulnerability

Report it privately through GitHub: open
[a private vulnerability report](https://github.com/bytefoo/sagefin-plugin/security/advisories/new)
(**Security → Report a vulnerability** on this repository). Please do not open a public issue or
pull request for it.

Say what you found and how to reproduce it. A problem in SageFin itself, rather than in this
plugin, can be reported the same way.

## If a token gets out

Revoke it in SageFin under **Settings → Integrations**. It stops working at once.
