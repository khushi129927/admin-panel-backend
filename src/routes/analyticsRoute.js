const express = require("express");
const router = express.Router();
const {submitEqScore, getEqTrend, addSchoolMarks, getSchoolMarksTrend, submitAchievement, getAchievementsTrend, getTaskCompletionCount} = require("../controllers/analyticsController");
const auth = require("../middleware/authMiddleware");

// EQ trend line (percentile over time)
router.get("/eq-trend/:childId", auth, getEqTrend);
router.post("/eq-trend/submit", auth, submitEqScore);

// School marks trend
router.get("/school-marks/:childId", auth, getSchoolMarksTrend);
router.post("/school-marks/submit", auth, addSchoolMarks);

// Achievements trend (sports, arts, etc.)
router.get("/achievements/:childId", auth, getAchievementsTrend);
router.post("/achievements/submit", auth, submitAchievement);

// Number of tasks completed
router.get("/tasks-completed/:childId", auth, getTaskCompletionCount);

module.exports = router;
