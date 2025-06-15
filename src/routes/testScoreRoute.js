const express = require("express");
const router = express.Router();
const { submitTestScore, getScoresByUser } = require("../controllers/testScoreController");

router.post("/submit", submitTestScore);
router.get("/user/:userId", getScoresByUser);

module.exports = router;
