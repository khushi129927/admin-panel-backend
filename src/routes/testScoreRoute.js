const express = require("express");
const router = express.Router();
const { submitTestScore, getScoresByChild } = require("../controllers/testScoreController");

router.post("/submit", submitTestScore);
router.get("/child/:childId", getScoresByChild);

module.exports = router;
