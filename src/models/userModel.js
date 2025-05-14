const db = require("../config/db");

// Create User Table (if not exists)
const createUserTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      dob DATE,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    )`;

  try {
    await db.query(createTableQuery);
    console.log("✅ Users table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating Users table:", err.message);
  }
};

createUserTable();