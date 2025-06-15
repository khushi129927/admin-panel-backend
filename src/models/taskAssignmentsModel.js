const db = require("../config/db");

const createTaskAssignmentTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS task_assignments (
      id VARCHAR(36) PRIMARY KEY,
      taskId VARCHAR(36) NOT NULL,
      userId VARCHAR(36) NOT NULL,
      assignedBy VARCHAR(100),
      status ENUM('assigned', 'completed', 'in-progress') DEFAULT 'assigned',
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES task(taskId) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
    )
  `;

  try {
    await db.query(createTableQuery);
    console.log("✅ task_assignments table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating task_assignments table:", err.message);
  }
};

createTaskAssignmentTable();

module.exports = db;
