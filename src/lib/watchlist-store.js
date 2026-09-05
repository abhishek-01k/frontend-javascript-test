const STATUS_ACTIVE = "active";

function trimId(walletId) {
  return typeof walletId === "string" ? walletId.trim() : "";
}

function walletKey(walletId){
  return trimId(walletId).toLowerCase();
}

function isAmountPositive(value){
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

class WatchlistStore {
  constructor(admin = "admin") {
    this.admin = admin;
    this.balance = 0;
    this.wallets = new Map();
  }

  getBalance(){ 
    return this.balance;
  }

  getWallets() {
    const rows = [];
    for (const wallet of this.wallets.values()){
      rows.push({...wallet});
    }

    return rows;
  }

  allowance(walletId) {
    const wallet = this.wallets.get(walletKey(walletId))
    if(!wallet){
      return null;
    }
    return wallet.allowance;
  }

  addWallet(caller, walletId, allowance = 100, label = "") {

    const id = trimId(walletId);

    if(caller !== this.admin) return {ok: false, message: "Only admin have access for this action"};

    if(!id) return {ok: false, message:"Wallet address must not be empty"};

    if(!isAmountPositive(allowance)) return {ok: false, message:"Allowance must be positve integer."};

    const key = walletKey(id);
    const existing = this.wallets.get(key);
    if(existing) return {ok: false, message:"Address is already on the watchlist"};

    const trimmedLabel = typeof label === "string" ? label.trim() : "";

    const wallet = {
      id,
      allowance,
      label: trimmedLabel || id,
      status: STATUS_ACTIVE
    }

    this.wallets.set(key,wallet);
    return {ok: true, wallet : {...wallet}};
  }

  deposit(amount) {

    if(!isAmountPositive(amount)) return {ok: false, message: "Amount must be greater than zero"}

    this.balance = this.balance + amount;
    return {ok: true, balance: this.balance};
  }

  withdraw(walletId, amount) {

    const id = trimId(walletId);
    if(!id) return {ok: false, message: "Wallet address must not be empty. "};

    if(!isAmountPositive(amount)) return {ok: false, message: "Withdraw amount must be greater than 0."}

    const wallet = this.wallets.get(walletKey(id));
    if(!wallet) return {ok: false, message: "Address not found."}

    if (wallet.status !== STATUS_ACTIVE) {
      return {ok: false, message: "Wallet " + wallet.id + " is archived and cannot withdraw."};
    }

    if(amount > wallet.allowance) 
      return {ok:false, message: "Wallet " + wallet.id + " has " + wallet.allowance + " remaining allowance"};

    if(amount > this.balance) return {ok: false, message: "Treasury balance is low."}

    this.balance = this.balance - amount;
    wallet.allowance = wallet.allowance - amount;
    return {ok: true, balance: this.balance, wallet: {...wallet}};
  }
}

window.WatchlistStore = WatchlistStore;
