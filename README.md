# SageFin for AI apps

A plugin that connects Claude and other AI apps to your [SageFin](https://sagefin.app) household
and teaches them to work on your books.

It is two things in one install:

- **The connection.** It registers SageFin's MCP server, so Claude can read your accounts,
  transactions, budgets and categories with a token you create.
- **Skills.** Instructions that teach Claude how to do one job well with those tools. The first is
  **smart match**.

## Smart match

SageFin categorizes every transaction as it arrives, from the bank's description, the merchant,
the amount and the date. It cannot see what you know: which orders were for the rental, that a
vendor belongs to the new company, the receipts in a folder on your computer.

Claude, running on your machine, can. Smart match has it:

1. Read your categories and collect the transactions that have none or are flagged for review.
2. Ask you what the transactions do not say, and read any files you point it at.
3. Send its categorizations as **one batch** that waits for you in SageFin, where you untick what
   you disagree with and accept the rest.
4. Suggest a **rule** for any merchant that keeps coming up, so next month's are right on arrival.

Nothing changes in SageFin until you accept it there, unless you set the token to apply changes
immediately. An applied batch can be taken back for 30 days. Claude cannot create a rule; it can
only suggest one for you to save.

## Install

### Claude Code

One step. The plugin registers the SageFin server and asks for your token.

```bash
claude plugin marketplace add bytefoo/sagefin-plugin
```

```bash
claude plugin install sagefin@sagefin
```

### Codex

Two steps: install the skill, then add the SageFin server yourself.

```bash
codex plugin marketplace add bytefoo/sagefin-plugin
```

```bash
codex plugin add sagefin@sagefin
```

Then add the server to `~/.codex/config.toml`, and set `SAGEFIN_TOKEN` in your environment:

```toml
[mcp_servers.sagefin]
url = "https://api.sagefin.app/mcp"
bearer_token_env_var = "SAGEFIN_TOKEN"
```

### Gemini CLI

Two steps: install the skill, then add the SageFin server yourself.

```bash
gemini extensions install https://github.com/bytefoo/sagefin-plugin
```

Then add the server to `~/.gemini/settings.json`, with your token in place of `YOUR_TOKEN`:

```json
{
  "mcpServers": {
    "sagefin": {
      "httpUrl": "https://api.sagefin.app/mcp",
      "headers": { "Authorization": "Bearer YOUR_TOKEN" }
    }
  }
}
```

### Cursor

The repo carries the shared `plugin.json` that Cursor reads, so the skill should install from this
repository. That has not been tried. Add the SageFin server in Cursor's MCP settings with the
address `https://api.sagefin.app/mcp` and an `Authorization: Bearer` header carrying your token.

### Why only Claude Code is one step

Each of these apps has its own way of taking a token from you, and only Claude Code's lets a
plugin ask for one and pass it to the server. The others would install a server entry with no
token, and every call would be refused. So outside Claude Code the plugin carries the skill and
you add the server.

### The token

Create one in SageFin under **Settings → Integrations**. That screen also shows the configuration
to paste for the app you are connecting.

- Tick **MCP**, **Transactions** and **Categories**. Add **Accounts**, **Budgets** or **Cash
  flow** if you also want to ask about those.
- To let the app propose changes, give the token write access and turn on the household's
  "Allow MCP write tools" switch on the same screen. Without both, it is read-only.
- Leave bulk changes on **Ask me first** unless you want batches applied without review.

Then ask it to "run smart match", or to categorize your uncategorized transactions.

## What leaves SageFin

Whatever the token can read is sent to the AI app you connect, and through it to that app's model
provider. That is your decision to make, per token. A token carries only the permissions you
tick, and you can revoke it in SageFin at any time. The text of your transaction notes is never
returned by any tool. See
[Connecting an AI app](https://sagefin.app/help/ai-app-access) for the full account.

## Layout

```text
skills/smart-match/SKILL.md        the skill, shared by every client
tools.json                         the server tools the skills name

.claude-plugin/marketplace.json    Claude Code's catalog: one plugin, this repo
.claude-plugin/plugin.json         Claude Code: name, version, and the token it asks for
.mcp.json                          Claude Code: the SageFin MCP server
plugin.json                        the shared Agent Plugins manifest, read by Codex and Cursor
gemini-extension.json              Gemini CLI

scripts/check-skills.mjs           fails when a skill names an unlisted tool, when the three
                                   manifests disagree on name or version, or when a manifest
                                   other than Claude's registers the server
```

## Working on it

```bash
node scripts/check-skills.mjs
```

```bash
npx -y @anthropic-ai/claude-code plugin validate . --strict
```

```bash
npx -y @google/gemini-cli extensions validate .
```

To try a change without publishing it, load the plugin from disk:

```bash
claude --plugin-dir .
```

A version bump goes in all three manifests; the check fails if they differ.

A skill is instructions to a model, so a test cannot tell you whether it is right. Run it against
a real backlog and read what it does.

## License

MIT. See [LICENSE](LICENSE).
