// 📁 src/controllers/taskController.js
const db = require("../config/db");
const xlsx = require("xlsx");
const { v4: uuidv4 } = require("uuid");

// ✅ Enhanced Upload Task with Error Logs
exports.uploadTask = async (req, res) => {
  try {
    if (!req.file) {
      console.error("❌ No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    // ✅ Read Excel File
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet);

    if (!rawData.length) {
      console.error("❌ No valid entries in the Excel file");
      return res.status(400).json({ error: "No valid entries found in sheet" });
    }

    // ✅ Map Data for Database (Case-Insensitive)
    const entries = rawData.map((row) => ([
      uuidv4(),
      row["MCQ 1"] || row["mcq1"] || "",
      row["MCQ 2"] || row["mcq2"] || "",
      row["MCQ 3"] || row["mcq3"] || "",
      row["MCQ 1 Option 1"] || row["mcq1_opt1"] || "",
      row["MCQ 1 Option 2"] || row["mcq1_opt2"] || "",
      row["MCQ 1 Option 3"] || row["mcq1_opt3"] || "",
      row["MCQ 1 Option 4"] || row["mcq1_opt4"] || "",
      row["MCQ 2 Option 1"] || row["mcq2_opt1"] || "",
      row["MCQ 2 Option 2"] || row["mcq2_opt2"] || "",
      row["MCQ 2 Option 3"] || row["mcq2_opt3"] || "",
      row["MCQ 2 Option 4"] || row["mcq2_opt4"] || "",
      row["MCQ 3 Option 1"] || row["mcq3_opt1"] || "",
      row["MCQ 3 Option 2"] || row["mcq3_opt2"] || "",
      row["MCQ 3 Option 3"] || row["mcq3_opt3"] || "",
      row["MCQ 3 Option 4"] || row["mcq3_opt4"] || "",
      row["Week"] || row["week"] || "",
      row["Task OWNER"] || row["task_owner"] || "",
      row["TASK"] || row["task"] || "",
      new Date()
    ]));

    console.log("✅ Entries Prepared:", entries.length);

    // ✅ Database Query (Error Logging)
    const sql = `
      INSERT INTO task (
        id, mcq1, mcq2, mcq3,
        mcq1_opt1, mcq1_opt2, mcq1_opt3, mcq1_opt4,
        mcq2_opt1, mcq2_opt2, mcq2_opt3, mcq2_opt4,
        mcq3_opt1, mcq3_opt2, mcq3_opt3, mcq3_opt4,
        week, task_owner, task, created_at
      ) VALUES ?`;

    await db.execute(sql, [entries]);
    console.log("✅ Data Inserted Successfully");
    res.status(201).json({ success: true, message: `${entries.length} entries uploaded successfully` });
  } catch (error) {
    console.error("❌ Upload Error:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

// 📤 Get All Tasks (Async/Await)
exports.getTask = async (req, res) => {
  try {
    const [results] = await db.execute(`SELECT * FROM task ORDER BY created_at DESC`);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("❌ Get Tasks Error:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
