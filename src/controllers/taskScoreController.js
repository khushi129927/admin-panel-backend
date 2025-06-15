const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const TaskScore = require("../models/taskScoreModel");

exports.submitTaskScore = async (req, res) => {
  const { taskId, userId, answers } = req.body;

  if (!taskId || !userId || typeof answers !== "object") {
    return res.status(400).json({ error: "taskId, userId, and answers are required." });
  }

  try {
    // 1. Fetch task
    const [taskRows] = await db.execute("SELECT * FROM task WHERE taskId = ?", [taskId]);
    if (!taskRows.length) return res.status(404).json({ error: "Task not found." });
    
    const task = taskRows[0];

    // 2. Calculate score dynamically
    let score = 0;
    if (answers.mcq1 && task[answers.mcq1]) score += Number(task[answers.mcq1]) || 0;
    if (answers.mcq2 && task[answers.mcq2]) score += Number(task[answers.mcq2]) || 0;
    if (answers.mcq3 && task[answers.mcq3]) score += Number(task[answers.mcq3]) || 0;

    // 3. Save score
    const scoreId = uuidv4();
    await TaskScore.createTaskScore(scoreId, taskId, userId, score);

    res.status(201).json({ success: true, message: "Task score submitted.", score });
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

