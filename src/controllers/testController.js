// 📂 controllers/testController.js
const db = require("../config/db");
const xlsx = require("xlsx");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// ✅ Logging Errors to a File (for debugging)
const logErrorToFile = (error) => {
  const logFile = path.join(__dirname, "../logs/error.log");
  const errorMessage = `[${new Date().toISOString()}] ${error.stack || error}\n\n`;
  fs.appendFileSync(logFile, errorMessage);
};

// ✅ Configure Multer
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("file");

// 📁 Upload Excel & Insert MCQs (Optimized with async/await)
exports.uploadTestQuestions = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        console.error("❌ Multer Error:", err);
        logErrorToFile(err);
        return res.status(400).json({ error: "File upload failed." });
      }

      if (!req.file) {
        console.error("❌ No file uploaded.");
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = xlsx.utils.sheet_to_json(sheet);

      if (!rawData.length) {
        console.error("❌ No valid entries found in sheet.");
        return res.status(400).json({ error: "No valid entries found in sheet" });
      }

      console.log("✅ Processing Excel rows:", rawData.length);

      const entries = rawData.map((row) => ([
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

      console.log("✅ Prepared entries for database:", entries.length);

      const sql = `
        INSERT INTO test (
          id, quarter, age, objective, question,
          option1, points1,
          option2, points2,
          option3, points3,
          option4, points4,
          created_at
        ) VALUES ?`;

      // ✅ Execute Batch Insert with Error Handling
      await db.execute(sql, [entries])
        .then(() => {
          console.log("✅ Successfully uploaded questions:", entries.length);
          res.status(201).json({ success: true, message: `${entries.length} questions uploaded successfully` });
        })
        .catch((dbError) => {
          console.error("❌ Database Error:", dbError);
          logErrorToFile(dbError);
          res.status(500).json({ error: "Database Error: Failed to save test questions." });
        });
    });
  } catch (error) {
    console.error("❌ General Error:", error);
    logErrorToFile(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 📤 Get All Tests (Async/Await)
exports.getTests = async (req, res) => {
  try {
    const [results] = await db.execute(`SELECT * FROM test ORDER BY created_at DESC`);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("❌ Get Tests Error:", error.message);
    logErrorToFile(error);
    res.status(500).json({ error: "Failed to get test questions." });
  }
};
