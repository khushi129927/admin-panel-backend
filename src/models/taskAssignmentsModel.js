const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// 📦 Create table if not exists
const createTaskAssignmentTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS task_assignments (
      id VARCHAR(36) PRIMARY KEY,
      taskId VARCHAR(36) NOT NULL,
      childId VARCHAR(36) NOT NULL,
      assignedBy VARCHAR(100),
      status ENUM('assigned', 'completed', 'in-progress') DEFAULT 'assigned',
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME NULL,
      UNIQUE KEY unique_assignment (taskId, childId),
      FOREIGN KEY (taskId) REFERENCES task(taskId) ON DELETE CASCADE,
      FOREIGN KEY (childId) REFERENCES children(childId) ON DELETE CASCADE
    );
  `;

  try {
    await db.query(createTableQuery);
    console.log("✅ task_assignments table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating task_assignments table:", err.message);
  }
};

// ✅ Insert or Update assignment as completed
const markTaskAsCompleted = async (taskId, childId) => {
  const id = uuidv4();
  await db.execute(
    `INSERT INTO task_assignments (id, taskId, childId, status, completed_at)
     VALUES (?, ?, ?, 'completed', NOW())
     ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW()`,
    [id, taskId, childId]
  );
};

createTaskAssignmentTable();

module.exports = {
  markTaskAsCompleted,
};
