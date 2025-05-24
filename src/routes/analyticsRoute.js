const express = require("express");
const router = express.Router();
const {getEQProgress,getCommunityComparison,getTaskCompletionStats} = require("../controllers/analyticsController");

router.get("/eq-progress/:userId", getEQProgress);       // 27
router.get("/community-comparison/:userId", getCommunityComparison); // 28
router.get("/task-stats/:userId", getTaskCompletionStats); // 29

module.exports = router;
