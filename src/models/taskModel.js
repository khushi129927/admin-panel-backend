const db = require("../config/db");

// Create Task Table (if not exists)
const createTaskTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS task (
      taskId VARCHAR(255) PRIMARY KEY,
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
      age_group VARCHAR(20),  -- ✅ Added field
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await db.query(createTableQuery);
    console.log("✅ Task table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating task table:", err.message);
  }
};
// Initialize the table creation
createTaskTable();

const createTaskAssignmentTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS task_assignment (
      taskAssignmentId VARCHAR(36) PRIMARY KEY,
      taskId VARCHAR(255),
      userId VARCHAR(36),
      status ENUM('pending', 'completed') DEFAULT 'pending',
      feedback TEXT,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      FOREIGN KEY (taskId) REFERENCES task(taskId) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
    )
  `;

  try {
    await db.query(createTableQuery);
    console.log("✅ task_assignment table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating task_assignment table:", err.message);
  }
};

createTaskAssignmentTable();