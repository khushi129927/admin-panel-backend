// 📂 controllers/testController.js
const db = require("../config/db");
const xlsx = require("xlsx");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

// ✅ Configure Multer (Same as taskController)
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("file");

// 🚀 Optimized Upload Test Questions (Async/Await with Batching)
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
        return res.status(400).json({ 
          error: `File is missing required columns: ${missingColumns.join(", ")}` 
        });
      }

      // ✅ Map formatted Excel columns to database fields
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

      if (!tests.length) return res.status(400).json({ error: "No valid test questions found." });

      // ✅ Batched Insertion (500 rows per batch to prevent overload)
      const batchSize = 500;
      for (let i = 0; i < tests.length; i += batchSize) {
        const batch = tests.slice(i, i + batchSize);
        const sql = `
          INSERT INTO tests (
            id, quarter, age, objective, question,
            option1, points1, option2, points2, 
            option3, points3, option4, points4, created_at
          ) VALUES ?
        `;
        await db.execute(sql, [batch]);
      }

      res.status(201).json({ success: true, message: `${tests.length} questions uploaded.` });
    });
  } catch (error) {
    console.error("❌ Upload Error:", error);
    res.status(500).json({ error: "Failed to upload test questions." });
  }
};

// 📤 Get All Tests (Async/Await, Consistent Structure)
exports.getTests = async (req, res) => {
  try {
    const [results] = await db.execute(`SELECT * FROM tests ORDER BY created_at DESC`);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("❌ Get Tests Error:", error.message);
    res.status(500).json({ error: "Failed to get test questions." });
  }
};
