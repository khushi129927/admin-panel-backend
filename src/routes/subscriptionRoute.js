const express = require("express");
const router = express.Router();
const {createSubscription,getSubscription,getSubscriptions,updateSubscription,getPaymentHistory} = require("../controllers/subscriptionController");

// Core Subscription Routes
router.post("/create", createSubscription);               // Create
router.get("/get-all", getSubscriptions);                  // All Subscriptions
router.get("/:userId", getSubscription);            // Get by userId
router.put("/update", updateSubscription);                // Update

// Payment History
router.get("/payments/:userId", getPaymentHistory); // User's Payments

module.exports = router;
