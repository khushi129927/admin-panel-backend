const db = require("../config/db");

const createTermsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS terms_of_service (
      termsOfServiceId INT PRIMARY KEY AUTO_INCREMENT,
      content TEXT NOT NULL
    )`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS terms_acceptance (
      userId VARCHAR(36),
      accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (userId),
      FOREIGN KEY (userId) REFERENCES users(id)
    )`);

  console.log("✅ Terms tables ready.");
};

createTermsTable();
