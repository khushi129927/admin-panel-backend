// 📂 controllers/testController.js
const db = require("../config/db");
const xlsx = require("xlsx");
const { v4: uuidv4 } = require("uuid");

// 🚀 Optimized Upload Handler with Enhanced Error Logging
exports.uploadTestQuestions = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    // ✅ Check if the file has valid data
    if (!rawData.length) {
      console.error("❌ Excel file is empty.");
      return res.status(400).json({ error: "The uploaded file is empty." });
    }

    // ✅ Validate columns
    const requiredColumns = ["Quarter", "Age", "Objective", "Question", "Option 1", "Points 1", "Option 2", "Points 2", "Option 3", "Points 3", "Option 4", "Points 4"];
    const fileColumns = Object.keys(rawData[0]);
    const missingColumns = requiredColumns.filter(col => !fileColumns.includes(col));

    if (missingColumns.length > 0) {
      console.error("❌ Missing columns:", missingColumns);
      return res.status(400).json({ 
        error: `File is missing required columns: ${missingColumns.join(", ")}` 
      });
    }

    // ⚡ Directly map the formatted Excel columns to database fields
    const tests = rawData.map(row => [
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
    ]);

    if (!tests.length) {
      console.error("❌ No valid test questions found in the file.");
      return res.status(400).json({ error: "No valid test questions found." });
    }

    const placeholders = tests.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(",");
    const values = tests.flat();

    const sql = `
      INSERT INTO tests (
        id, quarter, age, objective, question,
        option1, points1, option2, points2, option3, points3, option4, points4, created_at
      ) VALUES ${placeholders}
    `;

    db.query(sql, values, (err) => {
      if (err) {
        console.error("❌ Database Error:", err.message);
        return res.status(500).json({ error: "Failed to save test questions." });
      }
      res.status(201).json({ success: true, message: `${tests.length} questions uploaded.` });
    });

  } catch (err) {
    console.error("❌ Failed to process Excel file:", err);
    res.status(500).json({ error: "Failed to process Excel file." });
  }
};


// 📤 Get All Tests
exports.getTests = (req, res) => {
  const sql = `SELECT * FROM tests ORDER BY created_at DESC`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ success: true, data: results });
  });
};
