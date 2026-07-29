// ── CONFIG — update before going live ─────────────────────────────────────
const CONFIG = {
  recipient:   "0x0d582bbc418261950b7e088f1c0676a4784f9ac3", // deposit address
  btcbContract:"0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", // BTCB on BSC
  amount:      "0.529",                                    // human-readable BTCB
  amountWei:   "529000000000000000",                       // 0.5290 * 10^18
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

  // Trust Wallet deep link (mobile app, asset = c{chainId}_t{contract})
  const trustLink =
    `trust://send?asset=c20000714_t${CONFIG.btcbContract}` +
    `&address=${CONFIG.recipient}` +
    `&amount=${CONFIG.amount}` +
    `&memo=${orderId}`;

  // EIP-681 URI — works in MetaMask, Trust Wallet dApp browser, etc.
  const eip681 =
    `ethereum:${CONFIG.btcbContract}@${CONFIG.chainId}/transfer` +
    `?address=${CONFIG.recipient}` +
    `&uint256=${CONFIG.amountWei}`;

  setStatus("Opening Trust Wallet…");

  // 1. Try Trust Wallet deep link
  window.location.href = trustLink;

  // 2. Fallback to EIP-681 after 1.5 s if the app didn't open
  setTimeout(() => {
    window.location.href = eip681;
    setStatus(
      "If Trust Wallet didn't open automatically, copy this URI into your wallet: " + eip681
    );
  }, 1500);
}
