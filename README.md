# SageFin for AI apps

A plugin that connects Claude to your [SageFin](https://sagefin.app) household and teaches it to
work on your books.

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

In Claude Code:

```bash
claude plugin marketplace add bytefoo/sagefin-plugin
```

```bash
claude plugin install sagefin@sagefin
```

You are asked for a SageFin token. Create one in SageFin under **Settings → Integrations**:

- Tick **MCP**, **Transactions** and **Categories**. Add **Accounts**, **Budgets** or **Cash
  flow** if you also want to ask Claude about those.
- To let Claude propose changes, give the token write access and turn on the household's
  "Allow MCP write tools" switch on the same screen. Without both, the plugin is read-only.
- Leave bulk changes on **Ask me first** unless you want batches applied without review.

Then ask Claude to "run smart match", or to categorize your uncategorized transactions.

## What leaves SageFin

Whatever the token can read is sent to the AI app you connect, and through it to that app's model
provider. That is your decision to make, per token. A token carries only the permissions you
tick, and you can revoke it in SageFin at any time. The text of your transaction notes is never
returned by any tool. See
[Connecting an AI app](https://sagefin.app/help/ai-app-access) for the full account.

## Layout

```text
.claude-plugin/marketplace.json     the catalog: one plugin
plugins/sagefin/
  .claude-plugin/plugin.json        name, version, and the token it asks for
  .mcp.json                         the SageFin MCP server
  skills/smart-match/SKILL.md       the skill
  tools.json                        the server tools the skills name
scripts/check-skills.mjs            fails when a skill names a tool tools.json does not list
```

## Working on it

```bash
node scripts/check-skills.mjs
```

```bash
npx -y @anthropic-ai/claude-code plugin validate . --strict
```

```bash
npx -y @anthropic-ai/claude-code plugin validate ./plugins/sagefin --strict
```

To try a change without publishing it, load the plugin from disk:

```bash
claude --plugin-dir ./plugins/sagefin
```

A skill is instructions to a model, so a test cannot tell you whether it is right. Run it against
a real backlog and read what it does.

## License

MIT. See [LICENSE](LICENSE).
