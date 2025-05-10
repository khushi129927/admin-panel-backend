const express = require("express");
const router = express.Router();
const testController = require("../controllers/testController");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

// in routes/testRoute.js
router.post("/upload", upload.single("file"), testController.uploadTestQuestions);

router.get("/get-all", testController.getTests);

module.exports = router;
