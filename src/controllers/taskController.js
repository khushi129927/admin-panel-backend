// 📁 src/controllers/taskController.js
const db = require("../config/db");
const xlsx = require("xlsx");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

// ✅ Multer Configuration (Secure & Scalable)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB Limit (Adjustable)
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.includes("spreadsheetml") && !file.mimetype.includes("excel")) {
      return cb(new Error("Only Excel files are allowed"), false);
    }
    cb(null, true);
  }
}).single("file");

// 📁 Upload Excel & Insert Tasks (Optimized)
exports.uploadTask = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => (err ? reject(err) : resolve()));
    });

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    if (!rawData.length) {
      return res.status(400).json({ error: "No valid entries found in sheet" });
    }

    const entries = rawData.map((row) => ([
      uuidv4(), row["Week"] || "", row["Task OWNER"] || row["Task Owner"] || "",
      row["TASK"] || "", new Date()
    ]));

    const sql = "INSERT INTO task (id, week, task_owner, task, created_at) VALUES ?";

    await db.execute(sql, [entries]);

    res.status(201).json({
      success: true,
      message: `${entries.length} entries uploaded successfully`
    });
  } catch (error) {
    console.error("❌ Upload Error:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// 📤 Get All Tasks (Optimized)
exports.getTask = async (req, res) => {
  try {
    const [results] = await db.execute("SELECT * FROM task ORDER BY created_at DESC");
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("❌ Get Tasks Error:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
