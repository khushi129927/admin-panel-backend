const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const TaskScore = require("../models/taskScoreModel");

exports.submitTaskScore = async (req, res) => {
  const { taskId, userId, answers, taskOwner } = req.body;

  const validOwners = ["mother", "father", "combined"];
  if (!taskId || !userId || typeof answers !== "object" || !taskOwner) {
    return res.status(400).json({ error: "taskId, userId, taskOwner, and answers are required." });
  }

  if (!validOwners.includes(taskOwner.toLowerCase())) {
    return res.status(400).json({ error: "taskOwner must be 'mother', 'father', or 'combined'." });
  }

  try {
    const [taskRows] = await db.execute("SELECT * FROM task WHERE taskId = ?", [taskId]);
    if (!taskRows.length) return res.status(404).json({ error: "Task not found." });

    const task = taskRows[0];

    // Check that the task belongs to the correct owner
    if (task.task_owner.toLowerCase() !== taskOwner.toLowerCase()) {
      return res.status(403).json({ error: `This task does not belong to ${taskOwner}.` });
    }

    let score = 0;
    if (answers.mcq1 && task[answers.mcq1]) score += Number(task[answers.mcq1]) || 0;
    if (answers.mcq2 && task[answers.mcq2]) score += Number(task[answers.mcq2]) || 0;
    if (answers.mcq3 && task[answers.mcq3]) score += Number(task[answers.mcq3]) || 0;

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

