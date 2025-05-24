// Already present:
const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// ✅ 1. Create Subscription
exports.createSubscription = async (req, res) => {
  try {
    const { userId, plan, status } = req.body;
    const id = uuidv4();
    const sql = "INSERT INTO subscriptions (id, userId, plan, status) VALUES (?, ?, ?, ?)";
    await db.execute(sql, [id, userId, plan, status]);
    res.status(201).json({ success: true, message: "Subscription created" });
  } catch (error) {
    console.error("❌ Create Subscription Error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// ✅ 2. Get All Subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const [results] = await db.execute("SELECT * FROM subscriptions");
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("❌ Get Subscriptions Error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// 🔍 3. Get Single User's Subscription
exports.getSubscription = async (req, res) => {
  const { userId } = req.params;
  try {
    const [results] = await db.execute("SELECT * FROM subscriptions WHERE userId = ?", [userId]);
    if (!results.length) return res.status(404).json({ error: "Subscription not found" });
    res.status(200).json({ success: true, subscription: results[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to get subscription." });
  }
};

// 🔄 4. Update Subscription
exports.updateSubscription = async (req, res) => {
  const { userId, plan, status } = req.body;
  try {
    await db.execute(
      "UPDATE subscriptions SET plan = ?, status = ? WHERE userId = ?",
      [plan, status, userId]
    );
    res.json({ success: true, message: "Subscription updated." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update subscription." });
  }
};

// 💳 5. Get Payment History
exports.getPaymentHistory = async (req, res) => {
  const { userId } = req.params;
  try {
    const [payments] = await db.execute(
      "SELECT * FROM payments WHERE userId = ? ORDER BY created_at DESC",
      [userId]
    );
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payment history." });
  }
};
