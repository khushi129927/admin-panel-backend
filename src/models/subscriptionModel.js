const db = require("../config/db");

const createSubscriptionTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS subscriptions (
      subscriptionId VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36) NOT NULL,
      plan VARCHAR(255) NOT NULL,
      status ENUM('active', 'inactive') NOT NULL,
      FOREIGN KEY (subscriptionId) REFERENCES users(userId) ON DELETE CASCADE
    )`;

  try {
    await db.query(createTableQuery);
    console.log("✅ Subscriptions table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating Subscriptions table:", err.message);
  }
};

createSubscriptionTable();