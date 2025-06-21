// ✅ routes/taskScoreRoutes.js
const express = require("express");
const router = express.Router();
const {submitTaskScore, getChildTaskScores} = require("../controllers/taskScoreController");
const auth = require("../middleware/authMiddleware");

router.post("/submit", auth, submitTaskScore);
router.get("/child/:childId", auth, getChildTaskScores);

module.exports = router;