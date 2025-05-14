const express = require("express");
const router = express.Router();
const {uploadTestQuestions,getTests} = require("../controllers/testController");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

// in routes/testRoute.js
router.post("/upload", uploadTestQuestions);

router.get("/get-all", getTests);

module.exports = router;
