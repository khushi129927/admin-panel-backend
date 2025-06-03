const db = require("../config/db");

const initUserInheritance = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        userId VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255),
        dob DATE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        -- Parent-specific fields
        gender VARCHAR(10),
        education VARCHAR(255),
        profession VARCHAR(255),
        hobbies TEXT,
        favourite_food VARCHAR(255)
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS children (
        childId VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        name VARCHAR(255),
        dob DATE,
        gender VARCHAR(10),
        school VARCHAR(255),
        grades VARCHAR(50),
        hobbies TEXT,
        dream_career VARCHAR(255),
        favourite_sports VARCHAR(255),
        blood_group VARCHAR(10),
        FOREIGN KEY (childId) REFERENCES users(userId) ON DELETE CASCADE
      );
    `);

    console.log("✅ Unified users table with parent attributes");
  } catch (err) {
    console.error("❌ Table Init Error:", err.message);
  }
};

initUserInheritance();
