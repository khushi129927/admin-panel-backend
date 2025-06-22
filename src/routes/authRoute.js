const express = require("express");
const router = express.Router();
const { verifyToken, logoutUser } = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

// ✅ Verify JWT token
router.get("/verify", verifyToken);
router.post("/logout", auth, logoutUser);

module.exports = router;
