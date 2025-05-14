// 📁 src/routes/taskRoute.js
const express = require("express");
const { getTask, uploadTask } = require("../controllers/taskController");
const router = express.Router();

router.get("/get-all", getTask);
router.post("/upload", uploadTask);

module.exports = router;
