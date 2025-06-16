const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const TaskScore = require("../models/taskScoreModel");
const upload = require("../middleware/upload");

// 🧠 Submit Task Score Controller
exports.submitTaskScore = [
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const childId = req.body.childId?.trim();
      const taskId = req.body.taskId?.trim();
      const task_owner = req.body.task_owner?.trim();
      const comment = req.body.comment?.trim() || null;

      const answers = {
  mcq1: req.body["answers[mcq1]"],
  mcq2: req.body["answers[mcq2]"],
  mcq3: req.body["answers[mcq3]"]
};

console.log("🎯 Answers submitted:", answers);

      if (!childId || !taskId || !task_owner) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      const [childExists] = await db.execute(
        `SELECT 1 FROM children WHERE childId = ?`,
        [childId]
      );
      if (childExists.length === 0) {
        return res.status(404).json({ error: "Child not found in children table." });
      }

      const [existing] = await db.execute(
        `SELECT 1 FROM task_scores WHERE childId = ? AND taskId = ?`,
        [childId, taskId]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: "Task already submitted for this child." });
      }

      const [rows] = await db.execute(`SELECT * FROM task WHERE taskId = ?`, [taskId]);
      if (rows.length === 0) {
        return res.status(404).json({ error: "Task not found." });
      }

      const task = rows[0];
      const dbTaskOwner = task.task_owner?.toLowerCase().replace(/[’']/g, "'").trim();
      const inputOwner = task_owner.toLowerCase().replace(/[’']/g, "'").trim();

      if (!dbTaskOwner.includes(inputOwner)) {
        return res.status(403).json({ error: `This task does not belong to ${task_owner}.` });
      }

      // ✅ Score calculation
      let totalScore = 0;
      for (const selectedKey of Object.values(answers)) {
        const optText = task[selectedKey]; // e.g., task["mcq1_opt3"]
        const match = optText?.match(/\((\d+)\s*points\)/i);
        if (match) {
          totalScore += parseInt(match[1], 10);
        } else {
          console.warn(`⚠️ Invalid or missing points in field: ${selectedKey}`);
        }
      }

      // ✅ File uploads
      const image_url = req.files?.image?.[0]?.path || null;
      const video_url = req.files?.video?.[0]?.path || null;

      // ✅ Insert task score
      const taskScoreId = uuidv4();
      await TaskScore.createTaskScore(
        taskScoreId,
        taskId,
        childId,
        task_owner,
        answers.mcq1 || null,
        answers.mcq2 || null,
        answers.mcq3 || null,
        totalScore,
        comment,
        image_url,
        video_url
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
