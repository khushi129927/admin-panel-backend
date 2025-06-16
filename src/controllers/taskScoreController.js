const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const TaskScore = require("../models/taskScoreModel");
const upload = require("../middleware/upload"); // middleware for file upload

// Utility to avoid undefined values in SQL bindings
const safe = (v) => (v === undefined ? null : v);

exports.submitTaskScore = [
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    const { childId, taskId, task_owner, answers, comment } = req.body;

    try {
      // Validate child existence
      const [childExists] = await db.execute(
        `SELECT 1 FROM children WHERE childId = ?`,
        [safe(childId)]
      );
      if (childExists.length === 0) {
        return res.status(404).json({ error: "Child not found in children table." });
      }

      // Prevent duplicate submissions
      const [existing] = await db.execute(
        `SELECT 1 FROM task_scores WHERE childId = ? AND taskId = ?`,
        [safe(childId), safe(taskId)]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: "Task already submitted for this child." });
      }

      // Validate task ownership
      const [rows] = await db.execute(`SELECT * FROM task WHERE taskId = ?`, [safe(taskId)]);
      if (rows.length === 0)
        return res.status(404).json({ error: "Task not found." });

      const task = rows[0];
      const dbTaskOwner = task.task_owner?.toLowerCase().replace(/[’']/g, "'").trim();
      const inputOwner = task_owner?.toLowerCase().replace(/[’']/g, "'").trim();

      if (!dbTaskOwner.includes(inputOwner)) {
        return res.status(403).json({ error: `This task does not belong to ${task_owner}.` });
      }

      // ✅ Score calculation
      let totalScore = 0;
      for (const [key, selected] of Object.entries(answers || {})) {
        const optText = task[selected];
        const match = optText?.match(/\((\d+)\s*points\)/i);
        if (match) totalScore += parseInt(match[1], 10);
      }

      // ✅ Extract uploaded file URLs (null-safe)
      const image_url = req.files?.image?.[0]?.path || null;
      const video_url = req.files?.video?.[0]?.path || null;

      const taskScoreId = uuidv4();
      await db.execute(
        `INSERT INTO task_scores (
          taskScoreId, childId, taskId, taskOwner, mcq1, mcq2, mcq3, totalScore, comment, image_url, video_url, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          taskScoreId,
          safe(childId),
          safe(taskId),
          safe(task_owner),
          safe(answers?.mcq1),
          safe(answers?.mcq2),
          safe(answers?.mcq3),
          totalScore,
          safe(comment),
          safe(image_url),
          safe(video_url),
        ]
      );

      res.status(200).json({
        success: true,
        totalScore,
        comment,
        image_url,
        video_url,
      });
    } catch (err) {
      console.error("❌ Error in submitTaskScore:", err);
      res.status(500).json({ error: "Failed to submit task score." });
    }
  },
];





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
