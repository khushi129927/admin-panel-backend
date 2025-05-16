const db = require("../config/db");
const xlsx = require("xlsx");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("file");

// 📁 Upload Excel & Insert MCQs (Optimized with async/await)
exports.uploadTask = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
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

      const sql = 
        INSERT INTO task (
          id, mcq1, mcq2, mcq3,
          mcq1_opt1, mcq1_opt2, mcq1_opt3, mcq1_opt4,
          mcq2_opt1, mcq2_opt2, mcq2_opt3, mcq2_opt4,
          mcq3_opt1, mcq3_opt2, mcq3_opt3, mcq3_opt4,
          week, task_owner, task, created_at
        ) VALUES ?;

      await db.execute(sql, [entries]);
      res.status(201).json({ success: true, message: ${entries.length} entries uploaded successfully });
    });
  } catch (error) {
    console.error("❌ Upload Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 📤 Get All Tasks (Async/Await)
exports.getTask = async (req, res) => {
  try {
    const [results] = await db.execute(SELECT * FROM task ORDER BY created_at DESC);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("❌ Get Tasks Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};