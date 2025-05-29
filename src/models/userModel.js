const db = require("../config/db");

const initUserInheritance = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        userId VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        type ENUM('parent', 'child') NOT NULL
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS parents (
        parentId VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255),
        dob DATE,
        gender VARCHAR(10),
        education VARCHAR(255),
        profession VARCHAR(255),
        hobbies TEXT,
        favourite_food VARCHAR(255),
        FOREIGN KEY (parentId) REFERENCES users(userId) ON DELETE CASCADE
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS children (
        childId VARCHAR(36) PRIMARY KEY,
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

    console.log("✅ All tables initialized");
  } catch (err) {
    console.error("❌ Table Init Error:", err.message);
  }
};

initUserInheritance();
