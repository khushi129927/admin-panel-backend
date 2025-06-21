const express = require("express");
const router = express.Router();
const {uploadTestQuestions,getTests,getTestsByAge,getTestsByQuarterOnly,getTestsByAgeAndQuarter} = require("../controllers/testController");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const auth = require("../middleware/authMiddleware");

// in routes/testRoute.js
router.post("/upload", uploadTestQuestions);

router.get("/get-all", auth, getTests);
router.get("/get-test-by-age/:age", auth, getTestsByAge);
router.get("/get-test-by-quarter/:quarter", auth, getTestsByQuarterOnly);
router.get("/get-test-by-age-and-quarter", auth, getTestsByAgeAndQuarter);

module.exports = router;
