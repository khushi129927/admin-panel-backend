const express = require("express");
const { createSubscription, getSubscriptions } = require("../controllers/subscriptionController");
const router = express.Router();

router.post("/create", createSubscription);
router.get("/get-all", getSubscriptions);

module.exports = router;
