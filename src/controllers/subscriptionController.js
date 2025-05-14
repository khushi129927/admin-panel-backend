const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// ✅ Create Subscription
exports.createSubscription = async (req, res) => {
  try {
    const { userId, plan, status } = req.body;
    const id = uuidv4();

    const sql = "INSERT INTO subscriptions (id, userId, plan, status) VALUES (?, ?, ?, ?)";
    await db.query(sql, [id, userId, plan, status]);

    res.status(201).json({ success: true, message: "Subscription created" });
  } catch (error) {
    console.error("❌ Create Subscription Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Get All Subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM subscriptions");
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("❌ Get Subscriptions Error:", error.message);
    res.status(500).json({ error: "Failed to get subscriptions." });
  }
};
