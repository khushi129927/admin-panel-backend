const express = require("express");
const router = express.Router();
const {getEQProgress,getCommunityComparison,getTaskCompletionStats} = require("../controllers/analyticsController");
const auth = require("../middleware/authMiddleware");

router.get("/eq-progress/:userId", auth, getEQProgress);       // 27
router.get("/community-comparison/:userId", auth, getCommunityComparison); // 28
router.get("/task-stats/:userId", auth, getTaskCompletionStats); // 29

module.exports = router;
