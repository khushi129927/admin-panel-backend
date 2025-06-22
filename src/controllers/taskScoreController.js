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
      const [childRows] = await db.execute(`SELECT * FROM children WHERE childId = ?`, [childId]);
      if (childRows.length === 0) {
        return res.status(404).json({ error: "Child not found." });
      }

      // ✅ Validate task and owner
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

      // ✅ Prevent duplicate
      const [existing] = await db.execute(
        `SELECT 1 FROM task_scores WHERE childId = ? AND taskId = ?`,
        [childId, taskId]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: "Task already submitted for this child." });
      }

      // ✅ Correct Score Calculation
      let totalScore = 0;
      const answers = [mcq1, mcq2, mcq3];
      const optionKeys = ["mcq1", "mcq2", "mcq3"];

      answers.forEach((selected, index) => {
        const key = `${optionKeys[index]}_${selected.toLowerCase()}`; // e.g. mcq1_opt2
        const optText = task[key]; // e.g. "Could not relate at all (4/10)"
        const match = optText?.match(/\((\d+)\s*\/\s*\d+\)/); // extract 4 from (4/10)
        if (match) {
          totalScore += parseInt(match[1], 10);
        }
      });

      // ✅ Optional file inputs
      const image_url = req.files?.image?.[0]?.path || null;
      const video_url = req.files?.video?.[0]?.path || null;

      // ✅ Save task score
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

      // ✅ Mark as completed
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
