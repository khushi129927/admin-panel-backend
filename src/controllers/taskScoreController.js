const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const TaskScore = require("../models/taskScoreModel");
const upload = require("../middleware/upload");


exports.submitTaskScore = [
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const childId = req.body.childId?.trim();
      const taskId = req.body.taskId?.trim();
      const task_owner = req.body.task_owner?.trim();
      const mode = req.body.mode?.trim(); // "markOnly" or undefined

      if (!childId || !taskId || !task_owner) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      const [childRows] = await db.execute(`SELECT * FROM children WHERE childId = ?`, [childId]);
      if (childRows.length === 0) {
        return res.status(404).json({ error: "Child not found." });
      }

      const [taskRows] = await db.execute(`SELECT * FROM task WHERE taskId = ?`, [taskId]);
      if (taskRows.length === 0) {
        return res.status(404).json({ error: "Task not found." });
      }

      const task = taskRows[0];
      const normalizeOwner = (text) => text?.toLowerCase().replace(/[^a-z]/gi, "").trim();
      const dbTaskOwner = normalizeOwner(task.task_owner);
      const inputOwner = normalizeOwner(task_owner);
      const allowedMatches = {
        father: "fatherstask",
        mother: "motherstask",
        combined: "combinedtask"
      };

      if (allowedMatches[inputOwner] !== dbTaskOwner) {
        return res.status(403).json({ error: `This task does not belong to ${task_owner}.` });
      }

      // ✅ Check existing task_score
      const [existing] = await db.execute(
        `SELECT totalScore FROM task_scores WHERE childId = ? AND taskId = ?`,
        [childId, taskId]
      );
      if (existing.length > 0 && existing[0].totalScore > 0) {
        return res.status(409).json({ error: "Task already submitted with a score greater than 0." });
      }

      let totalScore = 0;
      let mcq1 = null, mcq2 = null, mcq3 = null;
      const comment = req.body.comment?.trim() || null;

      // ✅ If full submission
      if (mode !== "markOnly") {
        mcq1 = req.body.mcq1;
        mcq2 = req.body.mcq2;
        mcq3 = req.body.mcq3;

        if (!mcq1 || !mcq2 || !mcq3) {
          return res.status(400).json({ error: "MCQ answers are required in full submission." });
        }

        for (const selected of [mcq1, mcq2, mcq3]) {
          const optText = task[selected];
          const match = optText?.match(/\((\d+)\s*points\)/i);
          if (match) {
            totalScore += parseInt(match[1], 10);
          }
        }
      }

      // ✅ Optional file inputs
      const image_url = req.files?.image?.[0]?.path || null;
      const video_url = req.files?.video?.[0]?.path || null;

      // ✅ Insert task score
      const taskScoreId = uuidv4();
      await TaskScore.createTaskScore(
        taskScoreId,
        taskId,
        childId,
        task_owner,
        mcq1,
        mcq2,
        mcq3,
        totalScore,
        comment,
        image_url,
        video_url
      );

      // ✅ Mark task as completed
      const assignmentId = uuidv4();
      await db.execute(
        `INSERT INTO task_assignments (id, taskId, childId, status, completed_at)
         VALUES (?, ?, ?, 'completed', NOW())
         ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW()`,
        [assignmentId, taskId, childId]
      );

      res.status(200).json({
        success: true,
        mode: mode || "full",
        message: mode === "markOnly" ? "Task marked as completed." : "Task submitted with score.",
        totalScore,
        image_url,
        video_url
      });

    } catch (err) {
      console.error("❌ Error in submitTaskScore:", err);
      res.status(500).json({ error: "Failed to submit task score." });
    }
  }
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
