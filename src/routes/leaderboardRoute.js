const express = require("express");
const router = express.Router();
const {getLeaderboard,getUserRank} = require("../controllers/leaderboardController");

router.get("/get-all", getLeaderboard);             // 30
router.get("/rank/:userId", getUserRank);   // 31

module.exports = router;
