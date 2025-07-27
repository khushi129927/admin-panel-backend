// analyticsController.js
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

exports.submitEqScore = async (req, res) => {
  const { childId, percentile } = req.body;
  const eqScoreId = uuidv4();
  const createdAt = new Date();

  try {
    await db.query(
      `INSERT INTO eq_scores (eqScoreId, childId, percentile, createdAt)
       VALUES (?, ?, ?, ?)`,
      [eqScoreId, childId, percentile, createdAt]
    );
    res.status(200).json({ message: "EQ score submitted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to insert EQ score.", details:err.message });
  }
};


// 1. Get EQ Trend Line
exports.getEqTrend = async (req, res) => {
  const { childId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT percentile, createdAt FROM eq_scores WHERE childId = ? ORDER BY createdAt ASC',
      [childId]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addSchoolMarks = async (req, res) => {
  const { childId, subject, marks, maxMarks, examType, examDate } = req.body;

  if (!childId || !subject || marks == null || !examDate) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const markId = uuidv4();

  try {
    const query = `
      INSERT INTO school_marks (markId, childId, subject, marks, maxMarks, examType, examDate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(query, [
      markId,
      childId,
      subject,
      marks,
      maxMarks || null,
      examType || null,
      examDate,
    ]);

    res.status(201).json({ success: true, message: "Marks added successfully" });
  } catch (err) {
    console.error("❌ Error adding marks:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 2. Get School Marks Trend
exports.getSchoolMarksTrend = async (req, res) => {
  const { childId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT subject, marks, maxMarks, examType, examDate FROM school_marks WHERE childId = ? ORDER BY examDate ASC',
      [childId]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitAchievement = async (req, res) => {
  const { childId, category, description, rank, dateAchieved } = req.body;
  const achievementId = uuidv4();

  try {
    await db.query(
      `INSERT INTO achievements (achievementId, childId, category, description, \`rank\`, dateAchieved)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [achievementId, childId, category, description, rank, dateAchieved]
    );
    res.status(200).json({ message: "Achievement submitted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to insert achievement.", details:err.message });
  }
};


// 3. Get Achievement Trend
exports.getAchievements = async (req, res) => {
  const { childId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT category, description, `rank`, dateAchieved FROM achievements WHERE childId = ? ORDER BY dateAchieved ASC',
      [childId]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Get Number of Tasks Completed
exports.getTaskCompletionCount = async (req, res) => {
  const { childId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS totalTasks FROM task_scores WHERE childId = ?',
      [childId]
    );
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
