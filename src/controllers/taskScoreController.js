exports.submitTaskScore = async (req, res) => {
  const { userId, taskId, task_owner, answers } = req.body;

  try {
    // 1. Check if score already exists
    const [existing] = await db.execute(
      `SELECT 1 FROM task_scores WHERE userId = ? AND taskId = ?`,
      [userId, taskId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "Task already submitted by this user." });
    }

    // 2. Fetch task
    const [rows] = await db.execute(`SELECT * FROM tasks WHERE taskId = ?`, [taskId]);
    if (rows.length === 0) return res.status(404).json({ error: "Task not found." });

    const task = rows[0];

    // 3. Normalize task owner
    const dbTaskOwner = task.task_owner?.toLowerCase().replace(/[’']/g, "'").trim();
    const inputOwner = task_owner.toLowerCase().replace(/[’']/g, "'").trim();
    if (!dbTaskOwner.includes(inputOwner)) {
      return res.status(403).json({ error: `This task does not belong to ${task_owner}.` });
    }

    // 4. Calculate total score
    let totalScore = 0;
    for (const [key, selected] of Object.entries(answers)) {
      const optText = task[selected];
      const match = optText?.match(/\((\d+)\s*points\)/i);
      if (match) totalScore += parseInt(match[1], 10);
    }

    // 5. Save result
    const taskScoreId = uuidv4();
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
        totalScore
      ]
    );

    res.status(200).json({ success: true, totalScore });
  } catch (err) {
    console.error("❌ Error in submitTaskScore:", err);
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

