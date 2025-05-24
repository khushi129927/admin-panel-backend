const db = require("../config/db");

const createReviewsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100),
      review TEXT NOT NULL,
      rating INT CHECK (rating BETWEEN 1 AND 5),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
  try {
    await db.query(query);
    console.log("✅ Reviews table created.");
  } catch (err) {
    console.error("❌ Reviews table error:", err.message);
  }
};

createReviewsTable();
