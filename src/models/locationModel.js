const db = require("../config/db");

const createLocationTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS locations (
      userId VARCHAR(36) PRIMARY KEY,
      city VARCHAR(100),
      state VARCHAR(100),
      country VARCHAR(100),
      latitude DECIMAL(9,6),
      longitude DECIMAL(9,6),
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
    )`;
  try {
    await db.query(query);
    console.log("✅ Locations table created.");
  } catch (err) {
    console.error("❌ Location table error:", err.message);
  }
};

createLocationTable();
