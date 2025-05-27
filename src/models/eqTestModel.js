const db = require("../config/db");

const createEqTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS eq_tests (
      epTestsId VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255),
      description TEXT
    )`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS eq_questions (
      epQuestionsId VARCHAR(36) PRIMARY KEY,
      testId VARCHAR(36),
      question TEXT,
      options JSON,
      correctOption VARCHAR(10),
      FOREIGN KEY (testId) REFERENCES eq_tests(epTestsId) ON DELETE CASCADE
    )`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS eq_results (
      epResultsId VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36),
      testId VARCHAR(36),
      score INT,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(userId),
      FOREIGN KEY (testId) REFERENCES eq_tests(epTestsId)
    )`);

  console.log("✅ EQ tables created.");
};

createEqTables();
