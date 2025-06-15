// 📁 src/routes/taskRoute.js
const express = require("express");
const multer = require("multer");
const { getTask, uploadTask, getTaskByWeek, assignTaskToUser, updateTaskStatus, getWeeklyTasksForUser, submitFeedback } = require("../controllers/taskController");
const router = express.Router();

// ✅ Routes
router.get("/get-all", getTask);
router.post("/upload", uploadTask);
router.get("/get/:week", getTaskByWeek);          // GET single task
router.post("/assign", assignTaskToUser);     // POST assign
router.put("/status/:taskId", updateTaskStatus);  // PUT status update
router.get("/weekly/:userId", getWeeklyTasksForUser); // Weekly tasks
router.post("/feedback", submitFeedback);     // POST feedback


module.exports = router;
