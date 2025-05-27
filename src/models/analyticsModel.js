const db = require("../config/db");

const createAnalyticsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS user_analytics (
      userId VARCHAR(36) PRIMARY KEY,
      total_tasks_completed INT DEFAULT 0,
      avg_eq_score FLOAT DEFAULT 0,
      last_test_taken TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(userId)
    )`;
  try {
    await db.query(query);
    console.log("✅ Analytics table ready.");
  } catch (err) {
    console.error("❌ Analytics table error:", err.message);
  }
};

createAnalyticsTable();
