// subscriptionController.js
const Razorpay = require("razorpay");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Create Razorpay Subscription Only (don't save in DB yet)
exports.createSubscription = async (req, res) => {
  try {
    const { childId, planType, parentEmail } = req.body;

    const planMap = {
      monthly: "plan_QnTkv9jZTe1SaF",
      six_months: "plan_QnTpLcL3acuGsQ",
      yearly: "plan_QnTpjaSYfnBI2z"
    };

    const plan_id = planMap[planType];
    if (!plan_id) return res.status(400).json({ error: "Invalid planType provided" });

    // 🔍 Step 1: Check if customer already exists in users table
    const [userResult] = await db.execute(
      "SELECT razorpay_customer_id FROM users WHERE email = ?",
      [parentEmail]
    );

    if (!userResult.length) {
      return res.status(404).json({ error: "User not found with this email." });
    }

    let customerId = userResult[0].razorpay_customer_id;

    // 🆕 Create customer only if not already created
    if (!customerId) {
    const customer = await razorpay.customers.create({ email: parentEmail });
    customerId = customer.id;

    if (!parentEmail || !customerId) {
      return res.status(400).json({ error: "Invalid parentEmail or customerId." });
    }

    // Save Razorpay customer ID in users table
    await db.execute(
      "UPDATE users SET razorpay_customer_id = ? WHERE email = ?",
      [customerId, parentEmail]
      );
    }

    // 📦 Step 2: Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id,
      customer_notify: 1,
      total_count: 12,
      customer_id: customerId
    });

    res.status(200).json({
      success: true,
      message: "Subscription created successfully.",
      subscription,
      customerId
    });
  } catch (error) {
    console.error("Create Subscription Error:", error);
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

// 6. Verify Payment
exports.verifySubscriptionPayment = async (req, res) => {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, childId, amount } = req.body;
  try {
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_payment_id + "|" + razorpay_subscription_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Save payment record
    await db.execute(
      `INSERT INTO payments (paymentId, childId, amount, razorpay_payment_id, razorpay_subscription_id, razorpay_signature, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [razorpay_payment_id, childId, amount, razorpay_payment_id, razorpay_subscription_id, razorpay_signature, "paid"]
    );

    // Insert subscription only if not already there
    const [existing] = await db.execute("SELECT * FROM subscriptions WHERE childId = ?", [childId]);
    if (existing.length === 0) {
      await db.execute(
        `INSERT INTO subscriptions (subscriptionId, childId, plan, status, razorpay_subscription_id)
         VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), childId, "auto", "active", razorpay_subscription_id]
      );
    }

    res.status(200).json({ success: true, message: "Payment verified and subscription saved." });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 7. Webhook Handler
exports.handleWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");
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
