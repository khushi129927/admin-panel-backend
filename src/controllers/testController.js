// 📂 controllers/testController.js
const db = require("../config/db");
const xlsx = require("xlsx");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

// ✅ Configure Multer with Memory Storage
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("file");

// ✅ Helper Function for Batch Insert
async function insertTestQuestions(tests) {
  const batchSize = 500; // Set the batch size (adjust based on your server capacity)
  for (let i = 0; i < tests.length; i += batchSize) {
    const batch = tests.slice(i, i + batchSize);
    const sql = `
      INSERT INTO test (
        id, quarter, age, objective, question,
        option1, points1, option2, points2,
        option3, points3, option4, points4, created_at
      ) VALUES ?
    `;
    await db.execute(sql, [batch]);
  }
}

// ✅ Optimized Upload Test Questions (Async/Await with Chunking)
exports.uploadTestQuestions = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = xlsx.utils.sheet_to_json(sheet);

      if (!rawData.length) return res.status(400).json({ error: "The uploaded file is empty." });

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

      if (!entries.length) return res.status(400).json({ error: "No valid test questions found." });

      // ✅ Use Batch Insert
      await insertTestQuestions(entries);

      res.status(201).json({ success: true, message: `${entries.length} questions uploaded successfully.` });
    } catch (error) {
      console.error("❌ Upload Error:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
};

// 📤 Get All Tests (Async/Await)
exports.getTests = async (req, res) => {
  try {
    const [results] = await db.execute(`SELECT * FROM test ORDER BY created_at DESC`);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("❌ Get Tests Error:", error.message);
    res.status(500).json({ error: "Failed to get test questions." });
  }
};
