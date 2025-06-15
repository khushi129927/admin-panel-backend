// controllers/taskScoreController.js
const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.submitTaskScore = async (req, res) => {
  const { userId, taskId, task_owner, answers } = req.body;
  console.log("Request payload:", req.body);

  try {
    const [taskRows] = await db.query("SELECT * FROM task WHERE taskId = ?", [taskId]);
    console.log("Fetched task rows:", taskRows);

    if (!taskRows.length) {
      return res.status(404).json({ error: "Task not found." });
    }

    const task = taskRows[0];
    console.log("Task owner in DB:", task.task_owner);

    if (!task.task_owner || !task.task_owner.toLowerCase().includes(task_owner.toLowerCase())) {
      return res.status(400).json({ error: `This task does not belong to ${task_owner}.` });
    }

    let totalScore = 0;

    for (const key of ["mcq1", "mcq2", "mcq3"]) {
      const optKey = answers[key];
      const optText = task[optKey];
      console.log(`Answer [${key}]:`, optKey, "=>", optText);

      if (!optText) continue;
      const match = optText.match(/\((\d+)\s*\/\s*\d+\)/);
      console.log(`Score extracted for ${optKey}:`, match ? match[1] : "no match");

      if (match) {
        totalScore += parseInt(match[1]);
      }
    }

    console.log("Total score calculated:", totalScore);

    const taskScoreId = uuidv4();
    await db.execute(
      `INSERT INTO task_scores 
        (taskScoreId, userId, taskId, taskOwner, mcq1, mcq2, mcq3, totalScore, submitted_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [taskScoreId, userId, taskId, task_owner, answers.mcq1, answers.mcq2, answers.mcq3, totalScore]
    );

    res.status(201).json({ success: true, totalScore });
  } catch (err) {
    console.error("Error in submitTaskScore:", err);
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

