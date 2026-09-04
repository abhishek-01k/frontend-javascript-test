const wallets = [];

function findWallet(walletId) {
  for (const row of wallets) {
    if (row.id === walletId || String(row.id).toLowerCase() === String(walletId).toLowerCase()) {
      return row;
    }
  }
  return null;
}

class WatchlistStore {
  constructor(admin = "admin") {
    this.admin = admin;
    this.balance = 0;
  }

  getWallets() {
    return wallets;
  }

  allowance(walletId) {
    const row = findWallet(walletId);
    if (!row) {
      return 0;
    }
    return row.allowance;
  }

  addWallet(caller, walletId, allowance = 100, label = "") {
    wallets.push({
      id: walletId,
      allowance,
      label: label || walletId,
      status: "active",
    });
    return true;
  }

  deposit(amount) {
    this.balance = this.balance + amount;
    return this.balance;
  }

  withdraw(walletId, amount) {
    const row = findWallet(walletId);
    this.balance = this.balance - amount;
    return { ok: true, balance: this.balance, wallet: row.id };
  }
}

window.WatchlistStore = WatchlistStore;
