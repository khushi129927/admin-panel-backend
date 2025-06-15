// 📁 controllers/taskScoreController.js
const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.submitTaskScore = async (req, res) => {
  const { userId, taskId, taskOwner, answers } = req.body;

  try {
    // Fetch the task
    const [taskRows] = await db.execute("SELECT * FROM task WHERE taskId = ?", [taskId]);
    if (!taskRows.length) {
      return res.status(404).json({ error: "Task not found." });
    }

    const task = taskRows[0];

    // Normalize the expected task owner from DB
    const expectedOwner = task.task_owner?.toLowerCase().includes("mother")
      ? "mother"
      : task.task_owner?.toLowerCase().includes("father")
      ? "father"
      : "combined";

    if (expectedOwner !== taskOwner.toLowerCase()) {
      return res.status(400).json({ error: `This task does not belong to ${taskOwner}.` });
    }

    // Map MCQ options to scores
    const scoreMap = {
      mcq1_opt1: 10,
      mcq1_opt2: 8,
      mcq1_opt3: 4,
      mcq1_opt4: 6,
      mcq2_opt1: 8,
      mcq2_opt2: 4,
      mcq2_opt3: 8,
      mcq2_opt4: 4,
      mcq3_opt1: 10,
      mcq3_opt2: 10,
      mcq3_opt3: 8,
      mcq3_opt4: 6,
    };

    const totalScore =
      scoreMap[answers.mcq1] +
      scoreMap[answers.mcq2] +
      scoreMap[answers.mcq3];

    const taskScoreId = uuidv4();
    await db.execute(
      `INSERT INTO task_scores (taskScoreId, userId, taskId, taskOwner, mcq1, mcq2, mcq3, totalScore, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        taskScoreId,
        userId,
        taskId,
        taskOwner,
        answers.mcq1,
        answers.mcq2,
        answers.mcq3,
        totalScore,
      ]
    );

    res.status(201).json({ success: true, taskScoreId, totalScore });
  } catch (err) {
    console.error("Error in submitTaskScore:", err.message);
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

