const express = require("express");
const router = express.Router();
const {createCoupon,getCoupons,applyCoupon} = require("../controllers/couponController");

router.post("/create", createCoupon);        // Create new coupon
router.get("/get-all", getCoupons);           // View all coupons
router.post("/apply", applyCoupon);    // Apply to user

module.exports = router;
