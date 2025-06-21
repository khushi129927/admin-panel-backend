const express = require("express");
const router = express.Router();
const {createCoupon,getCoupons,applyCoupon} = require("../controllers/couponController");
const auth = require("../middleware/authMiddleware");

router.post("/create", auth, createCoupon);        // Create new coupon
router.get("/get-all", auth, getCoupons);           // View all coupons
router.post("/apply", auth, applyCoupon);    // Apply to user

module.exports = router;
