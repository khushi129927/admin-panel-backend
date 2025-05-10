const db = require("../config/db");

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: ", err.stack);
    return;
  }
  console.log("Database connected");

  const createTestTable = `
    CREATE TABLE IF NOT EXISTS tests (
      id VARCHAR(36) PRIMARY KEY,
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
    )
  `;

  db.query(createTestTable, (err) => {
    if (err) console.error("Error creating test table: ", err);
    else console.log("✅ Tests table ready");
  });
});
