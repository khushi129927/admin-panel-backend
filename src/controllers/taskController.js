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

      const entries = rawData.map((row) => ([uuidv4(), row["Task OWNER"], row["TASK"], row["Week"]]));
      if (!entries.length) return res.status(400).json({ error: "No valid entries found." });

      await db.query("INSERT INTO task (id, task_owner, task, week) VALUES ?", [entries]);
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
