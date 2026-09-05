# Review

## FILE NAME = `src/lib/watchlist-store.js`

### 1. Wallet storage is module-level, not instance state

```js
const wallets = [];
```

`wallets` lives at module scope, outside the class. Every `WatchlistStore` instance reads and writes the same array.

**Why it matters:** state that looks instance-scoped but is global is a silent correctness trap. `this.balance` is per-instance while the wallets backing it are not, so two stores share wallets but disagree about the treasury.

### 2. Wallet id matching disagrees between lookup and insert

```js
if (row.id === walletId || String(row.id).toLowerCase() === String(walletId).toLowerCase())
```

`findWallet` is right: `0xABC` and `0xabc` are the same Ethereum account, so a case-insensitive compare is correct. Only the left operand of the `||` is redundant — the right side already covers it.

`addWallet` disagrees. Line 31 pushes the id as typed with no duplicate check, so insertion is effectively case-sensitive while lookup is not.

**Why it matters:** both casings can be added as separate rows. Every lookup resolves to the first, so the second can never be withdrawn from, but it still renders, inflating the allowance the page appears to hold.

### 3. `allowance()` returns `0` for a wallet that does not exist

```js
if (!row) {
  return 0;
}
```

A missing wallet and a wallet with allowance `0` produce an identical return value. The caller cannot tell them apart.

**Why it matters:** the UI cannot distinguish "not on the watchlist" from "on the watchlist, nothing left to spend" — two states that call for different messages and different actions. It also lets a typo'd address render as a legitimate zero-allowance wallet.

### 4. `addWallet` performs no validation at all

```js
addWallet(caller, walletId, allowance = 100, label = "") {
  wallets.push({ id: walletId, allowance, label: label || walletId, status: "active" });
  return true;
}
```

Four separate problems in six lines:

1. `caller` is declared but unused. `this.admin` is set in the constructor and never read anywhere in the file, so the admin-only rule is unenforced.
2. No check that `walletId` is a non-empty string. `""`, `null`, and numbers are all accepted as ids.
3. No check that `allowance` is a number greater than 0. Zero, negatives, and strings like `"50"` all get stored.
4. No check for duplicate wallet ids, which is what creates the case-sensitivity split described in finding 2.

**Why it matters:** anyone can add a wallet, and the watchlist can hold entries that no later code can handle safely. The bare `return true` compounds it — the return value is the same whether the call succeeded or was nonsense, so the UI has no way to tell the user what went wrong.

### 5. `withdraw` implements none of the withdraw rules — lines 45-49

```js
withdraw(walletId, amount) {
  const row = findWallet(walletId);
  this.balance = this.balance - amount;
  return { ok: true, balance: this.balance, wallet: row.id };
}
```

`ok: true` is hard-coded, so there is no failure path. Five problems in three lines:

1. No null check on `row`. An unknown wallet throws on line 48, after line 47 has already debited the treasury: balance 100 → 75.
2. No check of `amount` against `row.allowance`. A wallet allowed 50 can withdraw 999.
3. No decrement of `row.allowance`. The same wallet can withdraw its full allowance repeatedly.
4. No check that `amount` is greater than 0. `withdraw(id, -100)` raises the balance and returns `ok: true`.
5. No check of `amount` against `this.balance`. Withdrawing 500 from 10 returns `balance: -490`.

**Why it matters:** a crash and a state-corruption bug in the same three lines, and the UI's empty `catch` hides it — the user sees only an unexplained drop in balance. Points 2 and 3 make allowance decorative: unenforced, and unchanged even if it were.

### 6. `getWallets()` returns the live internal array

```js
return wallets;
```

The caller receives a reference to the store's own array, not a copy.

**Why it matters:** any consumer can `push`, `splice`, or mutate a wallet's allowance directly, bypassing every validation rule the store is supposed to enforce. The store has no real boundary.

### 7. `status` is hardcoded and nothing can change it

```js
status: "active",
```

`addWallet` always writes `"active"`, and no method exists to change a wallet's status afterwards.

**Why it matters:** `archived` is unreachable, so half of the status feature is dead. The status filter in the UI has an option that can never match anything.



## FILE NAME = `src/app/watchlist-app.js`

### 8. Wallet fields are interpolated into an HTML string — lines 10-19

```js
item.innerHTML =
  "<strong>" + wallet.label + "</strong> " + wallet.id +
  " allowance=" + wallet.allowance +
  ' <button data-wallet="' + wallet.id + '">Withdraw 10</button>';
```

`label` and `id` come straight from text inputs and are concatenated into markup with no escaping. That gives two separate injection points:

1. Element content. A label of `<img src=x onerror="...">` executes on every render.
2. An attribute. An id containing `"` closes `data-wallet` early, so `x" onclick="..."` attaches a handler to the button.

**Why it matters:** stored XSS — the payload is persisted in the store and re-runs for everyone who loads the page, not just whoever typed it. Nothing upstream stops it: `addWallet` validates nothing (store finding 4), so any string is accepted as an id or label.

### 9. The treasury balance is read from an allowance lookup

```js
document.getElementById("treasury-balance").textContent = String(store.allowance("treasury"));
```

This asks for the allowance of a wallet with id `"treasury"`, which is never added.

**Why it matters:** the displayed balance is always `0` and never responds to
deposits or withdrawals. 

### 10. `localStorage` key is named for a private key

```js
const SESSION_KEY = "watchlist.session.privateKey";
```
The value actually stored is the operator id from a plain text input, not key material. The key name is inaccurate.

### 11. The result of `addWallet` is ignored 

```js
store.addWallet(caller, wallet, allowance, label);
refresh();
```

**Why it matters:** what happens if the addWallet returns any error. The form clears and the page re-renders the user might believe a wallet was added.

### 12. The result of `deposit` is ignored

Same as above issue

### 13. The withdraw amount is hardcoded

```js
store.withdraw(button.getAttribute("data-wallet"), 10);
```

The user has no way to choose how much to withdraw.

**Why it matters:** explicitly against the product rules. A fixed tap of `10` is
not a usable withdraw feature.

### 14. Errors are not handled properly

```js
try {
  store.withdraw(...);
} catch (_error) {}
```

**Why it matters:**  The withdraw throws, the treasury has already been debited, and the user sees no error.


### 15. There is no empty state and no error state

Nothing is rendered when the wallet list is empty, and there is no element
anywhere for reporting a failure.


### 16. Number inputs are converted with no guard

```js
const allowance = Number(document.getElementById("wallet-allowance").value);
```

An empty input becomes `0` and non-numeric text becomes `NaN`, both passed straight to the store.

### 17. Structure: DOM lookups are repeated and untracked

`document.getElementById` is called inline at every use site, roughly fifteen
times, including twice for the same element inside one handler. 