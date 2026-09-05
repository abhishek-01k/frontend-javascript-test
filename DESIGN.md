# Design note

## The split

Three splits, kept in separate places: drawing the page, holding the data, and fetching the data. The store sits in the middle. The page never touches data directly, it only calls the store so the day the data comes from a server instead of memory, only the store changes.

### UI

`createWalletRow(wallet)` takes a wallet and returns an `<li>`. It never asks the store for anything and never reads the page around it. You give it data, it gives you an element.

`renderWallets` and `renderBalance` decide what to draw, and `showMessage` is the one place any success or error text appears. This will not change even in the future we implement API instead of in-memory. 

One tradeoff I am making on purpose: `renderWallets` empties the list and rebuilds every row on each change. It is the simplest approach that is always correct, and at this size it is the right call.

### Client state

The page keeps three kinds of data, and they belong in different places:

- **The real data** — wallets and the treasury balance — lives in `WatchlistStore`. It never touches the DOM, which is what makes it easy to test and easy to replace later.
- **The view settings** — The status filter which currently live in the dropdown. `renderWallets` asks the dropdown what it is set to every time it runs.
- **The session** — the operator id — lives in `localStorage` but can be moved to the backend in future.

The one change I would make is to keep the filter in a plain object, `{ filter }`, instead of reading it off the dropdown. Then drawing the page is just: here is the data, here are the settings, draw it.

### A later API

The store is the only file that has to change. Everything in `watchlist-app.js` already goes through it, so nothing in the UI reaches past it to touch data.

The methods become `async` and the call sites add `await`. The `{ ok, message }` shape they already return keeps working — a failed request just becomes `{ ok: false, message: "..." }`, which is exactly what the handlers already check for. That is the main reason the swap stays small.

Two calls I would make up front:

**The server has to enforce the rules.** The `caller !== this.admin` check runs in the browser. That is useful for showing the user an error quickly, but it stops nobody — anyone can call the endpoint directly. The server must have authorisation that has to be the one that decides who may add a wallet and does the allowance and balance math. The client keeps its checks only so the user gets an answer without waiting.

**Wait for the server before updating the screen.** The alternative is to update immediately and undo it if the request fails, which feels faster but means writing undo logic for every action. This is money moving, so I would rather show a slower number than a wrong one. Withdraw should also send an id the client generates, so that retrying a request that timed out cannot take the money twice.