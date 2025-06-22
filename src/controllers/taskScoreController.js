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
      const comment = req.body.comment?.trim() || null;
      const mcq1 = req.body.mcq1;
      const mcq2 = req.body.mcq2;
      const mcq3 = req.body.mcq3;

      if (!childId || !taskId || !task_owner || !mcq1 || !mcq2 || !mcq3) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      // ✅ Validate child
      const [childRows] = await db.execute(
        `SELECT * FROM children WHERE childId = ?`, [childId]
      );
      if (childRows.length === 0) {
        return res.status(404).json({ error: "Child not found." });
      }

      // ✅ Validate task
      const [taskRows] = await db.execute(
        `SELECT * FROM task WHERE taskId = ?`, [taskId]
      );
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

      // ✅ Check duplicate
      const [existing] = await db.execute(
        `SELECT 1 FROM task_scores WHERE childId = ? AND taskId = ? AND taskOwner = ?`,
        [childId, taskId, task_owner]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: "Task already submitted for this child." });
      }

      // ✅ Calculate score
      let totalScore = 0;
      const getOptionText = (key) => {
        const map = {
          mcq1_opt1: task.mcq1Opt1,
          mcq1_opt2: task.mcq1Opt2,
          mcq1_opt3: task.mcq1Opt3,
          mcq1_opt4: task.mcq1Opt4,
          mcq2_opt1: task.mcq2Opt1,
          mcq2_opt2: task.mcq2Opt2,
          mcq2_opt3: task.mcq2Opt3,
          mcq2_opt4: task.mcq2Opt4,
          mcq3_opt1: task.mcq3Opt1,
          mcq3_opt2: task.mcq3Opt2,
          mcq3_opt3: task.mcq3Opt3,
          mcq3_opt4: task.mcq3Opt4,
        };
        return map[key];
      };

      for (const selected of [mcq1, mcq2, mcq3]) {
        const optText = getOptionText(selected);
        const match = optText?.match(/\((\d+)\s*points\)/i);
        if (match) totalScore += parseInt(match[1], 10);
      }

      const image_url = req.files?.image?.[0]?.path || null;
      const video_url = req.files?.video?.[0]?.path || null;

      // ✅ Insert into task_scores
      const taskScoreId = uuidv4();
      const userId = childRows[0].userId;
      const age_group = task.age_group;
      const week = task.week;

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

      // ✅ Update task_assignments
      const assignmentId = uuidv4();
      await db.execute(
        `INSERT INTO task_assignments (id, taskId, childId, status, completed_at)
         VALUES (?, ?, ?, 'completed', NOW())
         ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW()`,
        [assignmentId, taskId, childId]
      );

      res.status(200).json({
        success: true,
        totalScore,
        comment,
        image_url,
        video_url,
        message: "Task successfully submitted."
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
