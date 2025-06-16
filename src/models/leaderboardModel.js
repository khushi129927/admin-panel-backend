const db = require("../config/db");

const createLeaderboardTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS leaderboard (
      childId VARCHAR(36) PRIMARY KEY,
      totalScore INT DEFAULT 0,
      averageScore FLOAT DEFAULT 0,
      rank INT DEFAULT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (childId) REFERENCES children(childId)
    )
  `;
  try {
    await db.query(query);
    console.log("✅ Leaderboard table ready.");
  } catch (err) {
    console.error("❌ Leaderboard table error:", err.message);
  }
};

createLeaderboardTable();
