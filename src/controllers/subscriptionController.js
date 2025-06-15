// Add at the top with other imports
const Razorpay = require("razorpay");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// ✅ 1. Create Razorpay Subscription
// ✅ 1. Create Razorpay Subscription with Customer Creation
exports.createSubscription = async (req, res) => {
  try {
    const { userId, plan_id, customer_email } = req.body;

    // 🔹 Step 1: Create Razorpay Customer
    const customer = await razorpay.customers.create({
      email: customer_email
    });

    // 🔹 Step 2: Create Subscription using customer_id
    const subscription = await razorpay.subscriptions.create({
      plan_id,
      customer_notify: 1,
      total_count: 12,
      customer_id: customer.id
    });

    // 🔹 Step 3: Save in your database
    const subscriptionId = uuidv4();
    const sql = "INSERT INTO subscriptions (subscriptionId, userId, plan, status, razorpay_subscription_id) VALUES (?, ?, ?, ?, ?)";
    await db.execute(sql, [
      subscriptionId,
      userId,
      plan_id,
      "created",
      subscription.id,
    ]);

    res.status(201).json({ success: true, subscription });
  } catch (error) {
    console.error("❌ Razorpay Create Subscription Error:", error.message);
    res.status(500).json({ details: error.message, error: "Failed to create subscription" });
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

// ✅ 6. Verify Subscription Payment
// ✅ 6. Verify Subscription Payment
exports.verifySubscriptionPayment = async (req, res) => {
  const crypto = require("crypto");
  const db = require("../config/db");
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, userId, amount } = req.body;

  try {
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_payment_id + "|" + razorpay_subscription_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Insert into payments table
    const sql = `
      INSERT INTO payments (paymentId, userId, amount, razorpay_payment_id, razorpay_subscription_id, razorpay_signature, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const paymentId = razorpay_payment_id; // or uuid if you prefer
    await db.execute(sql, [
      paymentId,
      userId,
      amount,
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      "paid"
    ]);

    return res.status(200).json({ success: true, message: "Payment verified and stored" });
  } catch (err) {
    console.error("❌ Payment verification error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
