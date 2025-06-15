// ✅ models/taskScoreModel.js
const db = require("../config/db");

const createTaskScoresTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS task_scores (
      taskScoreId VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(100),
      taskId VARCHAR(100),
      taskOwner VARCHAR(50),
      mcq1 VARCHAR(50),
      mcq2 VARCHAR(50),
      mcq3 VARCHAR(50),
      totalScore INT,
      submitted_at DATETIME
    )`;

  try {
    await db.query(createTableQuery);
    console.log("✅ task_scores table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating task_scores table:", err.message);
  }
};

const createTaskScore = async (scoreId, taskId, userId, score) => {
  const [result] = await db.execute(
    `INSERT INTO task_scores (scoreId, taskId, userId, score, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [scoreId, taskId, userId, score]
  );
  return result;
};

const getScoresByUser = async (userId) => {
  const [rows] = await db.execute(
    `SELECT * FROM task_scores WHERE userId = ? ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
};

// Run table initialization on import
initializeTaskScoreTable();

module.exports = {
  createTaskScore,
  getScoresByUser,
};
