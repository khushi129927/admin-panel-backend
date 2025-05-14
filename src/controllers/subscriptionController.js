const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// 📌 Create Subscription (Async/Await)
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

// 📤 Get All Subscriptions (Async/Await)
exports.getSubscriptions = async (req, res) => {
  try {
    const [results] = await db.execute("SELECT * FROM subscriptions");
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("❌ Get Subscriptions Error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
