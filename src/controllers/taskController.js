// 📁 src/controllers/taskController.js
const db = require("../config/db");
const xlsx = require("xlsx");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("file");

// 📁 Optimized Upload Excel & Insert MCQs
exports.uploadTask = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        console.error("❌ Multer Error:", err.message);
        return res.status(400).json({ error: err.message });
      }
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = xlsx.utils.sheet_to_json(sheet);

      if (!rawData.length) return res.status(400).json({ error: "No valid entries found in sheet" });

      const entries = rawData.map((row) => ([
        uuidv4(),
        row["MCQ 1"] || "",
        row["MCQ 2"] || "",
        row["MCQ 3"] || "",
        row["MCQ 1 Option 1"] || "",
        row["MCQ 1 Option 2"] || "",
        row["MCQ 1 Option 3"] || "",
        row["MCQ 1 Option 4"] || "",
        row["MCQ 2 Option 1"] || "",
        row["MCQ 2 Option 2"] || "",
        row["MCQ 2 Option 3"] || "",
        row["MCQ 2 Option 4"] || "",
        row["MCQ 3 Option 1"] || "",
        row["MCQ 3 Option 2"] || "",
        row["MCQ 3 Option 3"] || "",
        row["MCQ 3 Option 4"] || "",
        row["Week"] || "",
        row["Task OWNER"] || "",
        row["TASK"] || "",
        new Date()
      ]));

      const batchSize = 1000;
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
        const values = batch.flat();

        const sql = `
          INSERT INTO task (
            id, mcq1, mcq2, mcq3,
            mcq1_opt1, mcq1_opt2, mcq1_opt3, mcq1_opt4,
            mcq2_opt1, mcq2_opt2, mcq2_opt3, mcq2_opt4,
            mcq3_opt1, mcq3_opt2, mcq3_opt3, mcq3_opt4,
            week, task_owner, task, created_at
          ) VALUES ${placeholders}
        `;

        try {
          await db.query(sql, values);
          console.log(`✅ Batch ${i / batchSize + 1} inserted successfully`);
        } catch (error) {
          console.error("❌ SQL Upload Error:", error.message);
          return res.status(500).json({ error: "Failed to insert batch. " + error.message });
        }
      }

      res.status(201).json({ success: true, message: `${entries.length} entries uploaded successfully` });
    });
  } catch (error) {
    console.error("❌ Upload Task Error:", error.message);
    res.status(500).json({ error: "Server error while uploading tasks" });
  }
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
