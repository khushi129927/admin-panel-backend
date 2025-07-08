const db = require("../config/db");

const createEqScoresTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS eq_scores (
      eqScoreId VARCHAR(36) PRIMARY KEY,
      childId VARCHAR(100),
      percentile FLOAT,
      createdAt DATETIME
    )
  `;

  try {
    await db.query(createTableQuery);
    console.log("✅ eq_scores table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating eq_scores table:", err.message);
  }
};

createEqScoresTable();