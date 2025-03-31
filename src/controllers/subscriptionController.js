const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.createSubscription = (req, res) => {
  const { userId, plan, status } = req.body;
  const id = uuidv4();

  const sql = "INSERT INTO subscriptions (id, userId, plan, status) VALUES (?, ?, ?, ?)";
  db.query(sql, [id, userId, plan, status], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ success: true, message: "Subscription created" });
  });
};

exports.getSubscriptions = (req, res) => {
  const sql = "SELECT * FROM subscriptions";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ success: true, data: results });
  });
};
