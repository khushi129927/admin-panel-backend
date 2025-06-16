const db = require("../config/db");

const createTestScoreTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS test_scores (
      scoreId VARCHAR(36) PRIMARY KEY,
      childId VARCHAR(100),
      age VARCHAR(100),
      quarter VARCHAR(100),
      totalScore NUMERIC,
      submitted_at DATETIME
    )`;

  try {
    await db.query(createTableQuery);
    console.log("✅ test_scores table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating test_scores table:", err.message);
  }
};

createTestScoreTable();

module.exports = db;
