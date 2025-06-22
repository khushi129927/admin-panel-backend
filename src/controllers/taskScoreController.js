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

      // ✅ Validate child exists
      const [childRows] = await db.execute(`SELECT * FROM children WHERE childId = ?`, [childId]);
      if (childRows.length === 0) {
        return res.status(404).json({ error: "Child not found." });
      }

      // ✅ Validate task exists and owner matches
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

      // ✅ If mode is "markOnly" → skip MCQs and save only task_assignments entry
      if (mode === "markOnly") {
        const assignmentId = uuidv4();
        await db.execute(
          `INSERT INTO task_assignments (id, taskId, childId, status, completed_at)
           VALUES (?, ?, ?, 'completed', NOW())
           ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW()`,
          [assignmentId, taskId, childId]
        );

        return res.status(200).json({ success: true, message: "Task marked as completed without MCQs." });
      }

      // ✅ Full submission
      const mcq1 = req.body.mcq1;
      const mcq2 = req.body.mcq2;
      const mcq3 = req.body.mcq3;
      const comment = req.body.comment?.trim() || null;

      if (!mcq1 || !mcq2 || !mcq3) {
        return res.status(400).json({ error: "MCQ answers are required in full submission." });
      }

      const [existing] = await db.execute(
        `SELECT 1 FROM task_scores WHERE childId = ? AND taskId = ?`,
        [childId, taskId]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: "Task already submitted for this child." });
      }

      let totalScore = 0;
      for (const selected of [mcq1, mcq2, mcq3]) {
        const optText = task[selected];
        const match = optText?.match(/\((\d+)\s*points\)/i);
        if (match) {
          totalScore += parseInt(match[1], 10);
        }
      }

      const image_url = req.files?.image?.[0]?.path || null;
      const video_url = req.files?.video?.[0]?.path || null;

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

      const assignmentId = uuidv4();
      await db.execute(
        `INSERT INTO task_assignments (id, taskId, childId, status, completed_at)
         VALUES (?, ?, ?, 'completed', NOW())
         ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW()`,
        [assignmentId, taskId, childId]
      );

      res.status(200).json({
        success: true,
        message: "Task submitted successfully.",
        totalScore,
        comment,
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
