const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// 🎟️ Create Coupon
exports.createCoupon = async (req, res) => {
  const { code, discount } = req.body;
  try {
    const id = uuidv4();
    await db.execute(
      "INSERT INTO coupons (id, code, discount, created_at) VALUES (?, ?, ?, NOW())",
      [id, code, discount]
    );
    res.status(201).json({ success: true, message: "Coupon created" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create coupon." });
  }
};

// 🎟️ Get All Coupons
exports.getCoupons = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM coupons ORDER BY created_at DESC");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch coupons." });
  }
};

// ✅ Apply Coupon
exports.applyCoupon = async (req, res) => {
  const { userId, code } = req.body;
  try {
    const [coupons] = await db.execute("SELECT * FROM coupons WHERE code = ?", [code]);
    if (!coupons.length) return res.status(404).json({ error: "Coupon not found" });

    const coupon = coupons[0];
    const [alreadyUsed] = await db.execute(
      "SELECT * FROM coupon_redemptions WHERE userId = ? AND couponId = ?",
      [userId, coupon.id]
    );
    if (alreadyUsed.length)
      return res.status(400).json({ error: "Coupon already redeemed." });

    await db.execute(
      "INSERT INTO coupon_redemptions (id, userId, couponId, redeemed_at) VALUES (?, ?, ?, NOW())",
      [uuidv4(), userId, coupon.id]
    );

    res.json({ success: true, discount: coupon.discount });
  } catch (err) {
    res.status(500).json({ error: "Failed to apply coupon." });
  }
};
