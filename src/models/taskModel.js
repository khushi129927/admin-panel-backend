const db = require("../config/db");

// Create Task Table (if not exists)
const createTaskTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS task (
      id VARCHAR(255) PRIMARY KEY,
      mcq1 TEXT,
      mcq2 TEXT,
      mcq3 TEXT,
      mcq1_opt1 TEXT,
      mcq1_opt2 TEXT,
      mcq1_opt3 TEXT,
      mcq1_opt4 TEXT,
      mcq2_opt1 TEXT,
      mcq2_opt2 TEXT,
      mcq2_opt3 TEXT,
      mcq2_opt4 TEXT,
      mcq3_opt1 TEXT,
      mcq3_opt2 TEXT,
      mcq3_opt3 TEXT,
      mcq3_opt4 TEXT,
      week VARCHAR(255),
      task_owner VARCHAR(255),
      task TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

  try {
    await db.query(createTableQuery);
    console.log("✅ Task table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating task table:", err.message);
  }
};

// Initialize the table creation
createTaskTable();
