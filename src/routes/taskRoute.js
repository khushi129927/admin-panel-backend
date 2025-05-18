// 📁 src/routes/taskRoute.js
const express = require("express");
const multer = require("multer");
const { getTask, uploadTask } = require("../controllers/taskController");
const router = express.Router();

// ✅ Routes
router.get("/get-all", getTask);
router.post("/upload", uploadTask);

module.exports = router;
