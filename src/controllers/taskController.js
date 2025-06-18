// 📁 controllers/taskController.js
const db = require("../config/db");
const xlsx = require("xlsx");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }).single("file");

// 📤 Upload Excel & Insert MCQs
exports.uploadTask = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: `File upload error: ${err.message}` });

    if (!req.file) return res.status(400).json({ error: "No file uploaded." });

    try {
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = xlsx.utils.sheet_to_json(sheet);

      const entries = rawData.map((row) => ([
        uuidv4(),
        row["Week"], row["Task OWNER"], row["TASK"],
        row["MCQ 1"], row["MCQ 2"], row["MCQ 3"],
        row["MCQ 1 Option 1"], row["MCQ 1 Option 2"], row["MCQ 1 Option 3"], row["MCQ 1 Option 4"],
        row["MCQ 2 Option 1"], row["MCQ 2 Option 2"], row["MCQ 2 Option 3"], row["MCQ 2 Option 4"],
        row["MCQ 3 Option 1"], row["MCQ 3 Option 2"], row["MCQ 3 Option 3"], row["MCQ 3 Option 4"]
      ]));

      await db.query("INSERT INTO task (taskId, week, task_owner, task, mcq1, mcq2, mcq3, mcq1_opt1, mcq1_opt2, mcq1_opt3, mcq1_opt4, mcq2_opt1, mcq2_opt2, mcq2_opt3, mcq2_opt4, mcq3_opt1, mcq3_opt2, mcq3_opt3, mcq3_opt4) VALUES ?", [entries]);
      res.status(201).json({ success: true, message: `${entries.length} entries uploaded successfully.` });
    } catch (error) {
      res.status(500).json({ error: "Internal server error." });
    }
  });
};


// 📥 Get All Tasks
exports.getTask = async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM task ORDER BY created_at ASEC");
    res.status(200).json({ success: true, data: results });
  } catch {
    res.status(500).json({ error: "Failed to load tasks." });
  }
};

exports.getTaskByTaskOwner = async (req, res) => {
  try {
    const { child_id, task_owner } = req.params;

    if (!child_id || !task_owner) {
      return res.status(400).json({ error: "Both child_id and task_owner are required." });
    }

    const [results] = await db.query(
      "SELECT * FROM task WHERE child_id = ? AND task_owner = ? ORDER BY week ASC",
      [child_id, task_owner]
    );

    if (!results.length) {
      return res.status(404).json({ success: false, message: "No tasks found for the given child and task owner." });
    }

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("❌ Task fetch error:", err.message);
    res.status(500).json({ error: "Failed to load tasks." });
  }
};




exports.getTasksByWeek = async (req, res) => {
  try {
    const weekNumber = req.params.week; // e.g., "1"
    const exactWeek = `Week ${weekNumber}`;

    const [results] = await db.query(
      "SELECT * FROM task WHERE week = ? ORDER BY week ASC, task_owner ASC",
      [exactWeek]
    );

    if (!results.length) {
      return res.status(404).json({ success: false, message: "No tasks found for this week." });
    }

    res.status(200).json({ success: true, tasks: results });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};




// 🎯 Assign Task to User
exports.assignTaskToChild = async (req, res) => {
  const { taskId, childId, assignedBy } = req.body;

  if (!taskId || !childId || !assignedBy) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // ✅ Check if childId exists
    const [childRows] = await db.execute("SELECT 1 FROM children WHERE childId = ?", [childId]);
    if (childRows.length === 0) {
      return res.status(404).json({ error: "Child not found." });
    }

    // ✅ Assign the task
    const id = uuidv4();
    await db.execute(
      "INSERT INTO task_assignments (id, taskId, childId, assignedBy, status, assigned_at) VALUES (?, ?, ?, ?, 'assigned', NOW())",
      [id, taskId, childId, assignedBy]
    );

    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error("❌ assignTaskToChild - DB error:", err.message);
    res.status(500).json({ error: "Failed to assign task.", details: err.message });
  }
};

// 🔄 Update Task Status
exports.updateTaskStatus = async (req, res) => {
  const { status } = req.body;
  try {
    await db.execute("UPDATE task_assignments SET status = ? WHERE taskId = ?", [status, req.params.taskId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update task status." });
  }
};

// 🧠 Weekly Tasks for User
exports.getWeeklyTasksForUser = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT t.*, a.status FROM task t
      JOIN task_assignments a ON t.taskId = a.taskId
      WHERE a.userId = ? AND WEEK(t.created_at) = WEEK(NOW())
    `, [req.params.userId]);
    res.json({ success: true, tasks: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to load weekly tasks." });
  }
};

// 💬 Submit Task Feedback
exports.submitFeedback = async (req, res) => {
  const { taskId, userId, feedback, rating } = req.body;
  try {
    const id = uuidv4();
    await db.execute(
      `INSERT INTO task_feedback (taskFeedbackId, taskId, userId, feedback, rating, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [id, taskId, userId, feedback, rating]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit feedback." });
  }
};

