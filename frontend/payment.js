// ── CONFIG — update before going live ─────────────────────────────────────
const CONFIG = {
  recipient:   "0x2668c14Cb59a7b23519ad8b62393ddb705F373e6", // deposit address
  btcbContract:"0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", // BTCB on BSC
  amount:      "0.529",                                    // human-readable BTCB
  amountWei:   "529000000000000000",                       // 0.529 * 10^18
  chainId:     "56",                                       // BSC mainnet
  backendUrl:  "http://localhost:3000",                    // backend base URL
};
// ──────────────────────────────────────────────────────────────────────────

function setStatus(msg, isError = false) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = "status" + (isError ? " error" : "");
  el.classList.remove("hidden");
}

async function triggerPayment() {
  if (CONFIG.recipient === "0xYOUR_BSC_WALLET_ADDRESS_HERE") {
    setStatus("Recipient address not configured — contact support.", true);
    return;
  }

  // Ask the backend for a unique order ID (optional but recommended)
  let orderId = "local-" + Date.now();
  try {
    const res = await fetch(`${CONFIG.backendUrl}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: CONFIG.amount }),
    });
    if (res.ok) {
      const data = await res.json();
      orderId = data.orderId;
    }
  } catch {
    // backend unreachable — continue without order ID
  }

  // Trust Wallet deep link — opens directly on BSC with BTCB pre-filled
  const trustLink =
    `trust://send?asset=c20000714_t${CONFIG.btcbContract}` +
    `&address=${CONFIG.recipient}` +
    `&amount=${CONFIG.amount}` +
    `&memo=${orderId}`;

  setStatus("Opening Trust Wallet…");
  window.location.href = trustLink;

  // If Trust Wallet isn't installed, show manual instructions after 2 s
  // (no secondary redirect — that caused ETH network switching)
  setTimeout(() => {
    setStatus(
      `Trust Wallet not opening? Send ${CONFIG.amount} BTCB (BEP20) to: ${CONFIG.recipient}`
    );
  }, 2000);
}
