const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.submitTaskScore = async (req, res) => {
  const { userId, taskId, task_owner, answers } = req.body;

  if (!userId || !taskId || !task_owner || !answers) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    // 1. Fetch the task
    const [taskResult] = await db.query("SELECT * FROM task WHERE taskId = ?", [taskId]);

    if (!taskResult.length) {
      return res.status(404).json({ error: "Task not found." });
    }

    const task = taskResult[0];

    // 2. Validate task owner
    const submittedOwner = task_owner.trim().toLowerCase();
    const dbOwner = task.task_owner.trim().toLowerCase();

    if (!dbOwner.includes(submittedOwner)) {
      return res.status(400).json({ error: `This task does not belong to ${task_owner}.` });
    }

    // 3. Calculate total score
    let score = 0;

    const scoringMap = {
      "10/10": 10,
      "8/10": 8,
      "6/10": 6,
      "4/10": 4
    };

    for (let q of ["mcq1", "mcq2", "mcq3"]) {
      const selectedOptKey = answers[q];
      const optionText = task[selectedOptKey];
      if (!optionText) continue;

      const match = optionText.match(/\((\d+)\/10\)/);
      if (match) score += parseInt(match[1]);
    }

    // 4. Save to task_scores table
    const taskScoreId = uuidv4();

    await db.query(
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
        score
      ]
    );

    res.status(201).json({ success: true, totalScore: score });
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

