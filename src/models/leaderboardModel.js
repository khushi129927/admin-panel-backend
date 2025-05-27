const db = require("../config/db");

const createLeaderboardTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS leaderboard (
      userId VARCHAR(36) PRIMARY KEY,
      points INT DEFAULT 0,
      rank INT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(userId)
    )`;
  try {
    await db.query(query);
    console.log("✅ Leaderboard table ready.");
  } catch (err) {
    console.error("❌ Leaderboard table error:", err.message);
  }
};

createLeaderboardTable();
