// 📁 src/routes/taskRoute.js
const express = require("express");
const multer = require("multer");
const { getTask, uploadTask } = require("../controllers/taskController");
const router = express.Router();

// ✅ Set up multer (for file uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ✅ Routes
router.get("/get-all", getTask);
router.post("/upload", upload.single("file"), uploadTask);

module.exports = router;
