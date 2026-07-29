const express = require("express");
const cors    = require("cors");
const crypto  = require("crypto");

const app  = express();
const PORT = process.env.PORT || 3000;

// In-memory order store — replace with a real DB in production
const orders = new Map();

app.use(cors());
app.use(express.json());

// Create a new payment order
app.post("/orders", (req, res) => {
  const { amount } = req.body;
  if (!amount) return res.status(400).json({ error: "amount required" });

  const orderId = crypto.randomUUID();
  orders.set(orderId, {
    orderId,
    amount,
    status: "pending",
    createdAt: new Date().toISOString(),
    txHash: null,
  });

  res.json({ orderId });
});

// Get order status
app.get("/orders/:id", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: "order not found" });
  res.json(order);
});

// Webhook: called by your on-chain monitor / BSCScan webhook when tx confirmed
// POST body: { txHash, orderId, from, amount }
app.post("/webhook/confirmed", (req, res) => {
  const { txHash, orderId, from, amount } = req.body;
  const order = orders.get(orderId);

  if (!order) return res.status(404).json({ error: "order not found" });
  if (order.status === "confirmed") return res.json({ ok: true, already: true });

  // Basic sanity check — validate amount matches expected
  if (parseFloat(amount) < parseFloat(order.amount)) {
    return res.status(400).json({ error: "underpayment" });
  }

  order.status = "confirmed";
  order.txHash = txHash;
  order.paidBy  = from;
  order.confirmedAt = new Date().toISOString();

  console.log(`[confirmed] order=${orderId} tx=${txHash}`);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
