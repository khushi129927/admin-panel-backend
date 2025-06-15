// ✅ models/taskScoreModel.js
const db = require("../config/db");

// ⚙️ Ensure task_scores table exists
const initializeTaskScoreTable = async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS task_scores (
      scoreId VARCHAR(255) PRIMARY KEY,
      taskId VARCHAR(255) NOT NULL,
      userId VARCHAR(255) NOT NULL,
      score INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES task(taskId) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
    )
  `);
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
