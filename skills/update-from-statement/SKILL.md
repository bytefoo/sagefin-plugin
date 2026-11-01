---
name: update-from-statement
description: Update a manual SageFin account from a statement the user gives you, usually a PDF from a bank, brokerage, lender or card issuer that SageFin cannot connect to. Records the statement's balance or amount owed, and for an investment account replaces its positions with the ones the statement lists and records its activity. Use when the user hands you a statement and asks to update, record or bring SageFin up to date with it.
---

# Update an account from a statement

Some accounts cannot be connected to SageFin. The user keeps one current by handing you its
statement each month or quarter. You read it and record what it says, through the `sagefin` MCP
server's tools, named below without their prefix.

What you record is the institution's figures, read off the page. You are a careful transcriber,
not an analyst: if the statement does not say it, do not record it.

## What you must not do

- **Do not record an account number, or any part of one.** Not in an account's name, not in an
  activity description. SageFin does not need it.
- **Do not guess a figure.** A position with no value printed gets no value, not one you worked out
  from a price you remember. A cost basis the statement does not show is left out.
- **Do not update a connected account.** The tools refuse it. If the statement belongs to an account
  that `get_account_balances` lists with `manual: false`, tell the user it is already kept up to date
  and stop.
- **Do not create an account without asking.** A second copy of an account is worse than a missing
  update.
- **Do not say anything was recorded unless the tool's result says `applied: true`.**

## 1. Read the statement

Find, and show the user before writing anything:

- The **statement period** and its **closing date**. That date is the one every figure is as of.
- The **ending balance**: the total account value on the closing date, cash included. For a loan,
  a mortgage or a credit card, the **balance owed** on that date (the principal balance or new
  balance the statement prints), not the payment due.
- For an investment account only, the **positions**: for each, the ticker if there is one, the name, the shares or units, the price
  and the market value, and the cost basis only if it is printed. Cash, sweep and money-market
  balances are positions too.
- For an investment account only, the **activity** in the period: each line's date, what kind it is, the amount, and the ticker,
  shares and price where there are any.

Add the positions' values up. If they do not come to the ending balance, look again before going on:
the usual cause is a cash line you missed. If the statement covers several accounts, handle each one
separately.

## 2. Find the account

Call `list_manual_accounts`. Match the statement to an account by its `institution`, name and
`accountType`, and confirm the match with the user if more than one could be it. `liability: true`
marks a debt. An account with `transferred: true` has had its history moved to another account:
record nothing on it.

Compare the statement's closing date with the account's `latestBalanceOn` and `positionsAsOf`. If the
statement is older, say so: its balance will fill in history, but its positions would replace newer
ones and the tool will refuse them.

If there is no matching account, ask the user whether to create one. If they agree, call
`create_manual_account` with a `name` they choose (the kind of account is a good default, never a
number), the `accountType` the statement is for, a `subtype` where it narrows it, and the
statement's institution as `institution`, by the name the statement prints:

- A brokerage or retirement account: `accountType` `investments`, with a `subtype` such as
  "Brokerage (Taxable)", "Individual Retirement Account (IRA)", "Roth IRA" or "401k".
- A checking, savings or CD statement: `cash`, with "Checking", "Savings" or "CD".
- A mortgage statement: `mortgage`, with no subtype.
- An auto, student or personal loan, or a line of credit: `loans`, with "Auto", "Student",
  "Consumer" or "Line of Credit".
- A credit card statement: `credit_card`, with no subtype.

Never leave `accountType` out or guess it: if the statement does not make the kind plain, ask. The
tool refuses a value it does not know and lists the ones it takes. If
the tool says several institutions match, show the user the ones it lists with their websites, ask
which, and call it again with that one's `institutionId` as `institution`. If none matches, pass the
institution's website as `website` instead.

An existing manual account with no `institution` can be given one with
`set_manual_account_institution`, the same way. Ask the user first.

## 3. Rehearse, and show the user

Call each write below with `dryRun: true` first, and show the user what would change: the balance
before and after, each position's action (`added`, `updated`, `unchanged`, `no_longer_held`), and how
many activity lines are new. Ask them to confirm. A dry run is not their approval.

## 4. Record it

In this order, with the same `accountId` and the statement's closing date as `asOfDate`:

1. `record_account_balance` with the ending balance as `balance`. For a loan, a mortgage or a credit
   card, that is the amount owed as a **positive** number, even where the statement prints it with a
   minus sign; the tool refuses a negative one. That is the whole update for one of those, and for a
   cash account: skip the next two steps, which are for investment accounts only and refuse any
   other kind.
2. `set_manual_holdings` with every position in `positions`, and the ending balance as
   `statementBalance`, so the positions are checked against it on the dry run too, before any
   balance is recorded. Each position is `symbol` (omit when there is none), `name`, `quantity`,
   and `price` and `value` as printed. For cash, use the name the
   statement uses, the cash amount as `quantity` and a `price` of 1. Add `costBasis` only where the
   statement prints one.
3. `add_investment_activity` with every activity line in `activity`. Each is `date`, `kind`, `amount`
   as a positive number as printed, and `symbol` (or `name`, when the line has no ticker),
   `quantity` and `price` where the line has them.
   `kind` is one of `buy`, `sell`, `dividend`, `interest`, `fee`, `deposit`, `withdrawal`,
   `transfer_in`, `transfer_out`. A reinvested dividend is two lines: a `dividend` and a `buy`.

Read each result:

- `record_account_balance`: `changed: false` means SageFin already had this balance. If
  `laterSnapshotOn` is set, the account already has a newer balance, so its current balance was left
  alone.
- `set_manual_holdings`: report any `warnings` to the user word for word in substance. They do not
  stop the update, but the user should know the positions do not add up, or that a position has no
  value. `no_longer_held` positions were on the account but not on this statement; they are kept,
  out of the totals, and come back if a later statement lists them.
- `add_investment_activity`: `alreadyRecorded` counts lines SageFin had from an earlier or
  overlapping statement. That is expected, not an error.

Running the same statement again is safe and changes nothing, so if a call fails partway, fix the
cause and run the whole update again.

If a tool says write access is off, tell the user what it said. It names the setting.

SageFin keeps a credit card's minimum payment and due date, which its bill-due alert reads, but none
of these tools records them. If a credit card statement prints them, tell the user they can be saved
with **Update from statement** on the account in SageFin, which reads the same PDF itself.

## 5. Report

End with a short account:

- Which account, and the statement's closing date.
- The balance recorded, and whether it is now the account's current balance.
- Positions added, updated and no longer held, and any warning.
- Activity lines recorded, and how many were already there.
- Anything on the statement you did not record, and why.
