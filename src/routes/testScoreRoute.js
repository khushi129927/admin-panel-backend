const express = require("express");
const router = express.Router();
const { submitTestScore, getScoresByChild } = require("../controllers/testScoreController");
const auth = require("../middleware/authMiddleware"); // import the middleware

// 🔒 Protected routes
router.post("/submit", auth, submitTestScore);
router.get("/child/:childId", auth, getScoresByChild);

module.exports = router;
