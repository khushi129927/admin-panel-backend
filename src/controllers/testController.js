// 📂 controllers/testController.js
const db = require("../config/db");
const xlsx = require("xlsx");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

// ✅ Configure Multer with Increased Size Limit (20MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
}).single("file");

// 🚀 Optimized Upload Test Questions (Async/Await)
exports.uploadTestQuestions = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = xlsx.utils.sheet_to_json(sheet);

      if (!rawData.length) return res.status(400).json({ error: "The uploaded file is empty." });

      // ✅ Validate columns
      const requiredColumns = [
        "Quarter", "Age", "Objective", "Question", 
        "Option 1", "Points 1", 
        "Option 2", "Points 2", 
        "Option 3", "Points 3", 
        "Option 4", "Points 4"
      ];
      const fileColumns = Object.keys(rawData[0]);
      const missingColumns = requiredColumns.filter(col => !fileColumns.includes(col));

      if (missingColumns.length > 0) {
        console.error("❌ Missing columns:", missingColumns);
        return res.status(400).json({ 
          error: `File is missing required columns: ${missingColumns.join(", ")}` 
        });
      }

      // ⚡ Map formatted Excel columns to database fields
      const tests = rawData.map(row => ([
        uuidv4(),
        row.Quarter || "",
        row.Age || "",
        row.Objective || "",
        row.Question || "",
        row["Option 1"] || "",
        row["Points 1"] || "",
        row["Option 2"] || "",
        row["Points 2"] || "",
        row["Option 3"] || "",
        row["Points 3"] || "",
        row["Option 4"] || "",
        row["Points 4"] || "",
        new Date()
      ]));

      const sql = `
        INSERT INTO tests (
          id, quarter, age, objective, question,
          option1, points1, option2, points2, 
          option3, points3, option4, points4, created_at
        ) VALUES ?
      `;

      await db.execute(sql, [tests]);
      res.status(201).json({ success: true, message: `${tests.length} questions uploaded.` });
    });
  } catch (err) {
    console.error("❌ Upload Error:", err.message);
    res.status(500).json({ error: "Failed to upload test questions." });
  }
};

// 📤 Get All Tests (Async/Await)
exports.getTests = async (req, res) => {
  try {
    const [results] = await db.execute(`SELECT * FROM tests ORDER BY created_at DESC`);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("❌ Get Tests Error:", error.message);
    res.status(500).json({ error: "Failed to get test questions." });
  }
};

// 📤 Test Database Connection (Async/Await)
exports.testDatabase = async (req, res) => {
  try {
    const [result] = await db.execute("SELECT 1 + 1 AS result");
    res.status(200).json({ success: true, message: "Database connected successfully", result: result });
  } catch (error) {
    console.error("❌ Database test error:", error.message);
    res.status(500).json({ error: "Database connection failed" });
  }
};
