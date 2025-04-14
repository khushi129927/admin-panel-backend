const db = require("../config/db");
const xlsx = require("xlsx");
const { v4: uuidv4 } = require("uuid");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("file");

exports.addQuestion = (req, res) => {
  const { question, answer, category, age_group } = req.body;

  if (!question || !answer || !category || !age_group) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const checkSql = "SELECT * FROM content WHERE question = ?";
  db.query(checkSql, [question.trim()], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length > 0) {
      return res.status(400).json({ error: "This question already exists" });
    }

    const id = uuidv4();

    const insertSql = `
      INSERT INTO content (id, question, answer, category, age_group)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      insertSql,
      [id, question.trim(), answer.trim(), category.trim(), age_group.trim()],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        res.status(201).json({ success: true, message: "Question added successfully" });
      }
    );
  });
};

exports.editQuestion = (req, res) => {
  const { question, newQuestion, newAnswer } = req.body;

  const sql = "UPDATE content SET question = ?, answer = ? WHERE question = ?";
  db.query(sql, [newQuestion, newAnswer, question], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Original question not found" });
    }

    res.status(200).json({ success: true, message: "Question updated" });
  });
};
  
exports.deleteQuestion = (req, res) => {
  const { question } = req.body;

  const sql = "DELETE FROM content WHERE question = ?";
  db.query(sql, [question], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.status(200).json({ success: true, message: "Question deleted" });
  });
};

exports.getContent = (req, res) => {
  const sql = "SELECT question, answer, category, age_group FROM content ORDER BY created_at DESC";

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    res.status(200).json({ success: true, data: results });
  });
};

exports.uploadContent = (req, res) => {
  console.log("Upload route hit!");

  upload(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const seen = new Set();
    const uniqueFromSheet = [];

    rawData.forEach((row) => {
      const question = row.question?.trim();
      if (question && !seen.has(question)) {
        seen.add(question);
        uniqueFromSheet.push(row);
      }
    });

    const questionsOnly = uniqueFromSheet.map((row) => row.question.trim());

    if (questionsOnly.length === 0) {
      return res.status(400).json({ error: "No valid questions found in sheet" });
    }

    const placeholders = questionsOnly.map(() => "?").join(",");
    const checkSql = `SELECT question FROM Content WHERE question IN (${placeholders})`;

    db.query(checkSql, questionsOnly, (err, existingRows) => {
      if (err) return res.status(500).json({ error: err.message });

      const existingQuestions = new Set(existingRows.map((r) => r.question.trim()));
      const toInsert = uniqueFromSheet.filter((row) => !existingQuestions.has(row.question.trim()));

      if (toInsert.length === 0) {
        return res.status(200).json({ message: "All questions already exist. Nothing to upload." });
      }

      const currentTimestamp = new Date(); 

      const sql = `
        INSERT INTO Content (id, question, answer, category, age_group, created_at)
        VALUES ?
      `;
      const values = toInsert.map((row) => [
        uuidv4(),
        row.question.trim(),
        row.answer,
        row.category,
        row.age_group,
        currentTimestamp, 
      ]);

      db.query(sql, [values], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
          success: true,
          message: `${toInsert.length} unique questions uploaded successfully`,
        });
      });
    });
  });
};
