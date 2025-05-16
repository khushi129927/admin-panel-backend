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
    // ✅ Allow only Excel files (.xlsx, .xls)
    if (!file.mimetype.includes("spreadsheetml") && !file.mimetype.includes("excel")) {
      return cb(new Error("Only Excel files are allowed"), false);
    }
    cb(null, true);
  }
}).single("file");

// 📁 Upload Excel & Insert MCQs (Optimized)
exports.uploadTask = async (req, res) => {
  try {
    // ✅ Promisified Multer Upload
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => (err ? reject(err) : resolve()));
    });

    // ✅ Validate File
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // ✅ Read Excel File
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    if (!rawData.length) {
      return res.status(400).json({ error: "No valid entries found in sheet" });
    }

    // ✅ Prepare Entries for Bulk Insertion
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
      row["Task OWNER"] || row["Task Owner"] || "",
      row["TASK"] || "",
      new Date()
    ]));

    // ✅ Bulk Insert Query (Fast)
    const sql = `
      INSERT INTO task (
        id, mcq1, mcq2, mcq3,
        mcq1_opt1, mcq1_opt2, mcq1_opt3, mcq1_opt4,
        mcq2_opt1, mcq2_opt2, mcq2_opt3, mcq2_opt4,
        mcq3_opt1, mcq3_opt2, mcq3_opt3, mcq3_opt4,
        week, task_owner, task, created_at
      ) VALUES ?`;

    // ✅ Execute Bulk Insert
    await db.execute(sql, [entries]);

    // ✅ Success Response
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
