const db = require("../config/db");
const xlsx = require("xlsx");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("file");

// 📁 Upload Excel & Insert Test Questions (All Sheets)
exports.uploadTestQuestions = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    let allEntries = [];

    // Loop through all sheets
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rawData = xlsx.utils.sheet_to_json(sheet);

      if (rawData.length) {
        const entries = rawData.map((row) => ([
          uuidv4(),
          (row.Quarter || "").trim(),
          (row.Age || "").trim(),
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

        allEntries.push(...entries);
      }
    });

    if (!allEntries.length) {
      return res.status(400).json({ error: "No valid entries found in sheet(s)" });
    }

    // ✅ Prevent duplicates before inserting
    // Convert each row into a unique key (Quarter+Age+Question)
    const uniqueMap = new Map();
    allEntries.forEach((entry) => {
      const key = `${entry[1]}-${entry[2]}-${entry[4]}`.toLowerCase(); 
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, entry);
      }
    });

    const finalEntries = Array.from(uniqueMap.values());

    const sql = `INSERT INTO tests (
      testId, quarter, age, objective, question,
      option1, points1, option2, points2,
      option3, points3, option4, points4,
      created_at
    ) VALUES ?`;

    try {
      await db.query(sql, [finalEntries]);
    } catch (dbError) {
      console.error("❌ Database Error:", dbError.message);
      return res.status(500).json({ error: "Database Error", details: dbError.message });
    }

    res.status(201).json({ 
      success: true, 
      message: `${finalEntries.length} unique questions uploaded successfully` 
    });

  } catch (error) {
    console.error("❌ Upload Error:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};


// 📤 Get All Tests (Async/Await)
exports.getTests = async (req, res) => {
  try {
    const [results] = await db.execute(`SELECT * FROM tests ORDER BY created_at DESC`);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("❌ Get Tests Error:", error.message);
    console.error(error.stack);
    res.status(500).json({ error: "Failed to get test questions." });
  }
};

// 📁 Fetch Tests According to Child's Age
exports.getTestsByAge = async (req, res) => {
  try {
    const { age } = req.params; // e.g. "13-15 years"

    if (!age) {
      return res.status(400).json({ error: "Age is required" });
    }

    const sql = `
      SELECT * FROM tests 
      WHERE age = ? 
      ORDER BY quarter
    `;

    const [rows] = await db.query(sql, [age]);

    if (!rows.length) {
      return res.status(404).json({ message: "No tests found for this age group" });
    }

    res.status(200).json({ success: true, data: rows });

  } catch (error) {
    console.error("❌ Fetch Error:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};


exports.getTestsByQuarterOnly = async (req, res) => {
  try {
    const [results] = await db.execute(
      "SELECT * FROM tests WHERE quarter = ? ORDER BY created_at DESC",
      [req.params.quarter]
    );
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("❌ Get Tests by Quarter Error:", error.message);
    res.status(500).json({ error: "Failed to get test questions." });
  }
};

exports.getTestsByAgeAndQuarter = async (req, res) => {
  let { age, quarter } = req.body;

  if (!age || !quarter) {
    return res.status(400).json({ error: "Both age and quarter are required." });
  }

  // --- Normalize Age ---
  age = age.replace(/–/g, "-").trim(); // replace en-dash with hyphen
  const isSingleAge = /^\d+$/.test(age); // true if input is just a number like "8"

  // --- Normalize Quarter ---
  if (/^Quarter\s*\d+$/i.test(quarter)) {
    quarter = "Q" + quarter.split(" ")[1];
  }

  try {
    let finalAgeGroup = null;

    if (isSingleAge) {
      const [ageGroups] = await db.execute("SELECT DISTINCT age FROM tests");

      const inputAge = parseInt(age, 10);

      for (let row of ageGroups) {
        const rangeStr = row.age.toString().toLowerCase().replace(/–/g, "-");
        const match = rangeStr.match(/(\d+)\s*-\s*(\d+)/); // match "7-9"
        if (match) {
          const min = parseInt(match[1], 10);
          const max = parseInt(match[2], 10);
          if (inputAge >= min && inputAge <= max) {
            finalAgeGroup = row.age; // use DB's stored format (e.g., "7-9 years")
            break;
          }
        }
      }

      if (!finalAgeGroup) {
        return res.status(404).json({
          success: false,
          message: `No age group found for age ${age}`,
        });
      }
    } else {
      // If range provided like "7-9" or "7-9 years"
      finalAgeGroup = age.toLowerCase().includes("years") ? age : `${age} years`;
    }

    // --- Fetch Tests ---
    const [results] = await db.execute(
      `SELECT * FROM tests 
       WHERE REPLACE(LOWER(age), '–', '-') = ? 
       AND quarter = ? 
       ORDER BY created_at DESC`,
      [finalAgeGroup.toLowerCase(), quarter]
    );

    res.status(200).json({
      success: true,
      message: `Tests for Age ${finalAgeGroup} and Quarter ${quarter}`,
      data: results,
    });
  } catch (error) {
    console.error("❌ Get Tests by Age & Quarter Error:", error.message);
    res.status(500).json({ error: "Failed to get test questions." });
  }
};

