const express = require("express");
const router = express.Router();
const {createSubscription, getSubscriptions, getSubscription, updateSubscription, getPaymentHistory,verifySubscriptionPayment} = require("../controllers/subscriptionController");

// ✅ Core Subscription Routes
router.post("/create", createSubscription);          // Create subscription via Razorpay
router.get("/get-all", getSubscriptions);            // Get all subscriptions
router.get("/:userId", getSubscription);             // Get a specific user's subscription
router.put("/update", updateSubscription);           // Update subscription details

// 💳 Payment History
router.get("/payments/:userId", getPaymentHistory);  // User's payment history

// ✅ Payment Verification (Razorpay webhook or frontend response)
router.post("/verify", verifySubscriptionPayment);   // Verify Razorpay payment

module.exports = router;
