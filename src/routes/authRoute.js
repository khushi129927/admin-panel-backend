const express = require("express");
const router = express.Router();
const { verifyToken } = require("../controllers/authController");

// ✅ Verify JWT token
router.get("/verify", verifyToken);

module.exports = router;
