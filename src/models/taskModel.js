const db = require("../config/db");

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: ", err.stack);
    return;
  }
  console.log("Database connected");

  const createTaskTable = `
    CREATE TABLE task (
  id VARCHAR(36) PRIMARY KEY,
  mcq1 TEXT NOT NULL,
  mcq2 TEXT NOT NULL,
  mcq3 TEXT NOT NULL,
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
  task_owner VARCHAR(100),
  week VARCHAR(255),
  task TEXT,
  age_group VARCHAR(100),
  quarter VARCHAR(50),
  created_at DATETIME
);

  `;

  db.query(createTaskTable, (err) => {
    if (err) console.error("Error creating Task table: ", err);
    else console.log("Task table is ready");
  });
});
