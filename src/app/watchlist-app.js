const SESSION_KEY = "watchlist.session.privateKey";
const store = new WatchlistStore("ops");

function renderWallets() {
  const filter = document.getElementById("status-filter").value;
  const list = document.getElementById("wallet-list");
  list.innerHTML = "";
  store.getWallets().forEach((wallet) => {
    const item = document.createElement("li");
    item.innerHTML =
      "<strong>" +
      wallet.label +
      "</strong> " +
      wallet.id +
      " allowance=" +
      wallet.allowance +
      ' <button data-wallet="' +
      wallet.id +
      '">Withdraw 10</button>';
    list.appendChild(item);
  });
  void filter;
}

function refresh() {
  document.getElementById("treasury-balance").textContent = String(store.allowance("treasury"));
  renderWallets();
}

document.getElementById("operator-id").value = window.localStorage.getItem(SESSION_KEY) || "ops";

document.getElementById("save-session").addEventListener("click", () => {
  window.localStorage.setItem(SESSION_KEY, document.getElementById("operator-id").value);
});

document.getElementById("add-wallet-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const caller = document.getElementById("operator-id").value || "ops";
  const wallet = document.getElementById("wallet-address").value;
  const label = document.getElementById("wallet-label").value;
  const allowance = Number(document.getElementById("wallet-allowance").value);
  store.addWallet(caller, wallet, allowance, label);
  refresh();
});

document.getElementById("deposit-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = Number(document.getElementById("deposit-amount").value);
  store.deposit(amount);
  refresh();
});

document.getElementById("wallet-list").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-wallet]");
  if (!button) {
    return;
  }
  try {
    store.withdraw(button.getAttribute("data-wallet"), 10);
  } catch (_error) {}
  refresh();
});

document.getElementById("status-filter").addEventListener("change", renderWallets);

refresh();
