const express = require("express");
const router = express.Router();
const {getLeaderboard,getChildRank} = require("../controllers/leaderboardController");

router.get("/get-all", getLeaderboard);             // 30
router.get("/rank/:childId", getChildRank);   // 31

module.exports = router;
