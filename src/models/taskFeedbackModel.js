const db = require("../config/db");

const createFeedbackTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS task_feedback (
      taskFeedbackId VARCHAR(36) PRIMARY KEY,
      taskId VARCHAR(36) NOT NULL,
      userId VARCHAR(36) NOT NULL,
      rating INT,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (taskId) REFERENCES task(taskId),
      FOREIGN KEY (userId) REFERENCES users(userId)
    )`;
  try {
    await db.query(query);
    console.log("✅ Task feedback table ready.");
  } catch (err) {
    console.error("❌ Feedback table error:", err.message);
  }
};

createFeedbackTable();
