// subscriptionController.js
const Razorpay = require("razorpay");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Create Subscription Per Child
exports.createSubscription = async (req, res) => {
  try {
    const { childId, plan_id, customer_email } = req.body;

    const customer = await razorpay.customers.create({ email: customer_email });

    const subscription = await razorpay.subscriptions.create({
      plan_id,
      customer_notify: 1,
      total_count: 12,
      customer_id: customer.id,
    });

    const subscriptionId = uuidv4();
    const sql = `INSERT INTO subscriptions (subscriptionId, childId, plan, status, razorpay_subscription_id)
                 VALUES (?, ?, ?, ?, ?)`;
    await db.execute(sql, [
      subscriptionId,
      childId,
      plan_id,
      "created",
      subscription.id,
    ]);

    res.status(201).json({ success: true, subscription });
  } catch (error) {
    console.error("Create Subscription Error:", error.message);
    res.status(500).json({ error: "Failed to create subscription", details: error.message });
  }
};

// 2. Get All Subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const [results] = await db.execute("SELECT * FROM subscriptions");
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// 3. Get Subscription by Child
exports.getSubscription = async (req, res) => {
  const { childId } = req.params;
  try {
    const [results] = await db.execute("SELECT * FROM subscriptions WHERE childId = ?", [childId]);
    if (!results.length) return res.status(404).json({ error: "Subscription not found" });
    res.status(200).json({ success: true, subscription: results[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to get subscription." });
  }
};

// 4. Update Subscription
exports.updateSubscription = async (req, res) => {
  const { childId, plan, status } = req.body;
  try {
    await db.execute(
      "UPDATE subscriptions SET plan = ?, status = ? WHERE childId = ?",
      [plan, status, childId]
    );
    res.json({ success: true, message: "Subscription updated." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update subscription." });
  }
};

// 5. Payment History per Child
exports.getPaymentHistory = async (req, res) => {
  const { childId } = req.params;
  try {
    const [payments] = await db.execute(
      "SELECT * FROM payments WHERE childId = ? ORDER BY created_at DESC",
      [childId]
    );
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payment history." });
  }
};

// 6. Verify Subscription Payment
exports.verifySubscriptionPayment = async (req, res) => {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, childId, amount } = req.body;
  try {
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_payment_id + "|" + razorpay_subscription_id)
      .digest("hex");

    const verified = generated_signature === razorpay_signature;

    if (!verified) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const sql = `INSERT INTO payments (paymentId, childId, amount, razorpay_payment_id, razorpay_subscription_id, razorpay_signature, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await db.execute(sql, [
      razorpay_payment_id,
      childId,
      amount,
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      "paid",
    ]);

    return res.status(200).json({ success: true, message: "Payment verified and stored" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.handleWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  const event = req.body.event;
  const payload = req.body.payload;

  try {
    switch (event) {
      case "subscription.charged": {
        const payment = payload.payment.entity;
        const subscription_id = payment.subscription_id;

        const [sub] = await db.execute(
          "SELECT childId FROM subscriptions WHERE razorpay_subscription_id = ?",
          [subscription_id]
        );

        if (!sub.length) break;

        const { childId } = sub[0];
        const paymentId = payment.id;
        const amount = payment.amount / 100;

        await db.execute(
          `INSERT INTO payments (paymentId, childId, amount, razorpay_payment_id, razorpay_subscription_id, status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [paymentId, childId, amount, paymentId, subscription_id, "paid"]
        );
        break;
      }

      case "payment.failed": {
        const payment = payload.payment.entity;
        const subscription_id = payment.subscription_id;

        const [sub] = await db.execute(
          "SELECT childId FROM subscriptions WHERE razorpay_subscription_id = ?",
          [subscription_id]
        );

        if (!sub.length) break;

        const { childId } = sub[0];
        const paymentId = payment.id;
        const amount = payment.amount / 100;

        await db.execute(
          `INSERT INTO payments (paymentId, childId, amount, razorpay_payment_id, razorpay_subscription_id, status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [paymentId, childId, amount, paymentId, subscription_id, "failed"]
        );
        break;
      }

      case "subscription.completed":
      case "subscription.halted": {
        const subscription_id = payload.subscription.entity.id;
        const status = event === "subscription.completed" ? "completed" : "halted";

        await db.execute(
          "UPDATE subscriptions SET status = ? WHERE razorpay_subscription_id = ?",
          [status, subscription_id]
        );
        break;
      }

      default:
        console.log("Unhandled event:", event);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(500).json({ error: "Webhook handling failed" });
  }
};

