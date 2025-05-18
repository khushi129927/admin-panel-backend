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

      await db.query("INSERT INTO task (id, week, task_owner, task, mcq1, mcq2, mcq3, mcq1_opt1, mcq1_opt2, mcq1_opt3, mcq1_opt4, mcq2_opt1, mcq2_opt2, mcq2_opt3, mcq2_opt4, mcq3_opt1, mcq3_opt2, mcq3_opt3, mcq3_opt4) VALUES ?", [entries]);
      res.status(201).json({ success: true, message: `${entries.length} entries uploaded successfully.` });
    } catch (error) {
      res.status(500).json({ error: "Internal server error." });
    }
  });
};


// 📥 Get All Tasks
exports.getTask = async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM task ORDER BY created_at DESC");
    res.status(200).json({ success: true, data: results });
  } catch {
    res.status(500).json({ error: "Failed to load tasks." });
  }
};
