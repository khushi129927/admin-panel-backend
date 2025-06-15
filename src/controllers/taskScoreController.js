// 📁 controllers/taskScoreController.js
const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.submitTaskScore = async (req, res) => {
  try {
    const { userId, taskId, answers } = req.body;
    const taskOwner = req.body.taskOwner || req.body.task_owner;

    if (!userId || !taskId || !taskOwner || !answers) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Fetch the correct task from DB
    const [taskRows] = await db.query("SELECT * FROM task WHERE taskId = ?", [taskId]);
    if (!taskRows.length) {
      return res.status(404).json({ error: "Task not found." });
    }

    const task = taskRows[0];
    if (task.task_owner.toLowerCase() !== taskOwner.toLowerCase()) {
      return res.status(403).json({ error: `This task does not belong to ${taskOwner}.` });
    }

    // Score calculation: each correct answer gets 10, others get 0
    const scorePerMcq = (mcqKey) => {
      const correctAnswer = task[mcqKey]; // e.g., task.mcq1 = "Did the child ask questions?"
      const selectedOptionKey = answers[mcqKey]; // e.g., mcq1_opt2
      const selectedOptionText = task[selectedOptionKey];

      if (!selectedOptionText) return 0;

      const score = selectedOptionText.match(/\((\d+)\/10\)/);
      return score ? parseInt(score[1]) : 0;
    };

    const mcq1Score = scorePerMcq("mcq1");
    const mcq2Score = scorePerMcq("mcq2");
    const mcq3Score = scorePerMcq("mcq3");
    const totalScore = mcq1Score + mcq2Score + mcq3Score;

    const taskScoreId = uuidv4();

    await db.query(
      `INSERT INTO task_scores (taskScoreId, userId, taskId, taskOwner, mcq1, mcq2, mcq3, totalScore, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [taskScoreId, userId, taskId, taskOwner, answers.mcq1, answers.mcq2, answers.mcq3, totalScore]
    );

    res.status(201).json({ success: true, totalScore });
  } catch (error) {
    console.error("Error in submitTaskScore:", error.message);
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

