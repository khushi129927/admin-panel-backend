const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const TaskScore = require("../models/taskScoreModel");
const upload = require("../middleware/upload");

exports.submitTaskScore = [
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // 🔍 Fix extra tab issues
      const trimKey = (key) => key.replace(/\s/g, "").trim();

      const childId = trimKey(req.body.childId || req.body["childId\t"]);
      const taskId = trimKey(req.body.taskId);
      const task_owner = (req.body.task_owner || "").trim();
      const comment = req.body.comment?.trim() || null;

      const answers = {
        mcq1: req.body["answers[mcq1]"],
        mcq2: req.body["answers[mcq2]"],
        mcq3: req.body["answers[mcq3]"],
      };

      if (!childId || !taskId || !task_owner) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      // ✅ Validate child exists
      const [childExists] = await db.execute(
        `SELECT 1 FROM children WHERE childId = ?`,
        [childId]
      );
      if (childExists.length === 0) {
        return res.status(404).json({ error: "Child not found in children table." });
      }

      // ✅ Prevent duplicate submission
      const [existing] = await db.execute(
        `SELECT 1 FROM task_scores WHERE childId = ? AND taskId = ?`,
        [childId, taskId]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: "Task already submitted for this child." });
      }

      // ✅ Fetch task
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
      for (const [mcqKey, selectedOption] of Object.entries(answers)) {
        const answerText = task[selectedOption]; // task["mcq1_opt3"]
        console.log("🎯 Answer option:", selectedOption, "->", answerText);
        const match = answerText?.match(/\((\d+)\s*points\)/i);
        if (match) totalScore += parseInt(match[1], 10);
      }

      // ✅ File uploads
      const image_url = req.files?.image?.[0]?.path || null;
      const video_url = req.files?.video?.[0]?.path || null;

      // ✅ Save to DB
      const taskScoreId = uuidv4();
      await db.execute(
        `INSERT INTO task_scores (
          taskScoreId, childId, taskId, taskOwner, mcq1, mcq2, mcq3, totalScore, comment, image_url, video_url, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          taskScoreId,
          childId,
          taskId,
          task_owner,
          answers.mcq1,
          answers.mcq2,
          answers.mcq3,
          totalScore,
          comment,
          image_url,
          video_url,
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
