const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.submitTaskScore = async (req, res) => {
  const { userId, taskId, task_owner, answers } = req.body;

  try {
    // Fetch the task details
    const [taskResult] = await db.query("SELECT * FROM task WHERE taskId = ?", [taskId]);
    if (!taskResult.length) {
      return res.status(404).json({ error: "Task not found." });
    }

    const task = taskResult[0];

    // Validate task ownership
    if (!task.task_owner || !task.task_owner.toLowerCase().includes(task_owner.toLowerCase())) {
      return res.status(403).json({ error: `This task does not belong to ${task_owner}.` });
    }

    // Calculate score from selected answers
    let totalScore = 0;
    ["mcq1", "mcq2", "mcq3"].forEach((key) => {
      const selectedOptionKey = answers[key]; // e.g., "mcq1_opt3"
      const selectedText = task[selectedOptionKey]; // e.g., "Understood partially (8/10)"

      if (selectedText) {
        const match = selectedText.match(/\((\d+)\s*\/\s*\d+\)/); // Match score like (8/10)
        if (match) {
          totalScore += parseInt(match[1]);
        }
      }
    });

    // Save to task_scores table
    const taskScoreId = uuidv4();
    await db.execute(
      `INSERT INTO task_scores 
        (taskScoreId, userId, taskId, taskOwner, mcq1, mcq2, mcq3, totalScore, submitted_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        taskScoreId,
        userId,
        taskId,
        task_owner,
        answers.mcq1,
        answers.mcq2,
        answers.mcq3,
        totalScore
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

