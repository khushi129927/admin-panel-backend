const db = require("../config/db");

const createTestTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tests (
      testId VARCHAR(36) PRIMARY KEY,
      quarter VARCHAR(100),
      age VARCHAR(100),
      objective TEXT,
      question TEXT NOT NULL,
      option1 TEXT,
      points1 NUMERIC,
      option2 TEXT,
      points2 NUMERIC,
      option3 TEXT,
      points3 NUMERIC,
      option4 TEXT,
      points4 NUMERIC,
      created_at DATETIME
    )`;

  try {
    await db.query(createTableQuery);
    console.log("✅ Tests table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating Tests table:", err.message);
  }
};

createTestTable();