// ✅ controllers/taskScoreController.js
const { v4: uuidv4 } = require("uuid");
const TaskScore = require("../models/taskScoreModel");

exports.submitTaskScore = async (req, res) => {
  const { taskId, userId, score } = req.body;

  if (!taskId || !userId || typeof score !== "number") {
    return res.status(400).json({ error: "taskId, userId, and numeric score are required." });
  }

  try {
    const scoreId = uuidv4();
    await TaskScore.createTaskScore(scoreId, taskId, userId, score);
    res.status(201).json({ success: true, message: "Task score submitted." });
  } catch (error) {
    console.error("❌ Submit Task Score Error:", error.message);
    res.status(500).json({ error: "Failed to submit task score." });
  }
};

exports.getUserTaskScores = async (req, res) => {
  const { userId } = req.params;

  try {
    const scores = await TaskScore.getScoresByUser(userId);
    res.status(200).json({ success: true, data: scores });
  } catch (error) {
    console.error("❌ Get User Task Scores Error:", error.message);
    res.status(500).json({ error: "Failed to fetch task scores." });
  }
};

