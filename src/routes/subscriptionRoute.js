const express = require("express");
const router = express.Router();
const {createSubscription, getSubscriptions, getSubscription, updateSubscription, getPaymentHistory,verifySubscriptionPayment} = require("../controllers/subscriptionController");
const auth = require("../middleware/authMiddleware");

// ✅ Core Subscription Routes
router.post("/create", auth, createSubscription);          // Create subscription via Razorpay
router.get("/get-all", auth, getSubscriptions);            // Get all subscriptions
router.get("/:childId", auth, getSubscription);             // Get a specific user's subscription
router.put("/update", auth, updateSubscription);           // Update subscription details

// 💳 Payment History
router.get("/payments/:userId", auth, getPaymentHistory);  // User's payment history

// ✅ Payment Verification (Razorpay webhook or frontend response)
router.post("/verify", auth, verifySubscriptionPayment);   // Verify Razorpay payment

module.exports = router;
