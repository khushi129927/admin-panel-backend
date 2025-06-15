// ✅ routes/taskScoreRoutes.js
const express = require("express");
const router = express.Router();
const taskScoreController = require("../controllers/taskScoreController");

router.post("/submit", taskScoreController.submitTaskScore);
router.get("/user/:userId", taskScoreController.getUserTaskScores);

module.exports = router;