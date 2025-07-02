const db = require("../config/db");

const createSubscriptionTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS subscriptions (
      subscriptionId VARCHAR(36) PRIMARY KEY,
      childId VARCHAR(36) NOT NULL,
      plan VARCHAR(50) NOT NULL, -- e.g., 'monthly', 'yearly'
      status VARCHAR(50) DEFAULT 'created',
      razorpay_subscription_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (childId) REFERENCES children(childId) ON DELETE CASCADE
    )
  `;

  try {
    await db.execute(createTableQuery);
    console.log("✅ Subscriptions table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating Subscriptions table:", err.message);
  }
};

createSubscriptionTable();
