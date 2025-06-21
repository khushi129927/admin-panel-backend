const express = require("express");
const router = express.Router();
const {getLeaderboard,getChildRank} = require("../controllers/leaderboardController");
const auth = require("../middleware/authMiddleware");

router.get("/get-all", auth, getLeaderboard);             // 30
router.get("/rank/:childId", auth, getChildRank);   // 31

module.exports = router;
