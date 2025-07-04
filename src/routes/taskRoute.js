// 📁 src/routes/taskRoute.js
const express = require("express");
const multer = require("multer");
const { getTask, uploadTask, getTasksByWeek, getTasksByTaskOwner, getCompletedTasksByChildId, assignTaskToChild, updateTaskStatus, getWeeklyTasksForUser, submitFeedback } = require("../controllers/taskController");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

// ✅ Routes
router.get("/get-all", getTask);
router.post("/upload", uploadTask);
router.get("/get/week/:week", auth, getTasksByWeek);          // GET single task
router.get("/:userId/:task_owner/:week", auth, getTasksByTaskOwner);
router.get("/completed-tasks/:childId", auth, getCompletedTasksByChildId);
router.post("/assign", auth, assignTaskToChild);     // POST assign
router.put("/status/:taskId", auth, updateTaskStatus);  // PUT status update
router.get("/weekly/:userId", auth, getWeeklyTasksForUser); // Weekly tasks
router.post("/feedback", auth, submitFeedback);     // POST feedback


module.exports = router;
