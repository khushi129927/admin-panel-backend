// ✅ models/taskScoreModel.js
const db = require("../config/db");

// 📦 Create Table
const createTaskScoresTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS task_scores (
      taskScoreId VARCHAR(36) PRIMARY KEY,
      childId VARCHAR(100),
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

// 📝 Insert New Score
const createTaskScore = async (taskScoreId, taskId, childId, taskOwner, mcq1, mcq2, mcq3, totalScore) => {
  const [result] = await db.execute(
    `INSERT INTO task_scores (taskScoreId, taskId, childId, taskOwner, mcq1, mcq2, mcq3, totalScore, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [taskScoreId, taskId, childId, taskOwner, mcq1, mcq2, mcq3, totalScore]
  );
  return result;
};

const getScoresByChild = async (childId) => {
  const [rows] = await db.execute(
    `SELECT * FROM task_scores WHERE childId = ? ORDER BY submitted_at DESC`,
    [childId]
  );
  return rows;
};


// 🔁 Initialize on import
createTaskScoresTable();

module.exports = {
  createTaskScore,
  getScoresByChild,
};
