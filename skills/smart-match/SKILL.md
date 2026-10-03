---
name: smart-match
description: Categorize a SageFin household's uncategorized and needs-review transactions using what the user knows and you can see, send the result as one batch for them to review, and suggest rules for merchants that repeat. Use when the user asks to categorize, clean up, tidy, sort out or review their SageFin transactions, or to "run smart match".
---

# Smart match

SageFin already categorizes every transaction when it arrives, from four things: the bank's
description, the merchant, the amount and the date. What it cannot see is everything the user
knows. Which Amazon orders were for the rental. That a vendor became the new company's in March.
The folder of receipts on this computer.

You can. That is the whole reason this skill exists: bring the user's context to the transactions
SageFin could not place, and hand back a batch they can check in one sitting.

You work through the `sagefin` MCP server's tools, named below without their prefix.

## What you must not do

- **Do not say a transaction was recategorized unless the tool said `applied`.** A batch usually
  comes back `proposed`, which means nothing has changed and the user has to accept it in SageFin.
- **Do not invent a category.** The only categories are the ones `list_categories` returns.
- **Do not loop `set_transaction_category`.** More than a handful of changes is one call to
  `propose_category_changes`.
- **Do not change a category a person chose.** The tools refuse it in a batch. Leave those alone
  unless the user asks about one by name.
- **Do not guess to get the count down.** A transaction you left out with a reason is a better
  result than one filed wrongly. Wrong categories are harder to find than missing ones.

## 1. Find out what there is

Call `list_categories` first. Read the groups and the categories under them. A transaction takes
a category, never a group. Skip any category marked `disabled`. "Uncategorized" is not in the
list because it is not a category.

Then build the queue with `list_transactions`:

- `uncategorized: true` for transactions with no category.
- `needsReview: true` for ones SageFin flagged for a person.
- Add `from` and `to` if the user named a period.

Read `totalMatching`. If `nextCursor` is not null there are more pages: pass it back as `cursor`
until it is null. Do not reason from the first page as though it were everything.

Tell the user the size of the job before starting: how many transactions, over what dates. If it
is more than a few hundred, offer to start with the most recent three months.

## 2. Ask before you reason

Ask the user what they know that the transactions do not say. Keep it to the questions the queue
raises. Good ones:

- A merchant that appears many times and could go more than one way ("Amazon: household, or is
  some of it for a business or a rental?").
- A person or company you cannot identify.
- Whether there are receipts, invoices or a spreadsheet on this computer you may read.

If they point you at files, read them. A receipt that names what was bought settles a category
better than any amount of inference.

Ask once, in one message. Then work.

## 3. Decide

Group the queue by merchant, falling back to the bank's description where there is no merchant.
Decide a merchant's transactions together: they almost always belong together, and the user
reviews them grouped the same way.

For each group pick a category from `list_categories`, and write a reason of a few words the user
will read when reviewing: "A grocery store", "Per your invoice 0412", "You said these are for the
rental".

Use `direction`, not the sign of `amount`. `out` is money spent, `in` is money received. A refund
belongs in the category the purchase was in, not in an income category.

A transaction with `splits` already has its categories on its lines. Leave it out.

Use `get_transaction` when a row is not enough, for instance to see whether a person or SageFin
chose the current category. A `categorySource` of `manual` is a person's choice.

When you do not know, leave the transaction out and keep a list of what you skipped and why.

## 4. Send one batch

Call `propose_category_changes` once, with every change and a `summary` that says what the batch
is in the user's words: "Categorize September's uncategorized grocery and dining charges".

It takes at most 500 changes. For more, send several batches by period and tell the user how many
there are.

Read the result:

- `status: "proposed"`: nothing has changed. Tell the user the batch is waiting on the
  **Transactions** page in SageFin, where they can untick what they disagree with and accept the
  rest.
- `status: "applied"`: the user set this token to apply changes immediately. Tell them the
  changes were made and that the whole batch can be taken back from the same page for 30 days.
- `refused`: changes the tool left out, each with a reason. Report them. Do not retry them.

If the tool says write access is off, tell the user what it said. It names the setting.

## 5. Suggest rules for what repeats

A batch fixes the transactions there are. A rule fixes the ones that arrive next month. If one
merchant accounted for several changes in the batch, a rule is the better outcome.

Call `list_rules` first so you do not suggest one that exists. Then, for each merchant worth a
rule, call `propose_transaction_rule` with the text to match, the category, and a `reason`.

This never creates a rule. It leaves a suggestion in SageFin under **Settings → Rules**, which
the user opens, changes if they want, and saves. Say that. Do not say you created a rule.

`matchCount` in the result is how many existing transactions the text matches. Zero means the
text is wrong: check the merchant's spelling against `list_transactions` before suggesting it.

Suggest a few good rules, not one per merchant. A rule for a merchant seen once is noise.

## 6. Report

End with a short account:

- How many transactions were in the queue, how many are in the batch, and whether it is waiting
  or applied.
- What you left out and why, grouped: "12 Venmo payments I could not identify".
- The rules you suggested, and where to find them.
- Anything you asked that the user did not answer, which would let you finish.

To report what the user decided later, call `get_change_set` with the batch's id, or
`get_rule_proposal` with a suggestion's id. Do not call either repeatedly to wait.
