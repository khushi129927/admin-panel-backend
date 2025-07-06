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

    // 🔁 Step 1: Validate input
    if (!childId || !planType || !parentEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🔍 Step 2: Validate child-parent relationship
    const [childResult] = await db.execute(`
      SELECT c.childId, u.razorpay_customer_id
      FROM children c
      JOIN users u ON c.userId = u.userId
      WHERE c.childId = ? AND u.email = ?
    `, [childId, parentEmail]);

    if (!childResult.length) {
      return res.status(403).json({ error: "Child does not belong to the given parent email." });
    }

    // 🔁 Step 3: Map plan types to Razorpay plan IDs
    const planMap = {
      monthly: process.env.PLAN_MONTHLY,
      six_months: process.env.PLAN_SIX_MONTHS,
      yearly: process.env.PLAN_YEARLY
    };

    const plan_id = planMap[planType];
    if (!plan_id) {
      return res.status(400).json({ error: "Invalid planType provided" });
    }

    // ✅ Step 4: Use existing Razorpay customer ID or create a new one
    let customerId = childResult[0].razorpay_customer_id;

    if (!customerId) {
      const customer = await razorpay.customers.create({ email: parentEmail });
      customerId = customer.id;

      // 🔄 Update users table with Razorpay customer ID
      await db.execute(
        "UPDATE users SET razorpay_customer_id = ? WHERE email = ?",
        [customerId, parentEmail]
      );
    }

    // 🛒 Step 5: Create Razorpay Subscription (don’t save in DB yet)
    const subscription = await razorpay.subscriptions.create({
      plan_id,
      customer_notify: 1,
      total_count: 12,
      customer_id: customerId
    });

    // ✅ Done — subscription created at Razorpay
    res.status(200).json({
      success: true,
      message: "Razorpay subscription created. Awaiting payment confirmation.",
      subscription
    });

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

// 6. Verify Payment
exports.verifySubscriptionPayment = async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
    childId,
    amount,
    plan // pass this from frontend: 'monthly', '6-months', 'yearly', etc.
  } = req.body;

  try {
    const isTestMode = process.env.NODE_ENV !== "production";
    let verified = false;

    if (isTestMode) {
      console.log("🧪 Test mode: Skipping signature verification");
      verified = true;
    } else {
      const generated_signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_payment_id + "|" + razorpay_subscription_id)
        .digest("hex");

      verified = generated_signature === razorpay_signature;
    }

    if (!verified) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // ✅ Insert into payments table
    const paymentId = razorpay_payment_id;
    const paymentSql = `
      INSERT INTO payments (paymentId, childId, amount, razorpay_payment_id, razorpay_subscription_id, razorpay_signature, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await db.execute(paymentSql, [
      paymentId,
      childId,
      amount,
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature || "test_mode",
      "paid"
    ]);

    // ✅ Insert into subscriptions table
    const subscriptionId = uuidv4();
    const subscriptionSql = `
      INSERT INTO subscriptions (subscriptionId, childId, plan, status, razorpay_subscription_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.execute(subscriptionSql, [
      subscriptionId,
      childId,
      plan || "monthly",
      "active",
      razorpay_subscription_id
    ]);

    return res.status(200).json({ success: true, message: "Payment and subscription saved." });

  } catch (err) {
    console.error("❌ Payment verification error:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
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
