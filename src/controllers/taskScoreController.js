const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const TaskScore = require("../models/taskScoreModel");

exports.submitTaskScore = async (req, res) => {
  const { childId, taskId, task_owner, answers } = req.body;

  try {
    // 0. Verify childId exists in children table
    const [childExists] = await db.execute(
      `SELECT 1 FROM children WHERE childId = ?`,
      [childId]
    );

    if (childExists.length === 0) {
      return res.status(404).json({ error: "Child not found in children table." });
    }

    // 1. Check if already submitted
    const [existing] = await db.execute(
      `SELECT 1 FROM task_scores WHERE childId = ? AND taskId = ?`,
      [childId, taskId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Task already submitted for this child." });
    }

    // 2. Fetch task
    const [rows] = await db.execute(`SELECT * FROM task WHERE taskId = ?`, [taskId]);
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

    // 5. Save to task_scores
    const taskScoreId = uuidv4();
    await db.execute(
      `INSERT INTO task_scores (
        taskScoreId, childId, taskId, taskOwner, mcq1, mcq2, mcq3, totalScore, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        taskScoreId,
        childId,
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


// 📤 Get Scores by Child
exports.getChildTaskScores = async (req, res) => {
  const { childId } = req.params;

  try {
    const scores = await TaskScore.getScoresByChild(childId);
    res.status(200).json({ success: true, data: scores });
  } catch (error) {
    console.error("❌ Get Child Task Scores Error:", error.message);
    res.status(500).json({ error: "Failed to fetch task scores." });
  }
};
