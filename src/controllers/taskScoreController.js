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
      const mode = req.body.mode?.trim();
      const comment = req.body.comment?.trim() || null;

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

      const userId = childRows[0].userId;
      const age_group = task.age_group;
      const week = task.week;

      let totalScore = 0;
      let mcq1 = null, mcq2 = null, mcq3 = null;

      if (mode !== "markOnly") {
        mcq1 = req.body.mcq1;
        mcq2 = req.body.mcq2;
        mcq3 = req.body.mcq3;
        if (!mcq1 || !mcq2 || !mcq3) {
          return res.status(400).json({ error: "MCQ answers are required for full submission." });
        }

        for (const selected of [mcq1, mcq2, mcq3]) {
          const optText = task[selected];
          const match = optText?.match(/\((\d+)\s*points\)/i);
          if (match) totalScore += parseInt(match[1], 10);
        }
      }

      const image_url = req.files?.image?.[0]?.path || null;
      const video_url = req.files?.video?.[0]?.path || null;

      // 🔍 Check for any previous task_score
      const [existing] = await db.execute(
        `SELECT * FROM task_scores 
         WHERE childId = ? AND taskId = ?  
         AND taskOwner = ?`,
        [childId, taskId, userId, task_owner]
      );

      if (existing.length > 0) {
        const prev = existing[0];
        if (prev.totalScore > 0) {
          return res.status(409).json({ error: "Task already fully submitted. No further submissions allowed." });
        }

        if (mode !== "markOnly") {
          // 🟡 Full submission allowed after markOnly
          await db.execute(
            `UPDATE task_scores 
             SET mcq1 = ?, mcq2 = ?, mcq3 = ?, totalScore = ?, comment = ?, image_url = ?, video_url = ?, submitted_at = NOW()
             WHERE taskScoreId = ?`,
            [mcq1, mcq2, mcq3, totalScore, comment, image_url, video_url, prev.taskScoreId]
          );
        } else {
          // 🔒 MarkOnly again not allowed if already exists
          return res.status(409).json({ error: "Task already marked. Submit full version to update." });
        }

      } else {
        // 🆕 First-time submission
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
          video_url,
          userId,
          age_group,
          week
        );
      }

      // 🟢 Mark in task_assignments
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
        totalScore,
        message: mode === "markOnly" ? "Task marked as completed." : "Task fully submitted."
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
