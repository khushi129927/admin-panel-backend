const db = require("../config/db");

const createPaymentsTable = async () => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        paymentId VARCHAR(50) PRIMARY KEY,
        childId VARCHAR(36) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        razorpay_payment_id VARCHAR(100),
        razorpay_subscription_id VARCHAR(100),
        razorpay_signature TEXT,
        status VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (childId) REFERENCES children(childId) ON DELETE CASCADE
      )
    `);
    console.log("✅ payments table created or already exists.");
  } catch (err) {
    console.error("❌ Error creating payments table:", err.message);
  }
};

module.exports = createPaymentsTable;
