const db = require("../config/db");
const xlsx = require("xlsx");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("file");

// 📁 Upload Excel & Insert MCQs
exports.uploadTask = (req, res) => {
  upload(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    const entries = rawData.map((row) => ({
      id: uuidv4(),
      mcq1: row["MCQ 1"] || "",
      mcq2: row["MCQ 2"] || "",
      mcq3: row["MCQ 3"] || "",
      mcq1_opt1: row["MCQ 1 Option 1"] || "",
      mcq1_opt2: row["MCQ 1 Option 2"] || "",
      mcq1_opt3: row["MCQ 1 Option 3"] || "",
      mcq1_opt4: row["MCQ 1 Option 4"] || "",
      mcq2_opt1: row["MCQ 2 Option 1"] || "",
      mcq2_opt2: row["MCQ 2 Option 2"] || "",
      mcq2_opt3: row["MCQ 2 Option 3"] || "",
      mcq2_opt4: row["MCQ 2 Option 4"] || "",
      mcq3_opt1: row["MCQ 3 Option 1"] || "",
      mcq3_opt2: row["MCQ 3 Option 2"] || "",
      mcq3_opt3: row["MCQ 3 Option 3"] || "",
      mcq3_opt4: row["MCQ 3 Option 4"] || "",
      week: row["Week"] || "",
      task_owner: row["Task OWNER"] || "",
      task: row["TASK"] || "",
      created_at: new Date()
    }));

    if (!entries.length) return res.status(400).json({ error: "No valid entries found in sheet" });

    const placeholders = entries.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    const values = entries.flatMap(e => [
      e.id, e.mcq1, e.mcq2, e.mcq3,
      e.mcq1_opt1, e.mcq1_opt2, e.mcq1_opt3, e.mcq1_opt4,
      e.mcq2_opt1, e.mcq2_opt2, e.mcq2_opt3, e.mcq2_opt4,
      e.mcq3_opt1, e.mcq3_opt2, e.mcq3_opt3, e.mcq3_opt4,
      e.week, e.task_owner, e.task, e.created_at
    ]);

    const sql = `
      INSERT INTO task (
        id, mcq1, mcq2, mcq3,
        mcq1_opt1, mcq1_opt2, mcq1_opt3, mcq1_opt4,
        mcq2_opt1, mcq2_opt2, mcq2_opt3, mcq2_opt4,
        mcq3_opt1, mcq3_opt2, mcq3_opt3, mcq3_opt4,
        week, task_owner, task, created_at
      ) VALUES ${placeholders}
    `;

    db.query(sql, values, (err) => {
      if (err) {
        console.error("❌ SQL Upload Error:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ success: true, message: `${entries.length} entries uploaded successfully` });
    });
  });
};


// 📤 Get All
exports.getTask = (req, res) => {
  const sql = `SELECT * FROM task ORDER BY created_at DESC`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ success: true, data: results });
  });
};

// 📤 Test Database Connection
exports.testDatabase = (req, res) => {
  const sql = "SELECT 1 + 1 AS result";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Database test error:", err.message);
      return res.status(500).json({ error: "Database connection failed" });
    }
    res.status(200).json({ success: true, message: "Database connected successfully", result: result });
  });
};
