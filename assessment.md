# Wallet Watchlist take-home

**Time:** about 2-3 hours.

Checkout this branch, then work from the files in the repo.

## Product

A small treasury watchlist dashboard:

- An admin maintains wallets on a watchlist, each with a remaining allowance and a status (`active` or `archived`)
- Anyone can deposit into the shared treasury balance
- Only a watchlisted wallet can withdraw, and only up to remaining allowance
- The page lists wallets, can filter by status, and shows empty or error states clearly

The store is in-memory. A live API is not required.

## What to do

1. **Review** - Read `src/lib/watchlist-store.js` and `src/app/watchlist-app.js`. In `REVIEW.md`, list the problems you find (bugs, UI state, structure). Be concrete: file, behavior, why it matters.
2. **Fix** - Change the JavaScript (and HTML/CSS if needed) to match the product rules below. Keep it small. You do not need React, Next.js, or a backend.
3. **Design** - In `DESIGN.md`, write a short note (about half a page): how you would split UI, client state, and a later API if this stayed maintainable. Tradeoffs are enough. No extra features.

## Rules to honor in the fix

**Store**
- Wallet ids must be non-empty
- Amounts must be greater than 0
- Adding a wallet is admin-only
- Deposit credits the shared treasury balance
- Withdraw fails if the wallet is missing or the amount is above remaining allowance
- A successful withdraw lowers both the treasury balance and that wallet's remaining allowance
- Missing wallets should not look the same as a wallet with allowance `0`
- Failures should be explicit results/errors, not crashes or silent success

**UI**
- Status filter must actually filter the list
- Do not render wallet fields as raw HTML
- Show empty and error states
- Treasury balance on the page must come from the treasury balance, not from an allowance lookup
- Handle failed withdraw/add/deposit instead of ignoring the response
- Do not store private keys or seed material
- Withdraw amount should be chosen by the user, not a hard-coded tap of `10`

## Submit

Your branch or zip, including `REVIEW.md`, `DESIGN.md`, and the updated code.
