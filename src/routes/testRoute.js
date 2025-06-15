const express = require("express");
const router = express.Router();
const {uploadTestQuestions,getTests,getTestsByAge,getTestsByQuarterOnly,getTestsByAgeAndQuarter} = require("../controllers/testController");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

// in routes/testRoute.js
router.post("/upload", uploadTestQuestions);

router.get("/get-all", getTests);
router.get("/get-test-by-age/:age", getTestsByAge);
router.get("/get-test-by-quarter/:quarter", getTestsByQuarterOnly);
router.get("/get-test-by-age-and-quarter", getTestsByAgeAndQuarter);

module.exports = router;
