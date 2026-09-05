const OPERATOR_KEY = "watchlist.operatorId";
const store = new WatchlistStore("ops");

const elements = {
  message: document.getElementById("app-message"),
  operatorId: document.getElementById("operator-id"),
  saveSession: document.getElementById("save-session"),
  addWalletForm: document.getElementById("add-wallet-form"),
  walletAddress: document.getElementById("wallet-address"),
  walletLabel: document.getElementById("wallet-label"),
  walletAllowance: document.getElementById("wallet-allowance"),
  depositForm: document.getElementById("deposit-form"),
  depositAmount: document.getElementById("deposit-amount"),
  treasuryBalance: document.getElementById("treasury-balance"),
  statusFilter: document.getElementById("status-filter"),
  walletList: document.getElementById("wallet-list"),
  walletEmpty: document.getElementById("wallet-empty"),
}

function showMessage(text,tone) {
  elements.message.textContent = text;
  elements.message.classList.toggle("message-error", tone === "error");
  elements.message.classList.toggle("message-success", tone === "success");
  elements.message.hidden = false;
}

function clearMessage(){
  elements.message.textContent = "";
  elements.message.hidden = true;
}

function createWalletRow(wallet){

  const item = document.createElement("li");

  const label = document.createElement("strong");
  label.textContent = wallet.label;

  const address = document.createElement("span");
  address.textContent = wallet.id;
  address.className = "wallet-address";

  const allowance = document.createElement("span");
  allowance.textContent = "allowance " + wallet.allowance;
  allowance.className = "wallet-allowance";

  const status = document.createElement("span");
  status.textContent = wallet.status;
  status.className = "wallet-status";

  const amount = document.createElement("input");
  amount.type = "number";
  amount.min = '0';
  amount.step = "any";
  amount.className = "withdraw-amount";
  amount.setAttribute("aria-label", "Withdraw amount for " + wallet.label);

  const button = document.createElement("button");
  button.textContent = "Withdraw";
  button.type = "button";
  button.setAttribute("data-wallet", wallet.id);

  item.append(label,address,allowance,status,amount,button);
  return item;
}

function renderWallets(){
  const filter = elements.statusFilter.value;
  const wallets = store.getWallets();
  const visible = filter === "all" ? wallets : wallets.filter((wallet)=>wallet.status === filter);

  elements.walletList.textContent = "";
  visible.forEach(wallet=>{
    elements.walletList.appendChild(createWalletRow(wallet))
  })

  if(visible.length > 0){
    elements.walletEmpty.textContent = "";
    elements.walletEmpty.hidden = true;
    return
  }

  elements.walletEmpty.textContent = wallets.length === 0 ? "No wallets on the watchlist." : "No " + filter + " wallets on watchlist";
  elements.walletEmpty.hidden = false;
}

function renderBalance(){
  elements.treasuryBalance.textContent = String(store.getBalance());
}

function refresh(){
  renderBalance();
  renderWallets();
}

elements.operatorId.value = window.localStorage.getItem(OPERATOR_KEY) || "ops";

elements.saveSession.addEventListener("click", ()=>{

  const operator = elements.operatorId.value.trim();
  if (!operator) {
    showMessage("Operator session must not be empty.", "error");
    return;
  }

  window.localStorage.setItem(OPERATOR_KEY,operator);
  showMessage("Session saved as " + operator + ".", "success");
})

elements.addWalletForm.addEventListener("submit" , (event)=>{

  event.preventDefault();
  clearMessage();

  const caller = elements.operatorId.value.trim();
  const address = elements.walletAddress.value.trim();
  const label = elements.walletLabel.value.trim();
  const allowance = Number(elements.walletAllowance.value);

  const result = store.addWallet(caller,address,allowance,label);

  if(result.ok){
    showMessage("Address added successfully.", "success");
    elements.addWalletForm.reset();
  }else{
    showMessage(result.message, "error");
  }

  refresh();

})

elements.depositForm.addEventListener("submit",(event)=>{

  event.preventDefault();
  clearMessage();

  const amount = Number(elements.depositAmount.value);
  const result = store.deposit(amount);
  if(result.ok){
    showMessage("Deposited " + amount + " into the treasury.", "success");
    elements.depositForm.reset();
  }else{
    showMessage(result.message, "error");
  }
  
  refresh();

})

elements.walletList.addEventListener("click", (event)=>{

  const button = event.target.closest("button[data-wallet]");
  if(!button){
    return;
  }

  clearMessage();

  const walletId = button.getAttribute("data-wallet");
  const amountInput = button.closest("li").querySelector(".withdraw-amount");
  const amount = Number(amountInput.value);

  const result = store.withdraw(walletId,amount);
  if(result.ok){
    showMessage(walletId + " withdrew " + amount + " from the treasury.", "success");
  } else{
    showMessage(result.message, "error");
  }

  refresh();

})

elements.statusFilter.addEventListener("change", renderWallets);

refresh();