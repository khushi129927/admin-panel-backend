const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.submitTaskScore = async (req, res) => {
  const { userId, taskId, task_owner, answers } = req.body;
  const taskScoreId = uuidv4();

  try {
    // Fetch the task details
    const [taskResult] = await db.query("SELECT * FROM task WHERE taskId = ?", [taskId]);
    const task = taskResult[0];

    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }

    // Compare task owner (case-insensitive, trimmed)
    const dbOwner = task.task_owner.toLowerCase().trim();
    const reqOwner = task_owner.toLowerCase().trim();
    if (!dbOwner.includes(reqOwner)) {
      return res.status(400).json({ error: `This task does not belong to ${task_owner}.` });
    }

    // Calculate score from the selected answers
    let totalScore = 0;

    ["mcq1", "mcq2", "mcq3"].forEach((q) => {
      const selectedOptionKey = answers[q]; // e.g., "mcq1_opt3"
      const selectedText = task[selectedOptionKey]; // e.g., "Related it well (10/10)"
      if (selectedText) {
        const match = selectedText.match(/\((\d+)\/\d+\)/);
        if (match) {
          totalScore += parseInt(match[1]);
        }
      }
    });

    // Insert into task_scores table
    await db.execute(
      `INSERT INTO task_scores (
        taskScoreId, userId, taskId, taskOwner, mcq1, mcq2, mcq3, totalScore, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        taskScoreId,
        userId,
        taskId,
        task_owner,
        answers.mcq1,
        answers.mcq2,
        answers.mcq3,
        totalScore,
      ]
    );

    res.status(201).json({ success: true, totalScore });
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

