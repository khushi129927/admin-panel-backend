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
        row["Week"],
        row["Task OWNER"],
        row["TASK"],
        row["MCQ 1"],
        row["MCQ 2"],
        row["MCQ 3"],
        row["MCQ 1 Option 1"],
        row["MCQ 1 Option 2"],
        row["MCQ 1 Option 3"],
        row["MCQ 1 Option 4"],
        row["MCQ 2 Option 1"],
        row["MCQ 2 Option 2"],
        row["MCQ 2 Option 3"],
        row["MCQ 2 Option 4"],
        row["MCQ 3 Option 1"],
        row["MCQ 3 Option 2"],
        row["MCQ 3 Option 3"],
        row["MCQ 3 Option 4"],
        row["Age Group"]  // ✅ New field
      ]));

      await db.query(`
        INSERT INTO task (
          taskId, week, task_owner, task, mcq1, mcq2, mcq3,
          mcq1_opt1, mcq1_opt2, mcq1_opt3, mcq1_opt4,
          mcq2_opt1, mcq2_opt2, mcq2_opt3, mcq2_opt4,
          mcq3_opt1, mcq3_opt2, mcq3_opt3, mcq3_opt4,
          age_group
        ) VALUES ?`, [entries]);

      res.status(201).json({ success: true, message: `${entries.length} entries uploaded successfully.` });
    } catch (error) {
      console.error("Upload Error:", error.message);
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

exports.getTasksByTaskOwner = async (req, res) => {
  try {
    let { userId, task_owner, week } = req.params;

    // Normalize task_owner
    task_owner = task_owner.toLowerCase();
    if (task_owner === "father") task_owner = "Father’s Task"; // ← notice the curly ’
    else if (task_owner === "mother") task_owner = "Mother’s Task";
    else if (task_owner === "combined") task_owner = "Combined Task";


    if (!userId || !task_owner || !week) {
      return res.status(400).json({ error: "userId, task_owner, and week are required." });
    }

    // Get children of the user
    const [children] = await db.query(
      "SELECT childId, name, dob FROM children WHERE userId = ?",
      [userId]
    );

    if (!children.length) {
      return res.status(404).json({ success: false, message: "No children found for this user." });
    }

    // Determine age_group from age
    const today = new Date();
    const childrenWithAgeGroup = children.map((child) => {
      const dob = new Date(child.dob);
      const age = today.getFullYear() - dob.getFullYear() - 
        (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);

      let age_group = "";
      if (age >= 4 && age <= 6) age_group = "4yrs to 6 yrs";
      else if (age >= 7 && age <= 9) age_group = "7yrs to 9 yrs";
      else if (age >= 10 && age <= 12) age_group = "10yrs to 12 yrs";
      else age_group = "13+";

      return { ...child, age, age_group };
    });

    // Construct exact week string
    const exactWeek = `Week ${parseInt(week)}`;

    const data = [];

    for (const child of childrenWithAgeGroup) {
      const [tasks] = await db.query(
        "SELECT * FROM task WHERE task_owner = ? AND week = ? AND age_group = ? ORDER BY week ASC",
        [task_owner, exactWeek, child.age_group]
      );

      data.push({
        childId: child.childId,
        name: child.name,
        age: child.age,
        age_group: child.age_group,
        tasks,
      });
    }

    res.status(200).json({ success: true, data });

  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: "Internal server error.", details: err.message });
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

    // Remove all text inside parentheses (e.g., "(10/10)", "(6 points)")
    const cleanText = text => text?.replace(/\s*\(.*?\)/g, "").trim();

    const sanitizedTasks = results.map(task => ({
      ...task,
      mcq1: cleanText(task.mcq1),
      mcq2: cleanText(task.mcq2),
      mcq3: cleanText(task.mcq3),
      mcq1_opt1: cleanText(task.mcq1_opt1),
      mcq1_opt2: cleanText(task.mcq1_opt2),
      mcq1_opt3: cleanText(task.mcq1_opt3),
      mcq1_opt4: cleanText(task.mcq1_opt4),
      mcq2_opt1: cleanText(task.mcq2_opt1),
      mcq2_opt2: cleanText(task.mcq2_opt2),
      mcq2_opt3: cleanText(task.mcq2_opt3),
      mcq2_opt4: cleanText(task.mcq2_opt4),
      mcq3_opt1: cleanText(task.mcq3_opt1),
      mcq3_opt2: cleanText(task.mcq3_opt2),
      mcq3_opt3: cleanText(task.mcq3_opt3),
      mcq3_opt4: cleanText(task.mcq3_opt4),
    }));

    res.status(200).json({ success: true, tasks: sanitizedTasks });
  } catch (err) {
    console.error("❌ Error in getTasksByWeek:", err.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};



exports.getCompletedTasksByChildId = async (req, res) => {
  const { childId } = req.params;

  if (!childId) {
    return res.status(400).json({ error: "'childId' is required." });
  }

  try {
    const [rows] = await db.execute(
      `SELECT ts.*, t.task, t.age_group, ta.status
       FROM task_scores ts
       JOIN task t ON ts.taskId = t.taskId
       JOIN task_assignments ta ON ts.taskId = ta.taskId
       WHERE ta.childId = ? AND ts.childId = ? AND ta.status = 'completed'
       ORDER BY ts.submitted_at DESC`,
      [childId, childId]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("❌ Error fetching completed tasks:", error.message);
    res.status(500).json({ error: "Failed to retrieve completed tasks." });
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

